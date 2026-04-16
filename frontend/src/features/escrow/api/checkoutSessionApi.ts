import { api } from "@/lib/api";

/**
 * Checkout Session API — quản lý phiên thanh toán crypto.
 * Tách riêng khỏi escrowApi để giữ mỗi file một trách nhiệm.
 */

export type CreateSessionPayload = {
  productTitle: string;
  productHandle?: string;
  priceUsd: number;
  amountEth: number;
  userId: string;
  sellerAddress: string;
};

export type SessionData = {
  sessionId: string;
  productTitle: string;
  productHandle?: string | null;
  depositAddress: string;
  sellerAddress: string;
  amountEth: number;
  expiresAt: string;
};

/** Tạo checkout session mới */
export async function createCheckoutSession(payload: CreateSessionPayload) {
  return api.post<any>("/transactions/sessions/create", payload);
}

/** Lấy session WAITING của user (nếu có) */
export async function fetchActiveSession(userId: string): Promise<SessionData | null> {
  const res = await api.get<any>(`/transactions/sessions/active?userId=${userId}`);
  const data = res?.data;
  if (data && data.sessionId && new Date(data.expiresAt).getTime() > Date.now()) {
    return data;
  }
  return null;
}

/** Poll trạng thái thanh toán */
export async function pollSessionStatus(sessionId: string) {
  const res = await api.get<any>(`/transactions/sessions/status/${sessionId}`);
  return res?.data || res;
}

/** Hủy session */
export async function cancelCheckoutSession(sessionId: string) {
  return api.post("/transactions/sessions/cancel", { sessionId });
}
