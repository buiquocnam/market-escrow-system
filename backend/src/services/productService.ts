import Product from '../models/Product';
import Category from '../models/Category';
import shopifyService from './shopifyService';
import { decrypt } from '../utils/encryption';
import mongoose from 'mongoose';

/**
 * Product Service - Xử lý logic đồng bộ và truy vấn sản phẩm từ DB cục bộ
 */
class ProductService {
    /**
     * Đồng bộ toàn bộ sản phẩm từ Shopify của một Seller vào DB của mình
     */
    async syncProductsForSeller(user: any) {
        if (!user.sellerConfig?.shopifyDomain || !user.sellerConfig?.accessToken) {
            throw new Error('Seller configuration missing for synchronization');
        }

        const accessToken = decrypt(user.sellerConfig.accessToken);
        console.log(`🚀 Bắt đầu đồng bộ sản phẩm cho shop: ${user.sellerConfig.shopName || user.sellerConfig.shopifyDomain}`);

        // 1. Fetch products from Shopify (limiting to latest 250 for sync)
        const shopifyProductsData = await shopifyService.getProducts({
            shopDomain: user.sellerConfig.shopifyDomain,
            accessToken: accessToken
        });

        const edges = shopifyProductsData.edges || [];
        console.log(`📦 Tìm thấy ${edges.length} sản phẩm trên Shopify.`);

        // 2. Map and Upsert into local MongoDB
        const syncPromises = edges.map(async (edge: any) => {
            const node = edge.node;
            const variant = node.variants.edges[0]?.node;
            const priceUsd = variant ? parseFloat(variant.price) : 0;

            const productData = {
                title: node.title,
                handle: node.handle,
                vendor: node.vendor,
                priceUsd: priceUsd,
                imageSrc: node.images.edges[0]?.node.url || "https://placehold.co/600x400?text=No+Image",
                category: node.productType || 'General',
                tags: node.tags || [],
                descriptionHtml: node.descriptionHtml,
                shopName: user.sellerConfig.shopName || user.sellerConfig.shopifyDomain,
                sellerId: user._id,
                lastSyncedAt: new Date()
            };

            // Upsert: Find by shopifyId, update if exists, insert if not
            return Product.findOneAndUpdate(
                { shopifyId: node.id },
                { $set: productData },
                { upsert: true, new: true }
            );
        });

        await Promise.all(syncPromises);
        
        // 3. Update Category Registry (Thu thập danh mục mới)
        try {
            const uniqueCategories = Array.from(new Set(
                edges.map((e: any) => e.node.productType || 'General')
            )).filter(Boolean);

            if (uniqueCategories.length > 0) {
                const categoryPromises = uniqueCategories.map(catName => {
                    const slug = (catName as string).toLowerCase().replace(/\s+/g, '-');
                    return Category.findOneAndUpdate(
                        { name: catName },
                        { $set: { name: catName, slug } },
                        { upsert: true, new: true }
                    );
                });
                await Promise.all(categoryPromises);
                console.log(`🏷️  Updated ${uniqueCategories.length} categories in registry.`);
            }
        } catch (catErr: any) {
            console.warn(`⚠️ Category indexing failed: ${catErr.message}`);
        }

        console.log(`✅ Đồng bộ thành công ${edges.length} sản phẩm.`);
        return edges.length;
    }

    /**
     * Lấy sản phẩm từ DB cục bộ (Sẵn sàng phục vụ hàng triệu request)
     */
    async getLocalProducts(filters: { q?: string; category?: string; page?: number; limit?: number }) {
        const { q, category, page = 1, limit = 20 } = filters;
        const query: any = {};

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { shopName: { $regex: q, $options: 'i' } }
            ];
        }

        if (category && category !== 'all') {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        return {
            products,
            pageInfo: {
                hasNextPage: total > skip + limit,
                total
            }
        };
    }
}

export default new ProductService();
