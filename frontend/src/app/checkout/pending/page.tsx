"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePendingCheckout } from "@/features/escrow/hooks/usePendingCheckout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Copy, Package, ShieldCheck, AlertCircle, Timer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EscrowTimeline } from "@/features/escrow/components/EscrowTimeline";

/**
 * C-02 | Escrow Checkout Flow — Bước 3: Waiting Confirm
 * 
 * Tuân thủ:
 *   - ARCHITECTURE_RULES: Page minimal, logic trong hook usePendingCheckout
 *   - DESIGN.md: Airbnb Cereal VF, palette tokens, three-layer shadows, 20px card radius
 *   - UI_INTERFACES C-02: Multi-step checkout — Waiting Confirm step
 */
export default function PendingCheckoutPage() {
  const router = useRouter();
  const {
    session,
    status,
    timeLeft,
    isUrgent,
    cancelOrder,
    copyAddress,
  } = usePendingCheckout();

  // ─── Loading State (ARCHITECTURE_RULES #5: Loading States) ───
  if (status === "LOADING") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-[var(--radius-circle)] border-[3px] border-[var(--color-surface-light)] animate-spin"
            style={{ borderTopColor: "var(--color-brand-core)" }}
          />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Đang tải phiên thanh toán...
          </span>
        </div>
      </main>
    );
  }

  // ─── C-03 | Post-Checkout Success ───
  if (status === "PAID") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-6">
        <div className="w-full max-w-[600px] space-y-6">
          <Card
            className="bg-white overflow-hidden border-0"
            style={{
              borderRadius: "32px",
              boxShadow: "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px",
            }}
          >
            <CardContent className="p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-[28px] font-black text-zinc-900 tracking-tight mb-2">
                Thanh toán đã được ký gửi!
              </h2>
              <p className="text-zinc-500 font-medium mb-8 max-w-[340px]">
                Số tiền của bạn đã được khóa an toàn trong Smart Contract. Người bán đang chuẩn bị giao hàng.
              </p>

              <div className="w-full border-t border-zinc-100 pt-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">
                  Tiến trình ESCROW
                </p>
                <EscrowTimeline currentStep="payment_confirmed" />
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-10">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="h-12 rounded-2xl font-bold border-zinc-200"
                >
                  Về trang chủ
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="h-12 rounded-2xl font-bold bg-zinc-900 text-white hover:bg-black"
                >
                  Quản lý đơn hàng
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-indigo-600 rounded-[24px] p-6 text-white flex items-center gap-4 shadow-xl shadow-indigo-200">
             <ShieldCheck className="w-8 h-8 shrink-0 opacity-80" />
             <div>
                <p className="font-bold text-[15px]">Bảo vệ bởi AntiGravity Escrow</p>
                <p className="text-[13px] opacity-80 font-medium">Tiền chỉ được gửi cho người bán sau khi bạn xác nhận đã nhận đúng hàng.</p>
             </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Expired State ───
  if (status === "EXPIRED" || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white p-6">
        <Card
          className="w-full max-w-[440px] bg-white overflow-hidden"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px",
          }}
        >
          <CardContent className="p-10 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-[var(--radius-circle)] bg-[#fcedeb] flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-[var(--color-brand-core)]" />
            </div>
            <h2 className="text-[22px] font-semibold text-[var(--color-text-primary)] tracking-[-0.44px] leading-tight">
              Đơn hàng đã hết hạn
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Phiên thanh toán đã quá 15 phút. Vui lòng tạo đơn hàng mới.
            </p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="mt-2 w-full h-12 font-medium text-base"
              style={{
                borderRadius: "var(--radius-button)",
                color: "var(--color-text-primary)",
              }}
            >
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─── C-02 Bước 3: Waiting Confirm — Main checkout waiting UI ───
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] space-y-5">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Main Card — Three-layer Airbnb shadow, 20px radius */}
        <Card
          className="bg-white overflow-hidden border-0"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px",
          }}
        >
          {/* Header */}
          <CardHeader className="pb-4 border-b border-[var(--color-surface-light)]">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[20px] font-semibold text-[var(--color-text-primary)] tracking-[-0.18px]">
                Thanh toán Đơn hàng
              </CardTitle>
              <Badge
                variant={isUrgent ? "destructive" : "secondary"}
                className="flex gap-1.5 items-center px-3 py-1 font-mono text-xs"
                style={{ borderRadius: "var(--radius-badge)" }}
              >
                <Timer className="w-3.5 h-3.5" />
                {timeLeft}
              </Badge>
            </div>
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
              Phiên thanh toán sẽ tự động hủy khi hết giờ
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6 px-6 pb-8">
            {/* Product info — link về trang sản phẩm */}
            {session.productHandle ? (
              <Link
                href={`/product/${session.productHandle}`}
                className="flex items-center gap-3 p-3 group transition-all"
                style={{
                  background: "var(--color-surface-light)",
                  borderRadius: "var(--radius-button)",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-gray)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-[var(--color-brand-core)]"
                  style={{ background: "#fcedeb", borderRadius: "var(--radius-button)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider leading-none mb-1">
                    Sản phẩm
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand-core)] transition-colors">
                    {session.productTitle}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--color-brand-core)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            ) : (
              <div
                className="flex items-center gap-3 p-3"
                style={{ background: "var(--color-surface-light)", borderRadius: "var(--radius-button)" }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-[var(--color-brand-core)]"
                  style={{ background: "#fcedeb", borderRadius: "var(--radius-button)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider leading-none mb-1">
                    Sản phẩm
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate">
                    {session.productTitle}
                  </p>
                </div>
              </div>
            )}

            {/* Amount — Large display */}
            <div
              className="text-center p-5"
              style={{
                background: "var(--color-surface-light)",
                borderRadius: "var(--radius-card)",
              }}
            >
              <p className="text-[12px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider mb-2">
                Số tiền cần chuyển
              </p>
              <p className="text-[36px] font-bold text-[var(--color-text-primary)] tracking-tight leading-none">
                {session.amountEth}{" "}
                <span className="text-[22px] font-semibold text-[var(--color-text-secondary)]">ETH</span>
              </p>
            </div>

            {/* Wallet address */}
            <div>
              <p className="text-[11px] uppercase font-bold text-[var(--color-text-secondary)] mb-2 tracking-wider">
                Địa chỉ ví thanh toán
              </p>
              <div
                className="flex items-center gap-2 p-3 cursor-pointer transition-all group"
                style={{
                  background: "var(--color-surface-light)",
                  borderRadius: "var(--radius-button)",
                  border: "1px solid var(--color-border-gray)",
                }}
                onClick={copyAddress}
              >
                <code className="text-[11px] font-mono text-[var(--color-text-primary)] break-all flex-1 leading-relaxed">
                  {session.depositAddress}
                </code>
                <Copy className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-core)] shrink-0 transition-colors" />
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 text-center">
                Nhấn để sao chép địa chỉ
              </p>
            </div>

            {/* Seller Payout address */}
            <div>
              <p className="text-[11px] uppercase font-bold text-[var(--color-text-secondary)] mb-2 tracking-wider">
                Địa chỉ giải ngân (Seller Payout)
              </p>
              <div
                className="flex items-center gap-2 p-3 cursor-pointer transition-all group border border-dashed"
                style={{
                  background: "var(--color-surface-light)",
                  borderRadius: "var(--radius-button)",
                  borderColor: "var(--color-border-gray)",
                }}
                onClick={() => {
                  if (session?.sellerAddress) {
                    navigator.clipboard.writeText(session.sellerAddress);
                    import('sonner').then(({ toast }) => toast.success("Đã sao chép địa chỉ ví người bán!"));
                  }
                }}
              >
                <code className="text-[11px] font-mono text-zinc-500 break-all flex-1 leading-relaxed">
                  {session.sellerAddress}
                </code>
                <Copy className="w-4 h-4 text-zinc-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1.5 px-1 leading-normal italic">
                * Đây là địa chỉ ví của người bán sẽ nhận tiền sau khi bạn xác nhận đơn hàng.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="bg-white p-4"
                style={{
                  borderRadius: "var(--radius-card)",
                  boxShadow: "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px",
                }}
              >
                <QRCodeSVG
                  value={`ethereum:${session.depositAddress}?value=${session.amountEth}e18`}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Quét mã QR bằng ví Ethereum
              </p>
            </div>

            {/* Status alert */}
            <div
              className="flex items-start gap-2.5 p-3 text-sm"
              style={{
                borderRadius: "var(--radius-button)",
                background: isUrgent ? "#fcedeb" : "#fef9e7",
                color: isUrgent ? "var(--color-brand-core)" : "#92640d",
                border: isUrgent ? "1px solid #f5c6bc" : "1px solid #f5e6b8",
              }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-[13px] leading-relaxed">
                {isUrgent
                  ? "Còn rất ít thời gian! Vui lòng chuyển khoản ngay bây giờ."
                  : "Hệ thống sẽ tự động phát hiện thanh toán sau khi giao dịch được xác nhận trên blockchain."}
              </span>
            </div>

            {/* Actions — Primary dark button (Airbnb style), ghost cancel */}
            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-12 font-medium text-base text-white"
                style={{
                  background: "var(--color-text-primary)",
                  borderRadius: "var(--radius-button)",
                }}
              >
                Tôi đã chuyển khoản
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 font-medium text-[var(--color-brand-core)] hover:bg-[#fcedeb]"
                style={{ borderRadius: "var(--radius-button)" }}
                onClick={cancelOrder}
              >
                Hủy đơn hàng này
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="text-center text-[12px] text-[var(--color-text-secondary)] px-4 leading-relaxed">
          Tiền của bạn được khóa trong Ethereum Smart Contract cho đến khi xác nhận nhận hàng.
        </p>
      </div>
    </main>
  );
}
