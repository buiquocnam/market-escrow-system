"use client";

import React from 'react';
import { EscrowStatus } from '@/types';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactions } from '../hooks/useTransactions';
import { useEscrowActions } from '../hooks/useEscrowActions';

export function EscrowDashboard() {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const { releaseFunds, processingId } = useEscrowActions();

  const handleRelease = async (tx: any) => {
    try {
      await releaseFunds(tx);
      toast.success("Giải ngân thành công! Người bán sẽ sớm nhận được tiền.");
    } catch (err: any) {
      toast.error("Lỗi: " + (err.message || "Không thể giải ngân"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-[70vh]">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-zinc-900">
          Lịch sử đơn hàng
        </h1>
        <p className="text-base text-zinc-500 font-medium max-w-2xl mx-auto">
          Theo dõi trạng thái và quản lý các giao dịch mua sắm an toàn của bạn.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center max-w-md mx-auto">
           <p className="font-bold mb-1">Không thể tải dữ liệu</p>
           <p className="text-sm opacity-80">{(error as Error).message}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 px-6 font-bold text-zinc-900">Thông tin sản phẩm</TableHead>
                <TableHead className="py-5 font-bold text-zinc-900">Giao dịch</TableHead>
                <TableHead className="py-5 font-bold text-zinc-900">Tổng tiền</TableHead>
                <TableHead className="py-5 font-bold text-zinc-900">Trạng thái</TableHead>
                <TableHead className="py-5 px-6 font-bold text-zinc-900 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-zinc-100 p-4 rounded-full mb-2">
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-zinc-500 font-medium text-lg">Bạn chưa có đơn hàng nào</p>
                      <p className="text-zinc-400 text-sm">Hãy bắt đầu mua sắm để theo dõi các giao dịch tại đây.</p>
                      <Button variant="outline" className="mt-4 rounded-full" onClick={() => window.location.href = '/'}>
                        Khám phá Marketplace
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx._id} className="hover:bg-zinc-50/30 transition-colors">
                    <TableCell className="py-6 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-zinc-900">{tx.productTitle}</span>
                        <span className="text-xs text-zinc-400 font-medium">
                          Ngày đặt: {new Date(tx.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline font-mono text-xs flex items-center gap-1 w-fit"
                      >
                        {tx.txHash.substring(0, 10)}...
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{tx.amountEth} ETH</span>
                        <span className="text-xs text-zinc-400">${(tx.priceUsd || 0).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "rounded-full px-3 py-1 font-semibold text-[10px] tracking-wide uppercase",
                          tx.status === EscrowStatus.PENDING 
                            ? "bg-amber-50 text-amber-600 border-amber-100" 
                            : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}
                      >
                        {tx.status === EscrowStatus.PENDING ? "Đang treo Escrow" : "Đã hoàn tất"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-6 text-right">
                      {tx.status === EscrowStatus.PENDING ? (
                        <Button 
                          onClick={() => handleRelease(tx)}
                          disabled={processingId === tx._id}
                          size="sm"
                          className="bg-zinc-900 hover:bg-black text-white rounded-full px-5 font-bold transition-all active:scale-95 disabled:opacity-50"
                        >
                          {processingId === tx._id ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                        </Button>
                      ) : (
                        <div className="text-emerald-600 font-bold text-xs py-1 px-3 bg-emerald-50 w-fit ml-auto rounded-full border border-emerald-100">
                          Thành công
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
