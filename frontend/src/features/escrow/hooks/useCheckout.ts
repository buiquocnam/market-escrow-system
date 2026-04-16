"use client";

import { useEffect, useState } from "react";
import { parseEther } from "viem";
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { IProduct } from "@/types";
import { MARKET_ESCROW_ABI, MARKET_ESCROW_ADDRESS } from "@/core/blockchain/constants";
import { initEscrowRiskAnalysis, syncShopifyTransaction } from "../api/escrowApi";

export type CheckoutStatus = {
  message: string;
  type: "info" | "error" | "success";
};

export function useCheckout(product: IProduct) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  
  const { 
    data: hash, 
    error: writeError, 
    isPending: isWritePending, 
    writeContract 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ 
    hash, 
  });

  // Handle Syncing with Backend after Blockchain Confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      handlePostTransactionSync(hash);
    }
  }, [isConfirmed, hash]);

  // Handle Errors
  useEffect(() => {
    if (writeError) {
      if ((writeError as any).code === 4001) {
        setStatus({ message: "⚠️ Giao dịch đã bị từ chối bởi bạn.", type: "error" });
      } else {
        setStatus({ message: `Lỗi: ${writeError.message}`, type: "error" });
      }
    }
  }, [writeError]);

  const handlePostTransactionSync = async (txHash: string) => {
    try {
      setStatus({ message: "Giao dịch thành công! Đang đồng bộ với Shopify...", type: "info" });
      await syncShopifyTransaction({
        txHash,
        productTitle: product.title,
        priceUsd: product.priceUsd,
        amountEth: product.ethPrice,
        buyerAddress: address || "",
      });
      setStatus({ message: "✅ Hoàn tất! Đơn hàng của bạn đã được xác nhận.", type: "success" });
    } catch (err: any) {
      setStatus({ message: `Lỗi đồng bộ: ${err.message}`, type: "error" });
    }
  };

  const checkout = async () => {
    if (!isConnected) {
      setStatus({ message: "Vui lòng kết nối ví để thanh toán!", type: "error" });
      return;
    }

    if (chainId !== sepolia.id) {
      setStatus({ message: "Vui lòng chuyển sang mạng Sepolia!", type: "info" });
      switchChain({ chainId: sepolia.id });
      return;
    }

    try {
      setStatus({ message: "Phân tích AI Security Shield...", type: "info" });

      const riskAnalysis = await initEscrowRiskAnalysis({
        amount_eth: product.ethPrice,
        buyer_account_wallet_age_days: 2,
        tx_velocity_24h: 5,
        smart_contract_interactions: 0,
        geo_ip_mismatch: false, // Defaulting as AI risk removed
      });

      if (riskAnalysis.approval_required_from_admin || riskAnalysis.ai_evaluation?.is_fraud) {
        setStatus({
          message: "❌ GIAO DỊCH BỊ CHẶN! Hệ thống AI phát hiện dấu hiệu lừa đảo.",
          type: "error",
        });
        return;
      }

      setStatus({ message: "AI Shield OK. Đang khởi tạo giao dịch...", type: "info" });

      // Blockchain Call via Wagmi
      writeContract({
        address: MARKET_ESCROW_ADDRESS as `0x${string}`,
        abi: MARKET_ESCROW_ABI as any,
        functionName: 'deposit',
        args: ["0xFC0Fe88229F8aD065bDE0D23A0B33A4e0B65701c"], // Mock seller
        value: parseEther(product.ethPrice.toString()),
      });

    } catch (e: any) {
      setStatus({ message: `Lỗi khởi tạo: ${e.message}`, type: "error" });
    }
  };

  const loading = isWritePending || isConfirming;

  return {
    checkout,
    loading,
    status,
    isConnected,
  };
}

