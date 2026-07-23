import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn accessToken vào mọi request — lấy trực tiếp từ Zustand store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Hàng đợi các request bị 401 trong lúc đang refresh — tránh gọi /refresh-token
// nhiều lần cùng lúc nếu nhiều request đồng thời đều hết hạn token
let isRefreshing = false;
let refreshQueue: Array<(newAccessToken: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, logout, setTokens } = useAuthStore.getState();

    // Không có refresh token (chưa đăng nhập, hoặc đã hết hạn từ trước) -> đăng xuất luôn
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    // Nếu đã có 1 lần refresh đang chạy, request này CHỜ kết quả thay vì tự gọi refresh riêng
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newAccessToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi bằng axios gốc (không phải apiClient) để tránh vòng lặp interceptor vô hạn
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
        refreshToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = res.data.data;

      setTokens(accessToken, newRefreshToken);

      // Giải phóng toàn bộ request đang chờ, cho chạy lại với token mới
      refreshQueue.forEach((callback) => callback(accessToken));
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh token cũng hết hạn/không hợp lệ -> không còn cách nào khác, đăng xuất
      logout();
      refreshQueue = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errors?: Record<string, string[]>;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}