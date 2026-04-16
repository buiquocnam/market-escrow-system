import { Request, Response } from 'express';
import shopifyService from '../services/shopifyService';
import User from '../models/User';
import productService from '../services/productService';
import Product from '../models/Product';
import Category from '../models/Category';
import { decrypt, encrypt } from '../utils/encryption';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * Shopify Controller - Xử lý Webhooks và Products
 */

export const handleProductCreate = async (req: Request, res: Response) => {
    try {
        const shopifyProduct = req.body;

        const shopDomain = req.get('x-shopify-shop-domain');
        
        console.log(`Nhận Webhook [Product] từ Shop: ${shopDomain} - ${shopifyProduct.title}`);
        
        // Find the seller owning this shop
        const seller = await User.findOne({ 'sellerConfig.shopifyDomain': shopDomain });
        if (!seller) {
            console.error(`Webhook Error: Không tìm thấy Seller ứng với domain ${shopDomain}`);
            return sendError(res, 'Seller not found for this domain', 404);
        }

        // Upsert into local database
        const productData = {
            shopifyId: `gid://shopify/Product/${shopifyProduct.id}`, // Webhook gives numerical ID, we store GID for consistency
            title: shopifyProduct.title,
            handle: shopifyProduct.handle,
            vendor: shopifyProduct.vendor,
            priceUsd: parseFloat(shopifyProduct.variants?.[0]?.price || 0),
            imageSrc: shopifyProduct.images?.[0]?.src || "https://placehold.co/600x400?text=No+Image",
            category: shopifyProduct.product_type || 'General',
            tags: shopifyProduct.tags?.split(',').map((t: string) => t.trim()) || [],
            descriptionHtml: shopifyProduct.body_html,
            shopName: seller.sellerConfig?.shopName || shopDomain,
            sellerWalletAddress: seller.paymentWalletAddress,
            sellerId: seller._id,
            lastSyncedAt: new Date()
        };

        await Product.findOneAndUpdate(
            { shopifyId: productData.shopifyId },
            { $set: productData },
            { upsert: true, new: true }
        );
        
        // Cập nhật Registry Category nếu là sản phẩm mới
        if (productData.category) {
            const slug = productData.category.toLowerCase().replace(/\s+/g, '-');
            Category.findOneAndUpdate(
                { name: productData.category },
                { $set: { name: productData.category, slug } },
                { upsert: true }
            ).catch(err => console.error("Category Registry Webhook Error:", err.message));
        }

        console.log(`🛡️ Đã đồng bộ [${shopifyProduct.title}] lên Marketplace.`);
        return sendSuccess(res, { status_flag: 'PUBLISHED' });
    } catch (err: any) {
        console.error("Shopify Webhook Error:", err.message);
        return sendError(res, err.message);
    }
};

export const handleProductDelete = async (req: any, res: Response) => {
    try {
        const { id } = req.body;

        const shopifyId = `gid://shopify/Product/${id}`;
        
        console.log(`🗑️ Nhận Webhook [Product Delete]: ${shopifyId}`);
        await Product.deleteOne({ shopifyId });
        
        return sendSuccess(res, { status: 'deleted' });
    } catch (err: any) {
        console.error("Shopify Deletion Webhook Error:", err.message);
        return sendError(res, err.message);
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const { q, category, page, limit } = req.query;
        
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 40;
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};
        if (q) query.title = { $regex: q, $options: 'i' };
        if (category) query.category = category;

        const products = await Product.find(query)
            .populate('sellerId', 'paymentWalletAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Product.countDocuments(query);

        // Map local products back to the format the frontend expects (edges/node wrapper)
        // This maintains backward compatibility with the existing UI
        return sendSuccess(res, { 
            products: products.map(p => {
                const sellerInfo = p.sellerId as any;
                return {
                    node: {
                        id: p.shopifyId,
                        title: p.title,
                        handle: p.handle,
                        vendor: p.vendor,
                        productType: p.category,
                        tags: p.tags,
                        descriptionHtml: p.descriptionHtml,
                        shopName: p.shopName,
                        sellerWalletAddress: sellerInfo?.paymentWalletAddress || 'Unknown',
                        images: { edges: [{ node: { url: p.imageSrc } }] },
                        variants: { edges: [{ node: { price: p.priceUsd.toString() } }] }
                    }
                };
            }),
            pageInfo: {
                hasNextPage: total > skip + limitNum,
                total
            }
        });
    } catch (err: any) {
        console.error("Local Products Retrieval Error:", err.message);
        return sendError(res, "Failed to retrieve products from marketplace index");
    }
};

