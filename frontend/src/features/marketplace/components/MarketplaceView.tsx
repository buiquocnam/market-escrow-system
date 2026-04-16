"use client";

import { useSearchParams } from "next/navigation";
import { ProductCard } from "./ProductCard";
import { CategoryBar } from "./CategoryBar";
import { Button } from "@/components/ui/button";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import { useActiveSession } from "@/hooks/useActiveSession";

export function MarketplaceView() {
  const searchParams = useSearchParams();
  const rawSearchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "all";

  // Debounce search query to avoid unnecessary API calls
  const searchQuery = useDebounce(rawSearchQuery, 300);

  // 1. Fetch Categories via Custom Hook
  const { data: categories = [] } = useCategories();

  // 2. Fetch Products via Custom Hook (Handles Infinite Scroll & Bug Fixes)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
    status,
  } = useProducts(searchQuery, selectedCategory);

  const products = data?.pages.flatMap((page) => page.products) || [];

  // 3. Check if user has a pending checkout session
  const { data: activeSession } = useActiveSession();
  const pendingProductTitle = activeSession?.productTitle || null;

  return (
    <>
      <CategoryBar dynamicCategories={categories} />

      <main className="min-h-screen bg-gray-50 pb-24 w-full">
        <section className="px-6 md:px-8 max-w-[1400px] mx-auto w-full pt-8">
          
          {isPending ? (
             <div className="flex flex-col items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                <span className="mt-4 text-gray-500 font-medium">Scanning Marketplace...</span>
             </div>
          ) : status === "error" ? (
             <div className="text-center p-20 text-red-500 font-bold">
               Error loading products. Please try again later.
             </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-12 mt-12 rounded-3xl text-center border border-gray-100 shadow-sm">
               <div className="text-5xl mb-6">🔍</div>
               <h3 className="text-2xl font-bold mb-2">No products found</h3>
               <p className="text-gray-500">
                 We couldn't find any listings matching your search criteria.
               </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 transition-opacity duration-300">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    isPending={product.title === pendingProductTitle}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className="mt-16 flex justify-center">
                  <Button 
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="px-10 py-6 rounded-full font-bold border-2 border-black hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    {isFetchingNextPage ? "Loading..." : "Show more results"}
                  </Button>
                </div>
              )}
              
              {isFetching && !isFetchingNextPage && (
                <div className="fixed bottom-10 right-10">
                   <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-xl flex items-center gap-2">
                     <div className="animate-spin h-4 w-4 border-b-2 border-black rounded-full" />
                     <span className="text-xs font-bold uppercase tracking-widest">Updating</span>
                   </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
