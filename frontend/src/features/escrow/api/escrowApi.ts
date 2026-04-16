import { api } from "@/lib/api";
import { IEscrow, ApiResponse } from "@/types";

/**
 * Escrow API service targeting the backend /transactions endpoints.
 */

/**
 * Initialize a risk analysis for a potential escrow transaction.
 */
export async function initEscrowRiskAnalysis(payload: {
  amount_eth: number;
  buyer_account_wallet_age_days: number;
  tx_velocity_24h: number;
  smart_contract_interactions: number;
  geo_ip_mismatch: boolean;
}) {
  return api.post<any>("/transactions/escrow-init", payload);
}

/**
 * Sync a successful blockchain transaction with the Shopify backend.
 */
export async function syncShopifyTransaction(payload: {
  txHash: string;
  productTitle: string;
  priceUsd: number;
  amountEth: number;
  buyerAddress: string;
}) {
  return api.post<any>("/transactions/sync-shopify", payload);
}

/**
 * Fetch the list of all escrow transactions.
 */
export async function listTransactions(userId?: string, sellerAddress?: string) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (sellerAddress) params.append("sellerAddress", sellerAddress);
  
  const query = params.toString();
  const url = query ? `/transactions/history?${query}` : "/transactions/history";
  return api.get<ApiResponse<IEscrow[]>>(url);
}

/**
 * Release funds for a specific transaction (database update).
 */
export async function releaseFunds(txHash: string) {
  return api.post<any>("/transactions/release", { txHash });
}

/**
 * Check status of a specific transaction.
 */
export async function getTransactionStatus(txHash: string) {
  return api.get<any>(`/transactions/status/${txHash}`);
}

/** Giải ngân escrow qua sessionId */
export async function releaseEscrowFunds(sessionId: string) {
  return api.post<any>("/transactions/sessions/release", { sessionId });
}