export const syncProducts = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        const count = await productService.syncProductsForSeller(user);
        return sendSuccess(res, { count }, `Đã đồng bộ thành công ${count} sản phẩm.`);
    } catch (err: any) {
        console.error("Manual Sync Error:", err.message);
        return sendError(res, err.message);
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        // 1. Truy vấn từ Registry tập trung
        let categories = await Category.find().sort({ name: 1 });

        // 2. Migration: Nếu Registry trống, quét từ bảng Product một lần
        if (categories.length === 0) {
            console.log("🛠️  Categories registry empty, migrating from Products index...");
            const distinctNames = await Product.distinct('category');
            const validNames = distinctNames.filter(Boolean);
            
            if (validNames.length > 0) {
                const migrationPromises = validNames.map(name => {
                    const slug = name.toLowerCase().replace(/\s+/g, '-');
                    return Category.findOneAndUpdate(
                        { name },
                        { $set: { name, slug } },
                        { upsert: true, new: true }
                    );
                });
                categories = await Promise.all(migrationPromises);
                console.log(`✅  Migrated ${validNames.length} categories to Registry.`);
            }
        }

        return sendSuccess(res, categories.map(c => c.name));
    } catch (err: any) {
        console.error("Shopify Categories Fetch Error:", err.message);
        return sendError(res, "Failed to fetch categories");
    }
};
export const updateSellerConfig = async (req: Request, res: Response) => {
    try {
        const { userId, shopifyDomain, accessToken, webhookSecret } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
        
        if (!shopifyDomain || !accessToken) {
            return sendError(res, "Thiếu Domain hoặc Access Token", 400);
        }

        // Validate/Refresh with real data from Shopify to get official Name and canonical Domain
        let finalDomain = shopifyDomain;
        let officialShopName = user.sellerConfig?.shopName || shopifyDomain.split('.')[0];
        
        try {
            const realShop = await shopifyService.getShopInfo(shopifyDomain, accessToken);
            finalDomain = realShop.myshopify_domain || shopifyDomain;
            officialShopName = realShop.name || officialShopName;
        } catch (apiErr) {
            console.warn("Could not verify shop info during update, using provided domain.");
        }

        user.sellerConfig = { 
            shopifyDomain: finalDomain, 
            accessToken: encrypt(accessToken), 
            shopName: officialShopName,
            webhookSecret: webhookSecret ? encrypt(webhookSecret) : '' 
        };
        user.role = 'seller';
        await user.save();

        // 🔗 Đăng ký Webhooks lên Shopify
        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        shopifyService.registerWebhooks(finalDomain, accessToken, appBaseUrl).catch(err => {
            console.error(`Webhook registration failed for ${finalDomain}:`, err.message);
        });

        // 🚀 Auto-sync in background
        productService.syncProductsForSeller(user).catch(err => {
            console.error(`Initial auto-sync failed for user ${userId}:`, err.message);
        });
        
        return sendSuccess(res, { role: user.role, shopifyDomain: finalDomain }, 'Seller profile updated and sync started');
    } catch (err: any) {
        return sendError(res, err.message);
    }
};

/**
 * Đăng ký lại webhook thủ công (dùng khi debug hoặc server đổi URL)
 */
