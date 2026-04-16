import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { decrypt } from '../utils/encryption';

/**
 * 🔐 Middleware: Xác thực chữ ký HMAC từ Shopify Webhook
 * Yêu cầu: Đã cấu hình express.raw() cho route này.
 */
const shopifyVerifier = (req: any, res: Response, next: NextFunction) => {
    const hmacHeader = req.get('x-shopify-hmac-sha256');
    const shopDomain = req.get('x-shopify-shop-domain');
    const rawBody = req.body;

    if (!hmacHeader || !shopDomain || !Buffer.isBuffer(rawBody)) {
        console.error("❌ Webhook Error: Missing HMAC/Domain header or Body is not a Buffer.");
        return res.status(401).send("Invalid Webhook Request");
    }

    // --- Dynamic Multi-Seller Secret Lookup ---
    const findSellerAndVerify = async () => {
        try {
            // Tìm người bán dựa trên domain shop gửi webhook
            const seller = await User.findOne({ 'sellerConfig.shopifyDomain': shopDomain });
            
            if (!seller || !seller.sellerConfig || !seller.sellerConfig.webhookSecret) {
                console.error(`❌ Webhook Error: No registered seller or missing webhook secret for ${shopDomain}`);
                return res.status(401).send("Unauthorized store or missing webhook secret");
            }

            // Giải mã secret của người bán
            const secretStr = decrypt(seller.sellerConfig.webhookSecret).trim();
            
            // Tính toán HMAC sử dụng chuỗi Secret cụ thể của Seller này
            const generatedHash = crypto
                .createHmac('sha256', secretStr)
                .update(rawBody)
                .digest('base64');

            if (generatedHash !== hmacHeader) {
                console.error(`❌ Shopify HMAC Verification Failed for ${shopDomain}!`);
                // Ghi lại lỗi Secret vào DB để notify user
                await User.updateOne(
                    { _id: seller._id },
                    { 
                        $set: { 
                            'sellerConfig.webhookStatus': 'error',
                            'sellerConfig.webhookLastError': 'Invalid HMAC Signature (Wrong Secret)'
                        } 
                    }
                );
                return res.status(401).send("Unauthorized Webhook. Invalid HMAC.");
            }

            // --- Success: Update Status ---
            if (seller.sellerConfig.webhookStatus !== 'verified') {
                await User.updateOne(
                    { _id: seller._id },
                    { $set: { 'sellerConfig.webhookStatus': 'verified', 'sellerConfig.webhookLastError': '' } }
                );
            }

            console.log(`✅ Shopify Webhook Verified for ${shopDomain}.`);
            
            // Parse JSON từ Buffer để các controller xử lý như object bình thường
            req.body = JSON.parse(rawBody.toString('utf8'));
            next();
        } catch (err: any) {
            console.error("❌ Webhook Processing Error:", err.message);
            return res.status(500).send("Internal Server Error during verification");
        }
    };

    findSellerAndVerify();
};

export default shopifyVerifier;
