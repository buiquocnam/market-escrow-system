"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function useStoreSettings() {
  const [payoutAddress, setPayoutAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ status: string; data: any }>("/transactions/settings");
      if (res.status === "success" && res.data) {
        setPayoutAddress(res.data.defaultPayoutAddress);
      }
    } catch (err) {
      console.error("Load Settings Error:", err);
      toast.error("Không thể tải cấu hình gian hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAddress.startsWith("0x") || payoutAddress.length !== 42) {
      toast.error("Địa chỉ ví không hợp lệ (phải bắt đầu bằng 0x)");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post<{ status: string }>("/transactions/settings/update", {
        payoutAddress
      });
      if (res.status === "success") {
        toast.success("Cập nhật cấu hình gian hàng thành công!");
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    payoutAddress,
    setPayoutAddress,
    loading,
    saving,
    handleSave
  };
}
