"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuGroup,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PendingOrderBadge } from './PendingOrderBadge';

const Navbar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    setSearchQuery(searchParams?.get("q") || "");
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (val.trim()) {
        params.set("q", val.trim());
      } else {
        params.delete("q");
      }
      router.push(`/?${params.toString()}`);
    }, 500);
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công");
    router.push("/");
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      {/* Logo */}
      <Link href="/" className="text-indigo-600 flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
          <svg fill="currentColor" viewBox="0 0 32 32" className="w-6 h-6">
            <path d="M16 1.928c-3.14-.029-6.052 1.13-8.236 3.26L2.348 10.517A7.472 7.472 0 0 0 .167 15.65c-.173 1.948.337 3.86 1.442 5.438l.192.261 12.836 17.653c.677.93 1.838 1.487 2.993 1.488 1.155.001 2.316-.554 2.993-1.481l.192-.258 12.842-17.656a7.485 7.485 0 0 0 1.636-5.71 7.474 7.474 0 0 0-2.181-5.183L24.237 5.188c-2.184-2.13-5.097-3.29-8.237-3.26zm0 2.666c2.428-.023 4.673.849 6.353 2.45L27.765 12.4c.66.645 1.11 1.48 1.282 2.39a4.808 4.808 0 0 1-1.05 3.673l-.155.212-11.84 16.28-11.839-16.29-.153-.2A4.81 4.81 0 0 1 2.95 14.8c.175-.913.626-1.748 1.289-2.39L9.645 7.045C11.326 5.443 13.57 4.57 16 4.594zm0 6.07A4.665 4.665 0 0 0 11.332 15.33V16c0 2.578 2.088 4.667 4.668 4.667 2.579 0 4.667-2.089 4.667-4.667v-.67A4.666 4.666 0 0 0 16 10.665zm0 2.667A2 2 0 0 1 18 15.33V16a2 2 0 1 1-4 0v-.67a2 2 0 0 1 2-2z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight hidden sm:block">
          MarketEscrow
        </span>
      </Link>

      {/* Center Search Pill */}
      <div className="hidden md:flex items-center border border-gray-200 rounded-full pl-4 pr-1 py-1 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all flex-1 max-w-[450px] bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Tìm kiếm sản phẩm trên Marketplace..."
          className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400 px-3 py-1.5 dark:text-gray-200"
          suppressHydrationWarning
        />
      </div>

      {/* Right Navigation */}
      <div className="flex items-center gap-3">
        <PendingOrderBadge />
        {mounted ? (
          isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="relative h-10 w-10 rounded-full hover:bg-zinc-100 transition-colors flex items-center justify-center outline-none ring-offset-white focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
              >
                <Avatar className="h-10 w-10 border border-gray-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Tài khoản của tôi</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === 'buyer' ? (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
                        Lịch sử đơn hàng
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/seller/settings")} className="cursor-pointer text-indigo-600 font-medium">
                        Trở thành Người bán
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => router.push("/seller/dashboard")} className="cursor-pointer font-bold text-indigo-600">
                        Quản lý kinh doanh
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/seller/settings")} className="cursor-pointer">
                        Cài đặt gian hàng
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="rounded-full px-6 font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md">
                Đăng nhập
              </Button>
            </Link>
          )
        ) : (
          <div className="h-10 w-24" /> // Placeholder for layout stability
        )}
      </div>
    </div>
  );
};

export default Navbar;
