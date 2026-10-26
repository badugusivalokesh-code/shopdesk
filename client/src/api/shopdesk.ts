import axios from "axios";

import { apiClient } from "./client";
import type { ApiErrorResponse, CurrentUserResponse, User } from "./types";

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Accessories",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface ProductListResponse {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface DashboardRecentOrder {
  orderNo: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrdersByDay {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  ordersByDay: OrdersByDay[];
  recentOrders: DashboardRecentOrder[];
}

export interface ProfileUpdate {
  name?: string;
  password?: string;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.error?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>("/stats");
  return response.data;
}

export async function listProducts(
  search: string,
  category: string,
  page: number,
): Promise<ProductListResponse> {
  const response = await apiClient.get<ProductListResponse>("/products", {
    params: { search, category, page },
  });
  return response.data;
}

export async function createProduct(payload: ProductInput): Promise<Product> {
  const response = await apiClient.post<{ product: Product }>("/products", payload);
  return response.data.product;
}

export async function updateProduct(id: string, payload: ProductInput): Promise<Product> {
  const response = await apiClient.put<{ product: Product }>(`/products/${encodeURIComponent(id)}`, payload);
  return response.data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${encodeURIComponent(id)}`);
}

export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const response = await apiClient.get<OrdersResponse>("/orders", {
    params: status ? { status } : undefined,
  });
  return response.data.orders;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const response = await apiClient.patch<{ order: Order }>(
    `/orders/${encodeURIComponent(id)}/status`,
    { status },
  );
  return response.data.order;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<CurrentUserResponse>("/auth/me");
  return response.data.user;
}

export async function updateMyProfile(payload: ProfileUpdate): Promise<User> {
  const response = await apiClient.put<{ user: User }>("/users/me", payload);
  return response.data.user;
}
