"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShopifyCategories } from "../api/shopifyApi";

/**
 * Hook to fetch and manage unique product categories from Shopify.
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchShopifyCategories,
    staleTime: 1000 * 60 * 60, // Categories change rarely, cache for 1 hour
  });
}
