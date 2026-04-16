"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'seller';
}

/**
 * ProtectedRoute Component
 * A clean wrapper that centralizes the auth-check and redirection logic.
 * Ensures consistent behavior across all protected routes.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. If loading finished and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // 2. If authenticated but doesn't have the required role, redirect to home
    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push('/');
      return;
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  // Show a clean loading state while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50/10">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  // If role mismatch (while still on the page before redirect), hide content
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
