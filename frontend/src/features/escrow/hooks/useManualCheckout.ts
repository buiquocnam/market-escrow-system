"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IProduct } from "@/types";
import { toast } from "sonner";
import { createCheckoutSession } from "../api/checkoutSessionApi";

/**
 * Hook chỉ xử lý việc TẠO checkout session.
 * Sau khi tạo xong → redirect sang /checkout/pending để theo dõi.
 */
export function useManualCheckout(product: IProduct) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Vui lòng đăng nhập để bắt đầu thanh toán.");
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }
      const user = JSON.parse(userStr);
      setLoading(true);

      const response = await createCheckoutSession({
        productTitle: product.title,
        productHandle: product.handle,
        priceUsd: product.priceUsd,
        amountEth: product.ethPrice,
        userId: user.userId || user._id,
        sellerAddress: (product as any).sellerWalletAddress,
      });

      if (response.status === "success" || response.sessionId) {
        toast.success("Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...");
        router.push("/checkout/pending");
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    startCheckout,
    loading,
  };
}
