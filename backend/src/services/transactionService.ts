import Escrow, { IEscrowDocument } from '../models/Escrow';
import axios from 'axios';
import config from '../config';
import { IEscrow, EscrowStatus } from '@shared/types';
import CheckoutSession from '../models/CheckoutSession';

/**
 * Transaction Service - Xử lý nghiệp vụ Escrow và đồng bộ dữ liệu
 */
class TransactionService {
    /**
     * Lưu vết Escrow vào Database sau khi User nạp tiền thành công
     */
    async createEscrow(data: Partial<IEscrow> & { userId: string }): Promise<IEscrowDocument> {
        const { txHash, buyerAddress, sellerAddress, productTitle, amountEth, priceUsd, userId } = data;
        
        let escrow = await Escrow.findOne({ txHash });
        if (!escrow) {
          escrow = new Escrow({
            txHash,
            buyerAddress,
            sellerAddress: sellerAddress || "0xFC0Fe88229F8aD065bDE0D23A0B33A4e0B65701c", // Fallback to mock if not provided
            productTitle,
            amountEth,
            priceUsd,
            userId,
            status: EscrowStatus.PENDING
          });
          await (escrow as any).save();
        }
        return escrow as IEscrowDocument;
    }

    /**
     * Đồng bộ đơn hàng sang Shopify Admin
     */
    async syncOrderToShopify(escrow: IEscrowDocument, data: any): Promise<any> {
        if (escrow.shopifyOrderId) {
            console.log(`[Shopify] Order already synced for TxHash ${escrow.txHash}. Skipping.`);
            return { id: escrow.shopifyOrderId };
        }
        
        const { productTitle, priceUsd, amountEth, buyerAddress, txHash } = data;
        
        const orderData = {
          order: {
            line_items: [{ title: productTitle || "Crypto Escrow Item", price: priceUsd, quantity: 1 }],
            financial_status: "paid",
            gateway: "Crypto Escrow (Testnet)",
            tags: "web3, escrow",
            note: `Paid via MetaMask.\nBuyer: ${buyerAddress}\nTxHash: ${txHash}\nAmount: ${amountEth} ETH`,
            send_receipt: false
          }
        };

        const shopURL = `https://${config.SHOPIFY.STORE_DOMAIN}/admin/api/2024-01/orders.json`;
        const response = await axios.post(shopURL, orderData, {
            headers: {
                'X-Shopify-Access-Token': config.SHOPIFY.ADMIN_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.order) {
            await Escrow.findOneAndUpdate(
                { txHash },
                { shopifyOrderId: response.data.order.id }
            );
        }
        return response.data.order;
    }

    /**
     * Lấy danh sách giao dịch (có thể lọc theo User hoặc Seller Wallet)
     */
    async getAllTransactions(userId?: string, sellerAddress?: string): Promise<IEscrowDocument[]> {
        const query: any = {};
        if (userId) query.userId = userId;
        if (sellerAddress) query.sellerAddress = sellerAddress;
        
        return await Escrow.find(query).sort({ createdAt: -1 });
    }

    /**
     * Cập nhật trạng thái Released cho Escrow
     */
    async releaseFunds(txHash: string): Promise<IEscrowDocument | null> {
        const escrow = await Escrow.findOne({ txHash });
        if (!escrow) return null;

        // Nếu có sessionId, thực hiện giải ngân thực tế trên Blockchain
        if ((escrow as any).sessionId) {
            const session = await CheckoutSession.findOne({ sessionId: (escrow as any).sessionId });
            if (session && session.escrowId) {
                console.log(`[Escrow] Khởi tạo giải ngân trên Blockchain cho session ${session.sessionId}...`);
                
                // Dynamic import để tránh circular dependency với monitoringService
                const monitoringService = (await import('./monitoringService')).default;
                const success = await monitoringService.releaseEscrow(session);
                
                if (!success) {
                    throw new Error("Giao dịch giải ngân trên Blockchain thất bại.");
                }
            }
        }

        // Cập nhật trạng thái trong DB (monitoringService cũng có cập nhật nhưng gọi ở đây cho chắc chắn)
        escrow.status = EscrowStatus.RELEASED;
        await escrow.save();
        
        return escrow;
    }
}

export default new TransactionService();
