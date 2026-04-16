"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login: finishLogin, logout: authLogout } = useAuth();

  const login = async (email: string, password?: string, redirectTo: string = "/") => {
    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }
    if (!password) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>("/auth/login", { email, password });
      
      if (res.success && res.data) {
        finishLogin(res.data);
        toast.success("Đăng nhập thành công! Chào mừng quay trở lại.");
        
        router.push(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    login,
    logout: () => {
      authLogout();
      router.push("/");
    }
  };
}
