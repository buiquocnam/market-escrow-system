import { api } from "@/lib/api";

/**
 * Seller Settings API — cấu hình gian hàng Shopify của seller.
 */

/** Lấy cấu hình seller hiện tại */
export async function fetchSellerSettings(userId: string) {
  return api.get<{ success: boolean; data: any }>(`/transactions/settings?userId=${userId}`);
}

/** Cập nhật cấu hình seller */
export async function updateSellerSettings(payload: {
  userId: string;
  shopifyDomain: string;
  accessToken: string;
  shopName: string;
  payoutAddress: string;
}) {
  return api.post<{ success: boolean; message?: string }>("/transactions/settings/update", payload);
}
