"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usePathname } from "next/navigation";

/**
 * Seller Layout
 * Centralized guard for all seller-related routes.
 */
export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Cho phép Buyer truy cập trang settings để họ có thể điền thông tin và nâng cấp lên Seller.
  // Các trang khác (như /seller/dashboard) vẫn yêu cầu quyền Seller.
  const isSettingsPage = pathname === "/seller/settings";
  const requiredRole = isSettingsPage ? undefined : "seller";

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  );
}