export const registerWebhooks = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user || !user.sellerConfig) {
            return res.status(404).json({ status: 'error', message: 'Seller not found or not configured' });
        }

        const { shopifyDomain, accessToken } = user.sellerConfig;
        const decryptedToken = decrypt(accessToken!);
        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

        await shopifyService.registerWebhooks(shopifyDomain!, decryptedToken, appBaseUrl);
        
        return sendSuccess(res, null, `Webhooks đã được đăng ký lên ${shopifyDomain}`);
    } catch (err: any) {
        console.error('Webhook Registration Error:', err.message);
        return sendError(res, err.message);
    }
};

/**
 * Kiểm tra danh sách webhook đã đăng ký trên Shopify
 */
export const listWebhooks = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId as string);
        if (!user || !user.sellerConfig) {
            return res.status(404).json({ status: 'error', message: 'Seller not found or not configured' });
        }

        const { shopifyDomain, accessToken } = user.sellerConfig;
        const decryptedToken = decrypt(accessToken!);
        const webhooks = await shopifyService.listWebhooks(shopifyDomain!, decryptedToken);
        
        return sendSuccess(res, webhooks);
    } catch (err: any) {
        console.error('List Webhooks Error:', err.message);
        return sendError(res, err.message);
    }
};

/**
 * Lấy chi tiết một Shop và danh sách sản phẩm của Shop đó
 */
export const getShopDetails = async (req: Request, res: Response) => {
    try {
        const { shopName } = req.params;

        // 1. Lấy danh sách sản phẩm của shop này từ DB cục bộ, populate thông tin người bán
        const products = await Product.find({ shopName })
            .populate('sellerId', 'paymentWalletAddress')
            .sort({ createdAt: -1 });

        // 2. Tìm thông tin Seller sở hữu shop này
        let seller = await User.findOne({ 'sellerConfig.shopName': shopName });

        // Dự phòng: Nếu không tìm thấy theo shopName, thử tìm theo ví của sản phẩm đầu tiên
        if (!seller && products.length > 0) {
            const firstProductSeller = products[0].sellerId as any;
            if (firstProductSeller?.paymentWalletAddress) {
                seller = await User.findOne({ paymentWalletAddress: firstProductSeller.paymentWalletAddress });
            }
        }

        let shopMetadata = {
            name: shopName,
            sellerAddress: seller?.paymentWalletAddress || 'Unknown',
            isVerified: !!seller,
            shopifyDomain: seller?.sellerConfig?.shopifyDomain,
            email: 'Not available',
            createdAt: null,
            timezone: 'UTC'
        };

        // Nếu có seller và có đủ config, lấy thông tin thật từ Shopify
        if (seller?.sellerConfig?.shopifyDomain && seller?.sellerConfig?.accessToken) {
            try {
                const decryptedToken = decrypt(seller.sellerConfig.accessToken);
                const realShop = await shopifyService.getShopInfo(
                    seller.sellerConfig.shopifyDomain, 
                    decryptedToken
                );
                shopMetadata = {
                    ...shopMetadata,
                    name: realShop.name || shopName,
                    email: realShop.email,
                    createdAt: realShop.created_at,
                    timezone: realShop.iana_timezone
                };
            } catch (apiErr) {
                console.warn("Could not fetch real shop info from Shopify:", apiErr);
            }
        }

        return sendSuccess(res, {
            shop: shopMetadata,
            products: products.map(p => {
                const sellerInfo = p.sellerId as any;
                return {
                    node: {
                        id: p.shopifyId,
                        title: p.title,
                        handle: p.handle,
                        vendor: p.vendor,
                        productType: p.category,
                        tags: p.tags,
                        descriptionHtml: p.descriptionHtml,
                        shopName: p.shopName,
                        sellerWalletAddress: sellerInfo?.paymentWalletAddress || 'Unknown',
                        images: { edges: [{ node: { url: p.imageSrc } }] },
                        variants: { edges: [{ node: { price: p.priceUsd.toString() } }] }
                    }
                };
            })
        });
    } catch (err: any) {
        console.error("Get Shop Details Error:", err.message);
        return sendError(res, "Failed to fetch shop details");
    }
};
/**
 * Kiểm tra kết nối đến Shopify Admin API
 */
