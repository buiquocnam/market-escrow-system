import { api } from "@/lib/api";
import { IProduct, FetchProductsResponse, EscrowStatus } from "@/types";

/**
 * Fetch products from our Backend (which proxies Shopify)
 */
/**
 * Helper to transform backend product nodes into IProduct interface
 */
function transformProduct(node: any): IProduct {
  const variant = node.variants?.edges?.[0]?.node;
  const priceUsd = variant ? parseFloat(variant.price) : 0;
  
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    category: node.productType,
    tags: node.tags || [],
    priceUsd: priceUsd,
    ethPrice: priceUsd / 2500, // Mock rate
    imageSrc: node.images?.edges?.[0]?.node?.url || "https://placehold.co/600x400?text=No+Image",
    shopName: node.shopName,
    sellerWalletAddress: node.sellerWalletAddress
  };
}

/**
 * Fetch products from our Backend (which proxies Shopify)
 */
export async function fetchShopifyProducts(
  q: string = "", 
  category: string = "all", 
  cursor: string | null = null
): Promise<FetchProductsResponse> {
  const res = await api.get<any>("/shopify/products", {
    q: q || undefined,
    category: category !== "all" ? category : undefined,
    cursor: cursor || undefined
  });

  // Access .data from ApiResponse wrapper
  const apiData = res.data;

  const products: IProduct[] = (apiData.products || []).map((p: any) => transformProduct(p.node));

  return { 
    products, 
    pageInfo: apiData.pageInfo 
  };
}

/**
 * Fetch Shop Details and its products
 */
export async function fetchShopDetails(shopName: string) {
  const res = await api.get<any>(`/shopify/shop/${shopName}`);
  const apiData = res.data;

  return {
    shop: apiData.shop,
    products: (apiData.products || []).map((p: any) => transformProduct(p.node))
  };
}

export async function fetchShopifyCategories(): Promise<string[]> {
  const res = await api.get<any>("/shopify/categories");
  // Sau khi refactor Backend dùng sendSuccess, danh mục nằm trực tiếp trong res.data
  return res.data || [];
}

export async function syncShopifyProducts(userId: string) {
  return api.post<any>("/shopify/sync", { userId });
}

/**
 * Kiểm tra kết nối đến Shopify store
 */
export async function testShopifyConnection(payload: { 
  shopifyDomain?: string; 
  accessToken: string; 
  userId?: string;
  shopName?: string;
}) {
  return api.post<any>("/shopify/test-connection", payload);
}


/**
 * Fetch a single transaction status from our Backend
 */
export async function fetchTransactionStatus(txHash: string) {
  try {
    return await api.get<any>(`/transactions/status/${txHash}`);
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return { status: EscrowStatus.PENDING };
  }
}

/**
 * Kích hoạt vòng lặp Probe (Tạo/Xóa SP) để test Secret Key thực tế
 */
export async function verifyWebhookSecret(payload: {
  userId: string;
  shopifyDomain: string;
  accessToken: string;
  webhookSecret: string;
}) {
  return api.post<any>("/shopify/verify-webhook-secret", payload);
}
