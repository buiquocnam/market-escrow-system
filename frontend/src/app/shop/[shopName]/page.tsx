"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchShopDetails } from "@/features/marketplace/api/shopifyApi";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { ReviewSection } from "@/features/marketplace/components/ReviewSection";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { CheckoutButton } from "@/features/escrow/components/CheckoutButton";
import Link from "next/link";
import { format } from "date-fns";
import { IProduct } from "@/types";

export default function ShopDetailPage() {
  const params = useParams();
  const shopName = params.shopName as string;
  
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadShop() {
      try {
        setIsLoading(true);
        const data = await fetchShopDetails(shopName);
        setShopInfo(data.shop);
        setProducts(data.products);
      } catch (error) {
        console.error("Failed to load shop details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (shopName) loadShop();
  }, [shopName]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--palette-grey50)] pb-24">
      {/* Shop Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1240px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-100">
                {shopName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{shopName}</h1>
                    {shopInfo?.isVerified && (
                        <span className="text-blue-500" title="Shopify Verified">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-1 mt-1 text-[13px] text-gray-500 font-medium">
                    <p>Shopify Merchant • {shopInfo?.createdAt ? `Joined ${format(new Date(shopInfo.createdAt), "MMMM yyyy")}` : "Since 2024"}</p>
                    <p className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {shopInfo?.email || "No contact email"}
                    </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payout:</span>
                        <div 
                          className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 group cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            if (shopInfo?.sellerAddress) {
                              navigator.clipboard.writeText(shopInfo.sellerAddress);
                              toast.success("Đã sao chép địa chỉ ví!");
                            }
                          }}
                        >
                          <code className="text-[12px] text-gray-600 font-mono">
                            {shopInfo?.sellerAddress || "Unknown Address"}
                          </code>
                          <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">TZ:</span>
                        <span className="text-[11px] font-semibold text-gray-500 uppercase">{shopInfo?.timezone || "UTC"}</span>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
               <div className="bg-indigo-50 px-5 py-3 rounded-xl border border-indigo-100 text-center">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Items</p>
                  <p className="text-xl font-bold text-indigo-700">{products.length}</p>
               </div>
               <div className="bg-green-50 px-5 py-3 rounded-xl border border-green-100 text-center">
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Trust Status</p>
                  <p className="text-xl font-bold text-green-700">Verified</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="max-w-[1240px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cửa hàng của {shopName}</h2>
            <Link href="/" className="text-indigo-600 font-semibold hover:underline text-sm flex items-center gap-1">
                ← Quay lại Marketplace
            </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-300">
             <p className="text-xl text-gray-400 font-medium">Shop này hiện chưa có sản phẩm nào được đăng tải.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                action={<CheckoutButton product={product} />}
              />
            ))}
          </div>
        )}

        <ReviewSection shopName={shopName} />
      </div>
    </main>
  );
}
