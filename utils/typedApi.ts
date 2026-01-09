/**
 * Type-safe API wrapper using generated OpenAPI types
 * This provides autocomplete and type checking for all API calls
 */

import { axiosInstance } from "@/lib/axiosInstance";
import { AxiosRequestConfig } from "axios";

// Import generated types (update path as needed)
// Note: You may need to generate these types from your OpenAPI spec
// using tools like openapi-typescript or similar

/**
 * Generic typed API call wrapper
 */
export async function apiCall<TResponse, TRequest = void>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const response = await axiosInstance.request<TResponse>({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
}

/**
 * Type-safe GET request
 */
export async function apiGet<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return apiCall<TResponse>('GET', url, undefined, config);
}

/**
 * Type-safe POST request
 */
export async function apiPost<TResponse, TRequest = any>(
  url: string,
  data: TRequest,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return apiCall<TResponse, TRequest>('POST', url, data, config);
}

/**
 * Type-safe PUT request
 */
export async function apiPut<TResponse, TRequest = any>(
  url: string,
  data: TRequest,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return apiCall<TResponse, TRequest>('PUT', url, data, config);
}

/**
 * Type-safe PATCH request
 */
export async function apiPatch<TResponse, TRequest = any>(
  url: string,
  data: TRequest,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return apiCall<TResponse, TRequest>('PATCH', url, data, config);
}

/**
 * Type-safe DELETE request
 */
export async function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  return apiCall<TResponse>('DELETE', url, undefined, config);
}

// Common request/response types
export interface CreateOrderRequest {
  offerId: number;
  quantity: number;
}

export interface CreateOrderResponse {
  id: number;
  userId: number;
  offerId: number;
  quantity: number;
  status: string;
  qrCodeToken: string;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  location: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  role: string;
  emailVerified: boolean;
  mapsLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Offer {
  id: number;
  ownerId: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  quantity: number;
  expirationDate: string;
  pickupStartTime?: string | null;
  pickupEndTime?: string | null;
  pickupLocation: string;
  mapsLink?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: any[];
  foodType?: string | null;
  taste?: string | null;
  owner?: Partial<User>;
}

export interface Order {
  id: number;
  userId: number;
  offerId: number;
  quantity: number;
  status: string;
  qrCodeToken: string;
  createdAt: string;
  updatedAt: string;
  offer?: Offer;
  user?: Partial<User>;
}

// Typed API functions for common operations
export const OrdersApi = {
  create: (data: CreateOrderRequest) => 
    apiPost<CreateOrderResponse, CreateOrderRequest>('/orders', data),
  
  getUserOrders: (userId: number) => 
    apiGet<Order[]>(`/orders/user/${userId}`),
  
  getProviderOrders: () => 
    apiGet<Order[]>('/orders/provider'),
  
  cancel: (orderId: number) => 
    apiPost<{ message: string }>(`/orders/${orderId}/cancel`, {}),
  
  scan: (qrCodeToken: string) => 
    apiPost<any>('/orders/scan', { qrCodeToken }),
};

export const OffersApi = {
  getAll: () => 
    apiGet<Offer[]>('/offers'),
  
  getById: (id: number) => 
    apiGet<Offer>(`/offers/${id}`),
  
  getByOwner: (ownerId: number) => 
    apiGet<Offer[]>(`/offers/owner/${ownerId}`),
  
  create: (data: Partial<Offer>) => 
    apiPost<Offer, Partial<Offer>>('/offers', data),
  
  update: (id: number, data: Partial<Offer>) => 
    apiPut<Offer, Partial<Offer>>(`/offers/${id}`, data),
  
  delete: (id: number) => 
    apiDelete<{ message: string }>(`/offers/${id}`),
};

export const UsersApi = {
  getMe: () => 
    apiGet<User>('/users/me'),
  
  updateMe: (data: Partial<User>) => 
    apiPost<User, Partial<User>>('/users/me', data),
  
  setRole: (role: 'CLIENT' | 'PROVIDER') => 
    apiPost<{ message: string; redirectTo: string; role: string }>('/users/set-role', { role }),
  
  updateDetails: (data: {
    phoneNumber: number;
    location: string;
    mapsLink: string;
    latitude?: number;
    longitude?: number;
  }) => 
    apiPost<User>('/users/update-details', data),
  
  extractLocation: (mapsLink: string) => 
    apiPost<{ locationName: string }>('/users/extract-location', { mapsLink }),
};

export const AuthApi = {
  signin: (email: string, password: string) => 
    apiPost<{
      message: string;
      accessToken: string;
      refreshToken: string;
      user: User;
      role: string;
    }>('/auth/signin', { email, password }),
  
  signup: (email: string, username: string, password: string) => 
    apiPost<{
      message: string;
      accessToken: string;
      refreshToken: string;
      user: User;
      needsOnboarding: boolean;
    }>('/auth/signup', { email, username, password }),
  
  sendVerificationEmail: (email: string) => 
    apiPost<{ message: string; sent: boolean }>('/auth/send-verification-email', { email }),
  
  verifyEmailCode: (email: string, code: string) => 
    apiPost<{ verified: boolean; message: string }>('/auth/verify-email-code', { email, code }),
};

export const RatingsApi = {
  create: (orderId: number, rating: number, comment?: string) => 
    apiPost<any>('/ratings', { orderId, rating, comment }),
  
  getByOrder: (orderId: number) => 
    apiGet<any>(`/ratings/order/${orderId}`),
  
  getProviderAverage: (providerId: number) => 
    apiGet<{ average: number; total: number }>(`/ratings/provider/${providerId}/average`),
};

export const ContactApi = {
  send: (name: string, email: string, subject: string, message: string) => 
    apiPost<{ message: string }>('/contact', { name, email, subject, message }),
};

