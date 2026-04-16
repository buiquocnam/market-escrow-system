"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Timer } from "lucide-react";

/**
 * Hiển thị trên Navbar khi user có đơn hàng đang chờ thanh toán.
 * Tự poll trạng thái mỗi 10s và đếm ngược thời gian còn lại.
 */
export function PendingOrderBadge() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<{
    sessionId: string;
    expiresAt: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll để kiểm tra đơn hàng đang chờ (mỗi 10s)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkPending = async () => {
      try {
        const userId = (user as any).userId || (user as any)._id;
        if (!userId) return;
        const res = await api.get<any>(`/transactions/sessions/active?userId=${userId}`);
        const data = res?.data;
        if (data && data.sessionId && new Date(data.expiresAt).getTime() > Date.now()) {
          setPending({ sessionId: data.sessionId, expiresAt: data.expiresAt });
        } else {
          setPending(null);
        }
      } catch {
        setPending(null);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Countdown timer
  useEffect(() => {
    if (!pending) return;

    const tick = () => {
      const diff = new Date(pending.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00:00");
        setPending(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [pending?.expiresAt]);

  if (!mounted || !pending) return null;

  const isUrgent = timeLeft.startsWith("00") || timeLeft.startsWith("01") || timeLeft.startsWith("02");

  return (
    <button
      onClick={() => router.push("/checkout/pending")}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
        border transition-all duration-300 animate-pulse-once
        ${isUrgent
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
        }
      `}
      title="Bạn có đơn hàng đang chờ thanh toán"
    >
      <Timer className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">Chờ thanh toán</span>
      <span className={`font-mono font-bold ${isUrgent ? "text-red-700" : "text-amber-800"}`}>
        {timeLeft}
      </span>
    </button>
  );
}
