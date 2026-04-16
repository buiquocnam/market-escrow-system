import { ethers } from 'ethers';
import CheckoutSession, { SessionStatus } from '../models/CheckoutSession';
import Escrow from '../models/Escrow';
import transactionService from './transactionService';
import config from '../config';
import { EscrowStatus } from '@shared/types';

/**
 * MonitoringService — Targeted Wallet Watcher
 *
 * Thay vì quét toàn bộ block mỗi 10s,
 * mỗi đơn hàng WAITING sẽ được theo dõi ví riêng trong đúng 15 phút.
 */
class MonitoringService {
    private provider: ethers.JsonRpcProvider;
    /** Set các depositAddress đang được theo dõi (tránh duplicate watcher) */
    private watching: Set<string> = new Set();

    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
    }

    /**
     * Gọi khi server khởi động để resume theo dõi
     * các đơn hàng WAITING còn tồn tại trong DB.
     */
    async start() {
        const pendingSessions = await CheckoutSession.find({ status: SessionStatus.WAITING });
        console.log(`[Monitor] Khôi phục ${pendingSessions.length} phiên đang chờ thanh toán.`);
        for (const session of pendingSessions) {
            this.watchSession(session.sessionId, session.depositAddress, session.expiresAt);
        }

        // Worker tự động giải ngân sau 3 ngày (chạy mỗi giờ)
        this.autoReleaseWorker();
    }

    /**
     * Bắt đầu theo dõi ví cho một đơn hàng cụ thể.
     * Tự dừng khi thanh toán thành công hoặc hết 15 phút.
     */
    watchSession(sessionId: string, depositAddress: string, expiresAt: Date) {
        const addr = depositAddress.toLowerCase();
        if (this.watching.has(addr)) return; // đã có watcher rồi
        this.watching.add(addr);

        const msRemaining = expiresAt.getTime() - Date.now();
        if (msRemaining <= 0) {
            this.watching.delete(addr);
            return;
        }

        console.log(`[Monitor] Bắt đầu theo dõi ví ${addr} (còn ${Math.round(msRemaining / 1000)}s).`);

        const stopTimer = setTimeout(() => {
            this.expireAndStop(sessionId, addr);
        }, msRemaining);

        // Lắng nghe giao dịch ETH gửi đến ví này qua provider events
        const filter = { address: null, topics: [] }; // Không dùng event filter — dùng polling nhẹ
        this.pollWallet(sessionId, addr, stopTimer);
    }

    /**
     * Poll ví mỗi 5s cho đến khi phát hiện tx hoặc timeout.
     */
    private async pollWallet(sessionId: string, addr: string, stopTimer: NodeJS.Timeout) {
        let lastBlock = await this.provider.getBlockNumber();

        const tick = async () => {
            if (!this.watching.has(addr)) return; // watcher đã bị dừng

            try {
                const currentBlock = await this.provider.getBlockNumber();
                for (let b = lastBlock + 1; b <= currentBlock; b++) {
                    const block = await this.provider.getBlock(b, true);
                    if (!block?.prefetchedTransactions) continue;

                    for (const tx of block.prefetchedTransactions) {
                        if (tx.to?.toLowerCase() === addr) {
                            console.log(`[Monitor] PHÁT HIỆN THANH TOÁN cho ${addr}! TxHash: ${tx.hash}`);
                            clearTimeout(stopTimer);
                            this.watching.delete(addr);
                            await this.handlePaymentDetected(sessionId, addr, tx.hash, tx.value);
                            return; // dừng polling
                        }
                    }
                }
                lastBlock = currentBlock;
            } catch (err) {
                console.error(`[Monitor] Lỗi poll ví ${addr}:`, err);
            }

            if (this.watching.has(addr)) {
                setTimeout(tick, 5000);
            }
        };

        setTimeout(tick, 5000);
    }

    private async expireAndStop(sessionId: string, addr: string) {
        this.watching.delete(addr);
        await CheckoutSession.updateOne(
            { sessionId, status: SessionStatus.WAITING },
            { status: SessionStatus.EXPIRED }
        );
        console.log(`[Monitor] Đơn hàng ${sessionId} đã hết hạn (15p không thanh toán).`);
    }

    private async handlePaymentDetected(sessionId: string, address: string, txHash: string, value: bigint) {
        try {
            const session = await CheckoutSession.findOne({ sessionId, status: SessionStatus.WAITING });
            if (!session) return;

            session.status = SessionStatus.PAID;
            session.txHash = txHash;
            session.paidAt = new Date();
            await session.save();

            await this.depositToEscrowContract(session);
        } catch (err) {
            console.error('[Monitor] Handle Payment Error:', err);
        }
    }

    private async depositToEscrowContract(session: any) {
        try {
            const wallet = new ethers.Wallet(session.privateKey, this.provider);
            const contract = new ethers.Contract(
                process.env.ESCROW_CONTRACT_ADDRESS || '',
                ['function deposit(address _seller) external payable'],
                wallet
            );

            console.log(`[Escrow] Đang nạp tiền vào Smart Contract cho ${session.productTitle}...`);
            const depositAmount = ethers.parseEther((session.amountEth * 0.999).toString());

            const tx = await contract.deposit(session.sellerAddress, { value: depositAmount });
            const receipt = await tx.wait();

            const iface = new ethers.Interface([
                'event EscrowCreated(uint256 indexed escrowId, address buyer, address seller, uint256 amount)'
            ]);
            const log = receipt.logs.find(
                (l: any) => l.topics[0] === iface.getEvent('EscrowCreated')!.topicHash
            );

            if (log) {
                const parsed = iface.parseLog(log);
                session.escrowId = Number(parsed?.args[0]);
                await session.save();
                console.log(`[Escrow] Thành công! Escrow ID: ${session.escrowId}`);

                // --- TỰ ĐỘNG TẠO BẢN GHI ESCROW VÀ ĐỒNG BỘ SHOPIFY ---
                console.log(`[Escrow] Đang tạo bản ghi Escrow và đồng bộ Shopify cho session ${session.sessionId}...`);
                const escrow = new Escrow({
                    txHash: session.txHash,
                    buyerAddress: session.depositAddress, // Buyer gửi vào ví A
                    sellerAddress: session.sellerAddress,  // Wallet B (Payout)
                    productTitle: session.productTitle,
                    amountEth: session.amountEth,
                    priceUsd: session.priceUsd,
                    userId: session.userId,
                    sessionId: session.sessionId,
                    status: EscrowStatus.PENDING
                });
                await escrow.save();

                // Đồng bộ sang Shopify (Không block flow chính)
                transactionService.syncOrderToShopify(escrow, {
                    productTitle: session.productTitle,
                    priceUsd: session.priceUsd,
                    amountEth: session.amountEth,
                    buyerAddress: session.depositAddress,
                    txHash: session.txHash
                }).catch(err => console.error('[Shopify] Sync Error:', err));
            }
        } catch (err) {
            console.error('[Escrow] Deposit Error:', err);
        }
    }

    public async releaseEscrow(session: any) {
        try {
            const wallet = new ethers.Wallet(session.privateKey, this.provider);
            const contract = new ethers.Contract(
                process.env.ESCROW_CONTRACT_ADDRESS || '',
                ['function release(uint256 _escrowId) external'],
                wallet
            );

            console.log(`[Escrow] Đang thực hiện Release cho Escrow #${session.escrowId}`);
            const tx = await contract.release(session.escrowId);
            await tx.wait();

            session.status = SessionStatus.COMPLETED;
            await session.save();

            // Cập nhật trạng thái của bản ghi Escrow liên quan
            await Escrow.updateOne(
                { sessionId: session.sessionId },
                { status: EscrowStatus.RELEASED }
            );

            console.log(`[Escrow] Giải ngân thành công cho session ${session.sessionId}`);
            return true;
        } catch (err) {
            console.error('[Escrow] Release Error:', err);
            return false;
        }
    }

    private async autoReleaseWorker() {
        while (true) {
            try {
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                const sessions = await CheckoutSession.find({
                    status: SessionStatus.PAID,
                    paidAt: { $lte: threeDaysAgo }
                });

                for (const session of sessions) {
                    console.log(`[Auto-Release] Giải ngân tự động cho session ${session.sessionId}`);
                    await this.releaseEscrow(session);
                }
            } catch (err) {
                console.error('[Auto-Release] Error:', err);
            }
            await new Promise(resolve => setTimeout(resolve, 3_600_000)); // mỗi 1 giờ
        }
    }
}

export default new MonitoringService();
