"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const ICON_MAP: Record<string, string> = {
  "all": "🌐",
  "apparel": "👕",
  "clothing": "👕",
  "electronics": "💻",
  "tech": "💻",
  "gadgets": "💻",
  "jewelry": "💎",
  "art": "🎨",
  "automotive": "🚗",
  "cars": "🚗",
  "realestate": "🏠",
  "property": "🏠",
  "services": "💼",
  "general": "📦",
};

const DEFAULT_CATEGORIES = [
  { id: "all", label: "Tất cả", icon: "🌐" },
];

interface CategoryListProps {
  dynamicCategories?: string[];
}

function CategoryList({ dynamicCategories }: CategoryListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeCategory = searchParams.get("category") || "all";

  const categories = React.useMemo(() => {
    const base = [...DEFAULT_CATEGORIES];
    if (!dynamicCategories) return base;

    const dynamicOnes = dynamicCategories.map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      label: cat,
      icon: ICON_MAP[cat.toLowerCase()] || "📦"
    }));

    return [base[0], ...dynamicOnes];
  }, [dynamicCategories]);

  const handleSelect = (categoryId: string, label: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", label);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto no-scrollbar py-3" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.label || activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id, cat.label)}
                suppressHydrationWarning
                className={`flex flex-col items-center gap-1.5 min-w-max transition-all duration-200 outline-none group
                  ${isActive ? 'opacity-100 text-black' : 'opacity-60 text-gray-500 hover:opacity-100 hover:text-black'}
                `}
              >
                <span className={`text-[24px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {cat.icon}
                </span>
                <span className={`text-[12px] whitespace-nowrap pb-1 border-b-2 transition-all duration-200 
                  ${isActive ? 'font-bold border-black' : 'font-medium border-transparent group-hover:border-gray-200'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CategoryBar({ dynamicCategories }: { dynamicCategories?: string[] }) {
  return (
    <Suspense fallback={<div className="h-[73px] border-b border-gray-100 bg-white w-full" />}>
      <CategoryList dynamicCategories={dynamicCategories} />
    </Suspense>
  );
}
