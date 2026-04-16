"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IEscrow } from "@/types";
import { toast } from "sonner";
import { releaseEscrowFunds } from "../api/escrowApi";

export function useEscrowActions() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const releaseFunds = async (tx: IEscrow) => {
    try {
      setProcessingId(tx._id || tx.txHash);

      const response = await releaseEscrowFunds(tx.sessionId || tx.txHash);

      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast.success("Giải ngân thành công!");
      } else {
        toast.error("Lỗi giải ngân: " + (response.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Release Error:", err);
      toast.error("Lỗi hệ thống: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return {
    releaseFunds,
    processingId
  };
}
