import User from '../models/User';
import shopifyService from './shopifyService';
import { decrypt } from '../utils/encryption';

/**
 * Tự động đăng ký webhooks Shopify cho tất cả Sellers đã cấu hình.
 * Được gọi khi backend khởi động - đảm bảo ngay cả khi server restart,
 * mọi webhook vẫn trỏ đúng vào APP_BASE_URL hiện tại.
 */
export async function autoRegisterAllWebhooks(): Promise<void> {
    const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    if (appBaseUrl.includes('localhost')) {
        console.warn('⚠️  [Webhooks] APP_BASE_URL là localhost — Shopify không thể gọi được!');
        console.warn('⚠️  Hãy chạy ngrok và đặt APP_BASE_URL trong .env trước khi start backend.');
        return;
    }

    console.log(`🔗 [Webhooks] Đang đăng ký webhooks với URL: ${appBaseUrl}`);

    try {
        const sellers = await User.find({
            'sellerConfig.shopifyDomain': { $exists: true, $ne: '' },
            'sellerConfig.accessToken': { $exists: true, $ne: '' },
        });

        if (sellers.length === 0) {
            console.log('ℹ️  [Webhooks] Không có seller nào được cấu hình, bỏ qua.');
            return;
        }

        for (const seller of sellers) {
            const { shopifyDomain, accessToken } = seller.sellerConfig!;
            if (!shopifyDomain || !accessToken) continue;

            try {
                // Giải mã token trước khi đăng ký với Shopify
                const decryptedToken = decrypt(accessToken);
                await shopifyService.registerWebhooks(shopifyDomain, decryptedToken, appBaseUrl);
                console.log(`✅ [Webhooks] Đã đăng ký cho shop: ${shopifyDomain}`);
            } catch (err: any) {
                console.error(`❌ [Webhooks] Thất bại cho ${shopifyDomain}: ${err.message}`);
            }
        }
    } catch (err: any) {
        console.error('❌ [Webhooks] Lỗi khi auto-register:', err.message);
    }
}
