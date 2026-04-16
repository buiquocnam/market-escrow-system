import axios from 'axios';
import config from '../config';

interface GetProductsParams {
    q?: string;
    category?: string;
    cursor?: string;
}

// Các webhook topic cần đăng ký với Shopify
const REQUIRED_WEBHOOK_TOPICS = [
    { topic: 'products/create', path: '/api/shopify/webhook/product_create' },
    { topic: 'products/update', path: '/api/shopify/webhook/product_create' }, // reuse upsert handler
    { topic: 'products/delete', path: '/api/shopify/webhook/product_delete' },
];

/**
 * Shopify Service - Đóng gói logic tương tác với Shopify Admin API (GraphQL)
 */
class ShopifyService {
    /**
     * Lấy danh sách sản phẩm với bộ lọc và phân trang (Cursor) từ một store cụ thể
     */
    async getProducts({ 
        q, 
        category, 
        cursor, 
        shopDomain, 
        accessToken 
    }: GetProductsParams & { shopDomain: string; accessToken: string }): Promise<any> {
        const baseUrl = `https://${shopDomain}/admin/api/2024-01/graphql.json`;
        const headers = {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        let queryParts = [];
        if (q) queryParts.push(`title:*${q}*`);
        if (category && category !== 'all') queryParts.push(`product_type:'${category}'`);
        
        const queryString = queryParts.join(' AND ');
        const afterArg = cursor ? `, after: "${cursor}"` : "";

        const graphqlQuery = {
            query: `
                {
                  products(first: 20${afterArg}${queryString ? `, query: "${queryString}"` : ""}) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    edges {
                      node {
                        id, title, handle, vendor, productType, tags, descriptionHtml,
                        variants(first: 1) { edges { node { price } } },
                        images(first: 1) { edges { node { url } } }
                      }
                    }
                  }
                }
            `
        };

        const response = await axios.post(baseUrl, graphqlQuery, { headers });
        return response.data.data.products;
    }

    /**
     * Lấy danh sách Product Types động từ một store cụ thể
     */
    async getProductTypes(shopDomain: string, accessToken: string): Promise<string[]> {
        const baseUrl = `https://${shopDomain}/admin/api/2024-01/graphql.json`;
        const headers = {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        const graphqlQuery = {
            query: `
                {
                  productTypes(first: 250) {
                    edges { node }
                  }
                }
            `
        };

        const response = await axios.post(baseUrl, graphqlQuery, { headers });
        return response.data.data.productTypes.edges.map((e: any) => e.node).filter(Boolean);
    }

    /**
     * Đăng ký (hoặc cập nhật) tất cả webhook cần thiết lên một Shopify store.
     * Được gọi tự động khi seller kết nối hoặc cập nhật config.
     */
    async registerWebhooks(shopDomain: string, accessToken: string, appBaseUrl: string): Promise<void> {
        const restBase = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;
        const headers = {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
        };

        // Lấy danh sách webhook đã đăng ký để tránh trùng lặp
        const existing = await axios.get(restBase, { headers });
        const existingTopics: string[] = existing.data.webhooks.map((w: any) => w.topic);

        for (const wh of REQUIRED_WEBHOOK_TOPICS) {
            if (existingTopics.includes(wh.topic)) {
                console.log(`✅ Webhook [${wh.topic}] đã tồn tại, bỏ qua.`);
                continue;
            }

            await axios.post(
                restBase,
                {
                    webhook: {
                        topic: wh.topic,
                        address: `${appBaseUrl}${wh.path}`,
                        format: 'json',
                    },
                },
                { headers }
            );
            console.log(`🔗 Đã đăng ký Webhook [${wh.topic}] → ${appBaseUrl}${wh.path}`);
        }
    }

    /**
     * Liệt kê tất cả webhook đã đăng ký trên một Shopify store.
     */
    async listWebhooks(shopDomain: string, accessToken: string): Promise<any[]> {
        const restBase = `https://${shopDomain}/admin/api/2024-01/webhooks.json`;
        const headers = { 'X-Shopify-Access-Token': accessToken };
        const response = await axios.get(restBase, { headers });
        return response.data.webhooks;
    }

    /**
     * Lấy thông tin chi tiết cấu hình Shop từ Shopify Admin API (REST)
     */
    async getShopInfo(shopDomain: string, accessToken: string): Promise<any> {
        const restBase = `https://${shopDomain}/admin/api/2024-01/shop.json`;
        const headers = { 'X-Shopify-Access-Token': accessToken };
        const response = await axios.get(restBase, { headers });
        return response.data.shop;
    }

    /**
     * Tạo sản phẩm mẫu để test Webhook Loop
     */
    async createProbeProduct(shopDomain: string, accessToken: string): Promise<any> {
        const restBase = `https://${shopDomain}/admin/api/2024-01/products.json`;
        const headers = { 
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };
        const response = await axios.post(restBase, {
            product: {
                title: `ESCROW_TEST_PROBE_${Date.now()}`,
                body_html: "DO NOT DELETE MANUALLY - This is a temporary test product for Escrow verification.",
                vendor: "EscrowSystem",
                product_type: "TestProbe",
                status: "draft"
            }
        }, { headers });
        return response.data.product;
    }

    /**
     * Xóa sản phẩm theo ID
     */
    async deleteProduct(shopDomain: string, accessToken: string, productId: string | number): Promise<void> {
        const restBase = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;
        const headers = { 'X-Shopify-Access-Token': accessToken };
        await axios.delete(restBase, { headers });
    }
}

export default new ShopifyService();
