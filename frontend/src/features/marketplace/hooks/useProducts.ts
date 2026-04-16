"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchShopifyProducts } from "../api/shopifyApi";
import { FetchProductsResponse } from "@/types";

/**
 * Hook to manage infinite product loading with filtering and search.
 * Fixes runtime error: Cannot read properties of undefined (reading 'hasNextPage')
 */
export function useProducts(searchQuery: string, selectedCategory: string) {
  return useInfiniteQuery<FetchProductsResponse>({
    queryKey: ["products", searchQuery, selectedCategory],
    queryFn: ({ pageParam }) => 
      fetchShopifyProducts(searchQuery, selectedCategory, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      // Fix: Add safe checks to prevent runtime crash if lastPage or pageInfo is missing
      if (!lastPage || !lastPage.pageInfo) return undefined;
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined;
    },
  });
}
