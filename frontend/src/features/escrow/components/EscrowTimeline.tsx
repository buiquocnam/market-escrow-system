"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Check, Clock, Package, ShieldCheck } from "lucide-react";

export type EscrowStep = 'payment_confirmed' | 'shipped' | 'completed';

interface EscrowTimelineProps {
  currentStep: EscrowStep;
  isError?: boolean;
}

export function EscrowTimeline({ currentStep, isError }: EscrowTimelineProps) {
  const steps = [
    { 
      key: 'payment_confirmed', 
      label: 'Đã khóa tiền', 
      description: 'Tiền đã nằm trong Smart Contract',
      icon: ShieldCheck 
    },
    { 
      key: 'shipped', 
      label: 'Đang giao hàng', 
      description: 'Seller đã gửi hàng (Shopify)',
      icon: Package 
    },
    { 
      key: 'completed', 
      label: 'Hoàn tất', 
      description: 'Bạn đã nhận hàng & giải ngân',
      icon: Check 
    },
  ];

  const getStepIndex = (step: EscrowStep) => steps.findIndex(s => s.key === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100 -z-10" />
        
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-700 -z-10" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                  isCompleted ? "bg-indigo-600 border-indigo-100 text-white" : 
                  isCurrent ? "bg-white border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100" :
                  "bg-white border-zinc-100 text-zinc-300"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <div className="mt-4 text-center">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest mb-1",
                  isCurrent ? "text-indigo-600" : "text-zinc-500"
                )}>
                  {step.label}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium max-w-[120px] mx-auto leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {isCurrent && (
        <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <Clock className="w-5 h-5 text-indigo-500 animate-pulse" />
            <p className="text-sm font-bold text-indigo-700">
                {currentStep === 'payment_confirmed' && "Đang chờ Seller chuẩn bị hàng..."}
                {currentStep === 'shipped' && "Đang vận chuyển! Hãy xác nhận khi bạn nhận được hàng."}
                {currentStep === 'completed' && "Giao dịch đã hoàn thành an toàn."}
            </p>
        </div>
      )}
    </div>
  );
}
