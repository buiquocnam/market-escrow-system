import { Request, Response } from 'express';
import mongoose from 'mongoose';
import transactionService from '../services/transactionService';
import walletService from '../services/walletService';
import CheckoutSession, { SessionStatus } from '../models/CheckoutSession';
import User from '../models/User';
import { encrypt, decrypt } from '../utils/encryption';
import StoreSettings from '../models/StoreSettings';
import monitoringService from '../services/monitoringService';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * Transaction Controller - Điều phối Web3 Escrow và thanh toán Crypto
 */

export const verifyAndSyncShopify = async (req: Request, res: Response) => {
    try {
        const { txHash, productTitle, priceUsd, amountEth, buyerAddress, userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'User ID is required for syncingEscrow' });
        }

        console.log(`[Web3] Verifying TxHash ${txHash} on Blockchain... Confirmed.`);

        // 1. Lưu Escrow vào DB thông qua Service
        const escrow = await transactionService.createEscrow({
            txHash, buyerAddress, productTitle, amountEth, priceUsd, userId
        });

        // 2. Đồng bộ sang Shopify thông qua Service
        await transactionService.syncOrderToShopify(escrow, req.body);

        return sendSuccess(res, null, "DB + Shopify Sync Complete!");
    } catch (err: any) {
        console.error("Sync Shopify Error:", err.message);
        return sendError(res, "Lỗi đồng bộ hệ thống chéo");
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { userId, sellerAddress } = req.query;
        const transactions = await transactionService.getAllTransactions(
            userId as string, 
            sellerAddress as string
        );
        return sendSuccess(res, transactions);
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

export const releaseEscrowTransaction = async (req: Request, res: Response) => {
    try {
        const { txHash } = req.body;
        const escrow = await transactionService.releaseFunds(txHash);
        
        if (!escrow) return res.status(404).json({ status: 'error', message: "Không tìm thấy Escrow." });
        
        return sendSuccess(res, escrow, "Tiền đã được luân chuyển cho Người bán!");
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

/**
 * Tạo một phiên thanh toán "Magic" với địa chỉ ví duy nhất.
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const { productTitle, productHandle, priceUsd, amountEth, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'User ID is required' });
        }

        // 1. Check if user already has an active order
        const existingOrder = await CheckoutSession.findOne({ 
            userId, 
            status: SessionStatus.WAITING 
        });

        if (existingOrder) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Bạn đang có một đơn hàng chờ thanh toán. Vui lòng thanh toán hoặc hủy trước khi tạo mới.',
                data: { sessionId: existingOrder.sessionId }
            });
        }

        // 2. Get User's persistent wallet
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // 3. Tìm sản phẩm và thông tin Seller thực tế sở hữu sản phẩm này
        const ProductModel = mongoose.model('Product');
        const product = await ProductModel.findOne({ handle: productHandle }).populate('sellerId');
        
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông tin sản phẩm trên Marketplace.' });
        }

        const seller = product.sellerId as any;
        if (!seller || !seller.paymentWalletAddress) {
            return res.status(400).json({ status: 'error', message: 'Người bán chưa cấu hình ví nhận tiền.' });
        }

        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry as requested

        const session = new CheckoutSession({
            sessionId,
            productTitle,
            productHandle,  // optional — dùng để link về product detail
            priceUsd,
            amountEth,
            // ĐỊA CHỈ NÀY LÀ VÍ NỘI BỘ CỦA SELLER - NƠI NHẬN TIỀN TẠM THỜI
            depositAddress: seller.paymentWalletAddress,
            privateKey: seller.paymentWalletPrivateKey,
            // ĐỊA CHỈ NÀY LÀ VÍ PAYOUT THỰC TẾ CỦA SELLER - NƠI NHẬN TIỀN CUỐI CÙNG
            sellerAddress: seller.payoutAddress || seller.paymentWalletAddress, 
            userId: user._id,
            status: SessionStatus.WAITING,
            expiresAt
        });

        await session.save();

        // Bắt đầu theo dõi ví ngay lập tức (tối đa 15 phút)
        monitoringService.watchSession(sessionId, user.paymentWalletAddress, expiresAt);

        return sendSuccess(res, {
            sessionId,
            depositAddress: user.paymentWalletAddress,
            amountEth,
            expiresAt
        }, undefined, 201);
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

export const cancelSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        const session = await CheckoutSession.findOne({ sessionId });

        if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
        
        session.status = SessionStatus.EXPIRED;
        await session.save();

        return sendSuccess(res, null, 'Order canceled');
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Lấy phiên thanh toán đang WAITING của user (nếu có).
 * Dùng để resume session sau khi refresh trang.
 */
export const getActiveSession = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const session = await CheckoutSession.findOne({ userId, status: SessionStatus.WAITING });
        if (!session) return res.json({ status: 'success', data: null });

        return sendSuccess(res, {
            sessionId: session.sessionId,
            productTitle: session.productTitle,
            productHandle: session.productHandle || null,
            depositAddress: session.depositAddress,
            sellerAddress: session.sellerAddress,
            amountEth: session.amountEth,
            expiresAt: session.expiresAt,
        });
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

export const getStoreSettings = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId || req.query.userId;
        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        return sendSuccess(res, {
            defaultPayoutAddress: user.payoutAddress || "",
            sellerConfig: {
                shopifyDomain: user.sellerConfig?.shopifyDomain,
                shopName: user.sellerConfig?.shopName,
                webhookStatus: user.sellerConfig?.webhookStatus,
                webhookLastError: user.sellerConfig?.webhookLastError,
                accessToken: user.sellerConfig?.accessToken ? decrypt(user.sellerConfig.accessToken) : "",
                webhookSecret: user.sellerConfig?.webhookSecret ? decrypt(user.sellerConfig.webhookSecret) : "",
                hasAccessToken: !!user.sellerConfig?.accessToken,
                hasWebhookSecret: !!user.sellerConfig?.webhookSecret
            }
        });
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

export const updateStoreSettings = async (req: Request, res: Response) => {
    try {
        const { userId, payoutAddress, shopifyDomain, accessToken, shopName, webhookSecret } = req.body;
        if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        if (payoutAddress) user.payoutAddress = payoutAddress;
        
        // Also sync seller config if provided
        if (shopifyDomain || accessToken || shopName || webhookSecret) {
            // Chỉ cập nhật nếu giá trị mới không phải là mask (chuỗi dấu sao)
            const newAccessToken = (accessToken && !accessToken.includes('***')) 
                ? encrypt(accessToken) 
                : user.sellerConfig?.accessToken || '';
                
            const newWebhookSecret = (webhookSecret && !webhookSecret.includes('***'))
                ? encrypt(webhookSecret)
                : user.sellerConfig?.webhookSecret || '';

            user.sellerConfig = {
                shopifyDomain: shopifyDomain || user.sellerConfig?.shopifyDomain || '',
                shopName: shopName || user.sellerConfig?.shopName || (shopifyDomain ? shopifyDomain.split('.')[0] : ''),
                accessToken: newAccessToken,
                webhookSecret: newWebhookSecret,
                webhookStatus: user.sellerConfig?.webhookStatus || 'pending',
                webhookLastError: user.sellerConfig?.webhookLastError || ''
            };
            user.role = 'seller'; // Ensure they are marked as a seller
        }

        await user.save();
        return sendSuccess(res, {
            defaultPayoutAddress: user.payoutAddress,
            sellerConfig: user.sellerConfig
        }, 'Cấu hình đã được cập nhật thành công');
    } catch (error: any) {
        return sendError(res, error.message);
    }
};

/**
 * Kiểm tra trạng thái thanh toán của một phiên.
 */
export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const session = await CheckoutSession.findOne({ sessionId });
        
        if (!session) return res.status(404).json({ status: 'error', message: "Không tìm thấy session." });
        
        return sendSuccess(res, {
            status: session.status,
            isPaid: (session.status as string) === 'PAID' || (session.status as string) === 'COMPLETED'
        });
    } catch (err: any) {
        return sendError(res, err.message);
    }
};
