import axios, { AxiosError, AxiosRequestConfig } from "axios";

/**
 * Standardized API Client using Axios.
 * Provides consistency, automatic JSON handling, and improved error catching.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Centalized request handler
 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axiosInstance.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        axiosError.message || 
        "An unexpected error occurred";
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Public API client methods
 */
export const api = {
  get: <T>(endpoint: string, params?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url: endpoint, params }),

  post: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url: endpoint, data }),

  put: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PUT", url: endpoint, data }),

  patch: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url: endpoint, data }),

  delete: <T>(endpoint: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url: endpoint }),
};
