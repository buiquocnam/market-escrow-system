"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchActiveSession, SessionData } from "@/features/escrow/api/checkoutSessionApi";

/**
 * Hook để lấy session thanh toán đang WAITING của user hiện tại.
 * Dùng chung cho marketplace cards (isPending badge), navbar badge...
 * Dùng shared API từ escrowApi.ts — không duplicate logic.
 */
export function useActiveSession() {
  const { user, isAuthenticated } = useAuth();
  const userId = (user as any)?.userId || (user as any)?._id;

  return useQuery<SessionData | null>({
    queryKey: ["activeSession", userId],
    queryFn: () => fetchActiveSession(userId!),
    enabled: isAuthenticated && !!userId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
