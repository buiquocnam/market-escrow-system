"use client";

import React, { useState, Suspense } from "react";
import { useLogin } from "@/hooks/useLogin";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useLogin();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, redirectTo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-zinc-200 rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 pt-8 pb-6 text-center bg-white">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Chào mừng bạn</CardTitle>
          <CardDescription className="text-zinc-500 font-medium pt-1">
            Đăng nhập hoặc đăng ký tài khoản mới
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">

              <Label htmlFor="email" className="text-sm font-bold text-zinc-700 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl h-12 border-zinc-200 focus:ring-zinc-900"
                required 
                suppressHydrationWarning
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-zinc-700 ml-1">Mật khẩu</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Nhập mật khẩu (mk)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl h-12 border-zinc-200 focus:ring-zinc-900"
                required 
                suppressHydrationWarning
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 rounded-2xl bg-zinc-900 hover:bg-black text-white font-bold text-base transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Tiếp tục"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/50 p-6">
          <p className="text-xs text-center text-zinc-400 font-medium px-4">
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="text-zinc-400 font-medium">Đang tải...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
