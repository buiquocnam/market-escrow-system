"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { IProduct } from "@/types";
import Link from "next/link";

export interface ProductCardProps {
  product: IProduct;
  action?: React.ReactNode;
  isPending?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  action,
  isPending,
}) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Nếu user bấm vào nút thanh toán, dừng ngay sự kiện chuyển trang
    if ((e.target as HTMLElement).closest('.checkout-slot')) return;
    router.push(`/product/${product.handle}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="flex flex-col bg-white rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-airbnb)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-airbnb-hover)] group h-full cursor-pointer border border-gray-100"
    >
      <div className="flex flex-col flex-grow">
        {/* Image Wrapper */}
        <div className="relative w-full aspect-[4/3] bg-[var(--color-surface-light)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={product.imageSrc} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
          {/* Pending Payment Overlay */}
          {isPending && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-lg animate-pulse">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chờ thanh toán
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="px-5 pt-5 flex flex-col flex-grow">
          <h3 className="text-[20px] font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-[1.2] tracking-tight mb-3">
            {product.title}
          </h3>
          
          {product.shopName && (
            <div className="mb-3" onClick={e => e.stopPropagation()}>
              <Link 
                href={`/shop/${product.shopName}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100 transition-colors hover:bg-indigo-100"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {product.shopName}
              </Link>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
             <Badge variant="outline" className="text-[10px] font-semibold border-gray-200 text-gray-500 uppercase tracking-tighter px-2 py-0.5 rounded-sm">
               {product.category}
             </Badge>
          </div>
          
          <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4 pb-2">
            <div>
              <p className="text-[12px] text-[var(--color-text-secondary)] font-medium mb-1 uppercase tracking-wider">Total Due</p>
              <p className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight">
                ${product.priceUsd.toLocaleString()} 
                <span className="text-[14px] font-normal text-[var(--color-text-secondary)] ml-1">
                  (≈ {product.ethPrice.toFixed(4)} ETH)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Checkout logic */}
      <div className="px-5 pb-5 checkout-slot" onClick={e => e.stopPropagation()}>
        {action}
      </div>
    </div>
  );
};
