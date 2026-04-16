"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fetchSellerSettings, updateSellerSettings } from "../api/sellerApi";
import { syncShopifyProducts, testShopifyConnection, verifyWebhookSecret } from "@/features/marketplace/api/shopifyApi";

type SellerFormData = {
  shopifyDomain: string;
  accessToken: string;
  shopName: string;
  payoutAddress: string;
  webhookSecret: string;
};

/**
 * Hook quản lý toàn bộ logic trang Seller Settings.
 * Tuân thủ ARCHITECTURE_RULES #1: Logic tách biệt khỏi Presentation.
 */
export function useSellerSettings() {
  const { user, isAuthenticated, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSecretTesting, setIsSecretTesting] = useState(false);
  const [webhookHealth, setWebhookHealth] = useState<{ status: string; lastError: string } | null>(null);
  
  // Visibility toggles
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [formData, setFormData] = useState<SellerFormData>({
    shopifyDomain: "",
    accessToken: "",
    shopName: "",
    payoutAddress: "",
    webhookSecret: "",
  });

  // ─── Fetch existing settings on mount ───
  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      try {
        const res = await fetchSellerSettings(user.userId);
        if (res.success && res.data) {
          setFormData({
            shopifyDomain: res.data.sellerConfig?.shopifyDomain || "",
            accessToken: res.data.sellerConfig?.accessToken || "",
            shopName: res.data.sellerConfig?.shopName || "",
            payoutAddress: res.data.defaultPayoutAddress || "",
            webhookSecret: res.data.sellerConfig?.webhookSecret || "",
          });
          
          if (res.data.sellerConfig?.hasAccessToken) {
            setIsVerified(true);
          }

          setWebhookHealth({
            status: res.data.sellerConfig?.webhookStatus || "pending",
            lastError: res.data.sellerConfig?.webhookLastError || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch seller settings:", err);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [user?.userId]);

  // ─── Save / Update settings ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (
      formData.payoutAddress &&
      (!formData.payoutAddress.startsWith("0x") || formData.payoutAddress.length !== 42)
    ) {
      toast.error("Địa chỉ ví payout không hợp lệ (phải bắt đầu bằng 0x)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateSellerSettings({ userId: user.userId, ...formData });
      if (res.success) {
        toast.success("Cấu hình đã được cập nhật thành công!");
        
        // Cập nhật session toàn cục với ví payout mới và role seller
        login({ 
          ...user!, 
          role: "seller", 
          payoutAddress: formData.payoutAddress 
        });
        
        // --- Tự động đồng bộ sản phẩm mới từ Shopify ---
        toast.info("Đang tự động đồng bộ sản phẩm từ Shopify...");
        const syncRes = await syncShopifyProducts(user.userId);
        if (syncRes.success) {
          toast.success(`Đồng bộ thành công ${syncRes.data?.count || 0} sản phẩm!`);
        } else {
          toast.error("Đồng bộ sản phẩm thất bại: " + (syncRes.message || "Lỗi không xác định"));
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật cấu hình");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Test Connection ───
  const handleTestConnection = async () => {
    if (!formData.shopifyDomain || !formData.accessToken) {
      toast.error("Vui lòng nhập Shopify Domain và Access Token để kiểm tra");
      return;
    }

    setIsTesting(true);
    try {
      const res = await testShopifyConnection({
        shopifyDomain: formData.shopifyDomain,
        shopName: formData.shopName,
        accessToken: formData.accessToken,
        userId: user?.userId
      });

      if (res.success) {
        setIsVerified(true);
        toast.success(`Kết nối thành công tới shop: ${res.data.name} (${res.data.plan_name})`);
      } else {
        setIsVerified(false);
        toast.error(res.message || "Kết nối thất bại");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi kiểm tra kết nối");
    } finally {
      setIsTesting(false);
    }
  };

   // ─── Verify Webhook Secret (Probe) ───
  const handleVerifySecret = async () => {
    if (!user?.userId || !formData.shopifyDomain || !formData.accessToken || !formData.webhookSecret) {
      toast.error("Vui lòng nhập đầy đủ thông tin để chạy thử nghiệm Webhook");
      return;
    }

    setIsSecretTesting(true);
    try {
      const res = await verifyWebhookSecret({
        userId: user.userId,
        shopifyDomain: formData.shopifyDomain,
        accessToken: formData.accessToken,
        webhookSecret: formData.webhookSecret,
      });

      if (res.success) {
        toast.info("Đã gửi lệnh thử nghiệm. Đang chờ kết quả từ Shopify...");
        
        // Polling mechanism: Check status every 2 seconds for up to 15 seconds
        let attempts = 0;
        const maxAttempts = 8; // ~16 seconds total

        const interval = setInterval(async () => {
          attempts++;
          const checkRes = await fetchSellerSettings(user.userId);
          
          if (checkRes.success && checkRes.data?.sellerConfig) {
            const config = checkRes.data.sellerConfig;
            
            // If status changed from pending, stop polling and show result
            if (config.webhookStatus !== "pending" || attempts >= maxAttempts) {
              clearInterval(interval);
              setIsSecretTesting(false);

              setWebhookHealth({
                status: config.webhookStatus || "pending",
                lastError: config.webhookLastError || "",
              });

              if (config.webhookStatus === "verified") {
                toast.success("Xác thực Webhook Secret thành công!");
              } else if (config.webhookStatus === "error") {
                toast.error(`Lỗi: ${config.webhookLastError}`);
              } else {
                toast.warning("Chưa nhận được tín hiệu từ Shopify. Vui lòng thử lại sau.");
              }
            }
          }
        }, 2000);
      } else {
        toast.error(res.message || "Không thể khởi động lệnh thử nghiệm");
        setIsSecretTesting(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi hệ thống");
      setIsSecretTesting(false);
    }
  };

  const updateField = (field: keyof SellerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Reset verification if critical fields change
    if (field === 'shopifyDomain' || field === 'accessToken') {
      setIsVerified(false);
    }
  };

  return {
    user,
    formData,
    updateField,
    handleSubmit,
    handleVerifySecret,
    handleTestConnection,
    isLoading,
    isFetching,
    isTesting,
    isVerified,
    isSecretTesting,
    webhookHealth,
    showAccessToken,
    showWebhookSecret,
    toggleAccessToken: () => setShowAccessToken(!showAccessToken),
    toggleWebhookSecret: () => setShowWebhookSecret(!showWebhookSecret),
  };
}
