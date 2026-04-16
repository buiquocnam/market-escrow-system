"use client";

import { useQuery } from "@tanstack/react-query";
import { IEscrow } from "@/types";
import { listTransactions } from "../api/escrowApi";
import { useAuth } from "@/hooks/useAuth";

const fetchTransactionsList = async (userId?: string, sellerAddress?: string): Promise<IEscrow[]> => {
  const response = await listTransactions(userId, sellerAddress);
  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || "Failed to fetch transactions");
  }
  return response.data;
};

/**
 * Hook to fetch and manage the list of escrow transactions.
 * Includes automatic background refetching (Live Sync).
 */
export function useTransactions(userId?: string, sellerAddress?: string) {
  const { user } = useAuth();
  
  // If no params provided, default to current user's history
  const targetUserId = userId || (!sellerAddress ? user?.userId : undefined);
  
  return useQuery({
    queryKey: ["transactions", targetUserId, sellerAddress],
    queryFn: () => fetchTransactionsList(targetUserId, sellerAddress),
    refetchInterval: 60000, 
    enabled: !!(targetUserId || sellerAddress)
  });
}
