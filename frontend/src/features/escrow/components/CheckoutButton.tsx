"use client";

import { Button } from "@/components/ui/button";
import { IProduct } from "@/types";
import { useManualCheckout } from "../hooks/useManualCheckout";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  product: IProduct;
}

/**
 * Nút Checkout đơn giản — chỉ tạo session rồi redirect sang /checkout/pending.
 * Tuân thủ DESIGN.md: Dark primary button (#222222), 8px radius.
 */
export const CheckoutButton = ({ product }: CheckoutButtonProps) => {
  const { startCheckout, loading } = useManualCheckout(product);

  return (
    <Button
      size="lg"
      onClick={startCheckout}
      disabled={loading}
      className="w-full h-12 text-sm font-medium text-white transition-all active:scale-[0.96] flex items-center justify-center gap-2 group"
      style={{
        background: "var(--color-text-primary)",
        borderRadius: "var(--radius-button)",
      }}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Đang khởi tạo...</span>
        </>
      ) : (
        <>
          <span>Thanh toán ngay</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </>
      )}
    </Button>
  );
};
