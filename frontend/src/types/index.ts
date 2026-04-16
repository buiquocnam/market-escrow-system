/**
 * Shared Type Definitions for AI Crypto Escrow Marketplace
 * These types are used by both Frontend and Backend
 */

export enum EscrowStatus {
  PENDING = 'Pending',
  RELEASED = 'Released',
  REFUNDED = 'Refunded',
  FLAGGED = 'Flagged'
}

export interface IEscrow {
  _id?: string;
  txHash: string;
  buyerAddress: string;
  sellerAddress: string;
  productTitle: string;
  amountEth: number;
  priceUsd: number;
  status: EscrowStatus;
  shopifyOrderId?: string | null;
  userId?: string;
  orderDate?: string | Date;
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  priceUsd: number;
  ethPrice: number;
  imageSrc: string;
  descriptionHtml?: string;
  category: string;
  tags: string[];
  shopName?: string;
  sellerWalletAddress?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface FetchProductsResponse {
  products: IProduct[];
  pageInfo: PageInfo;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}
