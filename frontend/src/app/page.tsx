"use client";

import { Suspense } from "react";
import { MarketplaceView } from "@/features/marketplace/components/MarketplaceView";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-gray-500 font-medium">Loading Marketplace...</div>}>
      <MarketplaceView />
    </Suspense>
  );
}