export const testConnection = async (req: Request, res: Response) => {
    try {
        const { shopifyDomain, accessToken, userId } = req.body;
        
        if (!shopifyDomain || !accessToken) {
            return sendError(res, "Vui lòng nhập đầy đủ Domain và Access Token để kiểm tra", 400);
        }

        // Nếu token bắt đầu bằng dấu * (đang bị mask ở FE), ta cần lấy từ DB nếu có userId
        let tokenToUse = accessToken;

        if (accessToken.includes('***') && userId) {
            const user = await User.findById(userId);
            if (user?.sellerConfig?.accessToken) {
                tokenToUse = decrypt(user.sellerConfig.accessToken);
            }
        }

        const shopInfo = await shopifyService.getShopInfo(shopifyDomain, tokenToUse);
        
        return sendSuccess(res, {
            name: shopInfo.name,
            email: shopInfo.email,
            currency: shopInfo.currency,
            domain: shopInfo.domain,
            myshopify_domain: shopInfo.myshopify_domain, // Return the real subdomain
            plan_name: shopInfo.plan_name
        }, "Kết nối Shopify thành công!");
    } catch (err: any) {
        return sendError(res, "Không thể kết nối với Shopify. Vui lòng kiểm tra lại Tên gian hàng hoặc Access Token.");
    }
};

/**
 * Proactive Test: Tạo và Xóa sản phẩm mẫu để test Webhook Loop
 */
export const verifyWebhookLoop = async (req: Request, res: Response) => {
    try {
        const { userId, shopifyDomain, accessToken, webhookSecret } = req.body;

        if (!shopifyDomain || !accessToken || !webhookSecret) {
            return sendError(res, "Thiếu thông tin cấu hình để chạy test", 400);
        }

        // 1. Tìm user và chuẩn bị
        const user = await User.findById(userId);
        if (!user) return sendError(res, "Không tìm thấy người dùng", 404);

        // 2. Xác định Access Token thực tế (Giải mã nếu là Token cũ)
        const isNewToken = !accessToken.includes('***');
        const decryptedOldToken = user.sellerConfig?.accessToken ? decrypt(user.sellerConfig.accessToken) : '';
        const clearToken = isNewToken ? accessToken : decryptedOldToken;

        if (!clearToken) {
            return sendError(res, "Không có Access Token hợp lệ", 401);
        }

        // 3. Lưu cấu hình tạm (đã mã hóa)
        user.sellerConfig = {
            ...user.sellerConfig!,
            shopifyDomain,
            accessToken: isNewToken ? encrypt(accessToken) : user.sellerConfig?.accessToken!,
            webhookSecret: webhookSecret.includes('***') ? user.sellerConfig?.webhookSecret! : encrypt(webhookSecret),
            webhookStatus: 'pending',
            webhookLastError: ''
        };
        await user.save();

        // 4. Đăng ký Webhook nếu chưa có
        const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        await shopifyService.registerWebhooks(shopifyDomain, clearToken, appBaseUrl);

        console.log(`🧪 Starting Webhook Probe for ${shopifyDomain}...`);

        // 5. Thử nghiệm tạo sản phẩm
        const product = await shopifyService.createProbeProduct(shopifyDomain, clearToken);
        
        // Đợi 1 chút rồi xóa
        setTimeout(async () => {
            try {
                await shopifyService.deleteProduct(shopifyDomain, clearToken, product.id);
                console.log(`🧪 Webhook Probe Product Deleted: ${product.id}`);
            } catch (e) {
                console.error("Failed to delete probe product:", e);
            }
        }, 2000);

        return sendSuccess(res, { status: 'pending' }, "Đã gửi lệnh thử nghiệm. Vui lòng chờ vài giây để Shopify gửi Webhook về...");
    } catch (err: any) {
        console.error("Webhook Loop Test Error:", err);
        return sendError(res, err.message || "Lỗi khi chạy lệnh thử nghiệm");
    }
};
