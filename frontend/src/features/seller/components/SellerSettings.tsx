"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Store, Key, Globe, CheckCircle2, Wallet, RefreshCw, Eye, EyeOff, Activity } from "lucide-react";
import { useSellerSettings } from "../hooks/useSellerSettings";

/**
 * Seller Settings UI — kết nối Shopify, cấu hình ví payout.
 * Không chứa logic — mọi logic đều trong useSellerSettings hook.
 * Tuân thủ ARCHITECTURE_RULES #1: Components are for UI only.
 */
export function SellerSettings() {
  const {
    user,
    formData,
    updateField,
    handleSubmit,
    handleTestConnection,
    isLoading,
    isFetching,
    isTesting,
    isVerified,
    isSecretTesting,
    webhookHealth,
    handleVerifySecret,
    showAccessToken,
    showWebhookSecret,
    toggleAccessToken,
    toggleWebhookSecret,
  } = useSellerSettings();

  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-brand-core)] animate-spin mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium">Đang tải cấu hình của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1
          className="text-[28px] font-bold tracking-tight mb-2"
          style={{ color: "var(--color-text-primary)", letterSpacing: "-0.44px" }}
        >
          Cấu hình gian hàng
        </h1>
        <p className="text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
          Kết nối cửa hàng Shopify của bạn để bắt đầu bán hàng qua Escrow.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* ─── Main Form ─── */}
        <div className="md:col-span-2 space-y-6">
          <Card
            className="bg-white border-0 overflow-hidden"
            style={{
              borderRadius: "var(--radius-card)",
              boxShadow: "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px",
            }}
          >
            <CardHeader
              className="pb-6 border-b"
              style={{ borderColor: "var(--color-surface-light)", background: "var(--color-surface-light)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 flex items-center justify-center"
                  style={{ background: "var(--color-text-primary)", borderRadius: "var(--radius-button)" }}
                >
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-[16px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Shopify Integration
                  </CardTitle>
                  <CardDescription className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                    Nhập thông tin Admin API từ Shopify của bạn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shop Name */}
                {/* Shopify Domain */}
                <div className="space-y-2">
                  <Label htmlFor="shopifyDomain" className="text-[13px] font-semibold ml-1" style={{ color: "var(--color-text-primary)" }}>
                    Shopify Domain
                  </Label>
                  <div className="relative">
                    <Input
                      id="shopifyDomain"
                      placeholder="example.myshopify.com"
                      value={formData.shopifyDomain}
                      onChange={(e) => updateField("shopifyDomain", e.target.value)}
                      className="h-12 pl-10 border-[var(--color-border-gray)]"
                      style={{ borderRadius: "var(--radius-button)" }}
                      required
                    />
                    <Globe className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
                  </div>
                  <p className="text-[11px] ml-1" style={{ color: "var(--color-text-secondary)" }}>
                    Nhập tên miền Shopify đầy đủ (ví dụ: store-name.myshopify.com)
                  </p>
                </div>

                {/* Access Token */}
                <div className="space-y-2">
                  <Label htmlFor="accessToken" className="text-[13px] font-semibold ml-1" style={{ color: "var(--color-text-primary)" }}>
                    Admin API Access Token
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="accessToken"
                        type={showAccessToken ? "text" : "password"}
                        placeholder="shpat_..."
                        value={formData.accessToken}
                        onChange={(e) => updateField("accessToken", e.target.value)}
                        className="h-12 pl-10 pr-10 border-[var(--color-border-gray)]"
                        style={{ borderRadius: "var(--radius-button)" }}
                        required
                      />
                      <Key className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
                      <button
                        type="button"
                        onClick={toggleAccessToken}
                        className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showAccessToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant={isVerified ? "secondary" : "outline"}
                      onClick={handleTestConnection}
                      disabled={isTesting || isLoading || !formData.shopifyDomain || !formData.accessToken}
                      className="h-12 px-4 whitespace-nowrap"
                      style={{ borderRadius: "var(--radius-button)" }}
                    >
                      {isTesting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        "Kiểm tra"
                      )}
                    </Button>
                  </div>
                  {isVerified && (
                    <p className="text-[11px] text-green-600 font-medium ml-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Kết nối hợp lệ
                    </p>
                  )}
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret" className="text-[13px] font-semibold ml-1" style={{ color: "var(--color-text-primary)" }}>
                    Webhook API Secret Key (Cho xác thực HMAC)
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="webhookSecret"
                        type={showWebhookSecret ? "text" : "password"}
                        placeholder="Nhập secret key của app..."
                        value={formData.webhookSecret}
                        onChange={(e) => updateField("webhookSecret", e.target.value)}
                        className="h-12 pl-10 pr-10 border-[var(--color-border-gray)]"
                        style={{ borderRadius: "var(--radius-button)" }}
                        required
                      />
                      <Key className="absolute left-3 top-3.5 w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
                      <button
                        type="button"
                        onClick={toggleWebhookSecret}
                        className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showWebhookSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant={webhookHealth?.status === "verified" ? "secondary" : "outline"}
                      onClick={handleVerifySecret}
                      disabled={isSecretTesting || isLoading || !formData.webhookSecret}
                      className="h-12 px-4 whitespace-nowrap"
                      style={{ borderRadius: "var(--radius-button)" }}
                    >
                      {isSecretTesting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : webhookHealth?.status === "verified" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        "Xác minh"
                      )}
                    </Button>
                  </div>
                  {webhookHealth?.status === "error" && (
                    <p className="text-[11px] text-red-500 font-medium ml-1">
                      ❌ {webhookHealth.lastError || "Secret không hợp lệ."}
                    </p>
                  )}
                  {webhookHealth?.status === "verified" && (
                    <p className="text-[11px] text-green-600 font-medium ml-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Secret chính xác (Đã test vòng lặp)
                    </p>
                  )}
                  <p className="text-[11px] ml-1 italic" style={{ color: "var(--color-text-secondary)" }}>
                    Tìm thấy trong mục 'API credentials' của Custom App
                  </p>
                </div>

                {/* Payout Address */}
                <div
                  className="space-y-4 pt-4 border-t"
                  style={{ borderColor: "var(--color-surface-light)" }}
                >
                  <div className="p-4" style={{ background: "#f7f3ff", borderRadius: "var(--radius-card)" }}>
                    <div className="flex gap-4">
                      <div
                        className="p-2 h-fit flex items-center justify-center"
                        style={{ background: "#e3d5fa", borderRadius: "var(--radius-button)" }}
                      >
                        <Wallet className="w-5 h-5" style={{ color: "var(--color-brand-luxe)" }} />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="payoutAddress" className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          Ví Nhận Tiền (Payout Address)
                        </Label>
                        <p className="text-[12px] mt-0.5 mb-3" style={{ color: "var(--color-text-secondary)" }}>
                          Ví này sẽ nhận tiền từ Escrow Smart Contract sau khi giao dịch hoàn tất.
                        </p>
                        <Input
                          id="payoutAddress"
                          placeholder="0x..."
                          value={formData.payoutAddress}
                          onChange={(e) => updateField("payoutAddress", e.target.value)}
                          className="h-11 border-[var(--color-border-gray)]"
                          style={{ borderRadius: "var(--radius-button)" }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-6">
                  {!isVerified && (
                    <p className="text-[12px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 mb-2">
                       Bạn cần bấm <strong>Kiểm tra</strong> bên cạnh ô Token để xác thực kết nối trước khi lưu.
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium text-base text-white transition-all active:scale-[0.98]"
                    style={{ 
                      background: isVerified ? "var(--color-text-primary)" : "#ccc", 
                      borderRadius: "var(--radius-button)" 
                    }}
                    disabled={isLoading || isTesting || !isVerified}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu cấu hình & Kích hoạt"
                    )}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-6">
          {/* Guide */}
          <Card
            className="text-white border-0 overflow-hidden"
            style={{ background: "var(--color-text-primary)", borderRadius: "var(--radius-card)" }}
          >
            <CardHeader>
              <CardTitle className="text-[16px] font-semibold text-white">Hướng dẫn thiết lập</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[13px] opacity-80">
              {[
                "Vào Shopify Admin > Settings > App and sales channels.",
                "Bấm 'Develop apps' > 'Create an app'.",
                "Configure Admin API scopes (Cần: read_products, read_orders).",
                "Install app và copy 'Admin API access token'.",
                "Copy 'API secret key' và dán vào ô 'Webhook API Secret' bên cạnh.",
              ].map((step, i) => (
                <div className="flex gap-3" key={i}>
                  <div className="bg-white/20 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {i + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status */}
          <Card
            className="border-0 overflow-hidden"
            style={{ background: "#e6f3e6", borderRadius: "var(--radius-card)" }}
          >
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <CheckCircle2 className={`w-8 h-8 ${isVerified ? "text-green-600" : "text-zinc-400 opacity-30"}`} />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e4620]">
                {isVerified ? "Đã xác thực kết nối" : "Chưa xác thực"}
              </p>
              <p className="text-[11px] text-[#2d6a31]">
                {isVerified 
                  ? "Cấu hình Shopify của bạn đã được kiểm tra và sẵn sàng hoạt động." 
                  : "Vui lòng kiểm tra kết nối để tiếp tục."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
