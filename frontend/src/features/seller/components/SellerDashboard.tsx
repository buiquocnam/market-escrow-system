"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/features/escrow/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Wallet, CheckCircle2, AlertCircle, ExternalLink, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SellerDashboard() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions(undefined, user?.paymentWalletAddress);

  const stats = {
    total: transactions?.length || 0,
    pending: transactions?.filter(t => (t.status as string).toLowerCase() === 'pending').length || 0,
    released: transactions?.filter(t => (t.status as string).toLowerCase() === 'released').length || 0,
    releasedVolume: transactions?.reduce((acc, t) => acc + ((t.status as string).toLowerCase() === 'released' ? (t.priceUsd || 0) : 0), 0) || 0,
    lockedVolume: transactions?.reduce((acc, t) => acc + ((t.status as string).toLowerCase() === 'pending' ? (t.priceUsd || 0) : 0), 0) || 0
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Trung tâm Người bán</h1>
          <p className="text-zinc-500 font-medium">Theo dõi đơn hàng và dòng tiền Escrow từ khách hàng của bạn.</p>
        </div>
        
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
          <div className="px-5 py-2.5 bg-white rounded-[14px] shadow-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight leading-none mb-0.5">Ví nhận tiền (Payout)</span>
              <span className="text-sm font-bold text-zinc-900 line-clamp-1 max-w-[200px]">
                {(user as any)?.payoutAddress || user?.paymentWalletAddress}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Tổng đơn hàng", value: stats.total, icon: Package, color: "bg-blue-50 text-blue-600" },
          { label: "Tiền đang khóa", value: `$${stats.lockedVolume.toFixed(2)}`, icon: ShieldCheck, color: "bg-amber-50 text-amber-600" },
          { label: "Đã giải ngân", value: `$${stats.releasedVolume.toFixed(2)}`, icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
          { label: "Số đơn hoàn tất", value: stats.released, icon: CheckCircle2, color: "bg-indigo-50 text-indigo-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-zinc-200 shadow-xl rounded-[32px] overflow-hidden bg-white">
        <CardHeader className="px-8 py-8 border-b border-zinc-100 bg-zinc-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 p-2.5 rounded-2xl shadow-lg">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-extrabold">Đơn hàng đến</CardTitle>
                <CardDescription>Danh sách khách hàng đã thanh toán vào Escrow</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Khách hàng</th>
                  <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Giá trị</th>
                  <th className="px-8 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Ngày đặt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                        <p className="text-sm font-medium text-zinc-400">Đang tải danh sách đơn hàng...</p>
                      </div>
                    </td>
                  </tr>
                ) : transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Package className="w-12 h-12" />
                        <p className="text-lg font-bold">Chưa có đơn hàng nào</p>
                      </div>
                    </td>
                  </tr>
                ) : transactions?.map((tx) => (
                  <tr key={tx.txHash} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 line-clamp-1">{tx.productTitle}</span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1 group-hover:text-zinc-600 transition-colors">
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold border-none shadow-sm",
                        (tx.status as string).toLowerCase() === 'released' 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {(tx.status as string).toLowerCase() === 'released' ? "ĐÃ GIẢI NGÂN" : "ĐANG GIỮ TIỀN"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-medium text-zinc-500 font-mono">
                          {tx.buyerAddress?.slice(0, 6)}...{tx.buyerAddress?.slice(-4)}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900">${tx.priceUsd?.toFixed(2)}</span>
                        <span className="text-[10px] text-indigo-600 font-bold">{tx.amountEth} ETH</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-xs font-bold text-zinc-400">
                        {tx.orderDate ? format(new Date(tx.orderDate), "HH:mm, dd/MM") : "Vừa xong"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">Quy trình giải ngân</p>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            Tiền sẽ được giữ an toàn trong Smart Contract. Người mua cần xác nhận 'Đã nhận hàng' để giải ngân tiền về ví của bạn. 
            Nếu có tranh chấp, đội ngũ hỗ trợ sẽ can thiệp dựa trên vận đơn Shopify.
          </p>
        </div>
      </div>
    </div>
  );
}
