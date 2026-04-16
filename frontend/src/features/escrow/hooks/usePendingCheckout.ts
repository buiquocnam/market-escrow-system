"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  fetchActiveSession,
  pollSessionStatus,
  cancelCheckoutSession,
  SessionData,
} from "../api/checkoutSessionApi";

type SessionStatus = "LOADING" | "WAITING" | "PAID" | "EXPIRED" | "NO_SESSION";

/**
 * Hook quản lý toàn bộ logic trang Pending Checkout.
 * Resume session + countdown + polling + cancel.
 * Tuân thủ ARCHITECTURE_RULES: Logic tách biệt khỏi Presentation.
 */
export function usePendingCheckout() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<SessionStatus>("LOADING");
  const [timeLeft, setTimeLeft] = useState<string>("");

  // ─── 1. Fetch active session on mount ───
  useEffect(() => {
    const resume = async () => {
      if (!isAuthenticated || !user) {
        router.push("/login");
        return;
      }
      try {
        const userId = (user as any).userId || (user as any)._id;
        const data = await fetchActiveSession(userId);
        if (data) {
          setSession(data);
          setStatus("WAITING");
        } else {
          toast.info("Bạn không có đơn hàng nào đang chờ thanh toán.");
          setStatus("NO_SESSION");
          router.push("/");
        }
      } catch {
        setStatus("NO_SESSION");
        router.push("/");
      }
    };
    resume();
  }, [isAuthenticated, user, router]);

  // ─── 2. Live countdown ───
  useEffect(() => {
    if (!session || status !== "WAITING") return;

    const tick = () => {
      const diff = new Date(session.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00");
        setStatus("EXPIRED");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt, status]);

  // ─── 3. Poll payment status every 5s ───
  useEffect(() => {
    if (!session || status !== "WAITING") return;

    const interval = setInterval(async () => {
      try {
        const data = await pollSessionStatus(session.sessionId);
        if (data?.isPaid) {
          setStatus("PAID");
          toast.success("Thanh toán thành công! 🎉");
          clearInterval(interval);
        } else if (data?.status === "EXPIRED") {
          setStatus("EXPIRED");
          clearInterval(interval);
        }
      } catch {/* ignore */}
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.sessionId, status]);

  // ─── 4. Actions ───
  const cancelOrder = useCallback(async () => {
    if (!session) return;
    try {
      await cancelCheckoutSession(session.sessionId);
      toast.success("Đã hủy đơn hàng.");
      router.push("/");
    } catch (e: any) {
      toast.error("Không thể hủy: " + e.message);
    }
  }, [session, router]);

  const copyAddress = useCallback(() => {
    if (session?.depositAddress) {
      navigator.clipboard.writeText(session.depositAddress);
      toast.success("Đã sao chép địa chỉ ví!");
    }
  }, [session?.depositAddress]);

  const isUrgent = timeLeft.startsWith("00") || timeLeft.startsWith("01") || timeLeft.startsWith("02");

  return {
    session,
    status,
    timeLeft,
    isUrgent,
    cancelOrder,
    copyAddress,
  };
}
