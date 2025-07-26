// src/services/api.ts
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

// API基础配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://zhimo-backend.zeabur.app/api';

// 硬编码的TOKEN
// 请注意：在实际生产环境中，绝不应该将认证令牌硬编码在此处，
// 这会带来严重的安全风险！令牌应通过安全的登录流程获取并存储。
const DEBUG_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODg0NDU4ZTQ4YTZkYjY2M2U1ZWQyNjAiLCJpYXQiOjE3NTM0OTkyNTYsImV4cCI6MTc1NDEwNDA1Nn0.7wAV0lW15eyKjEmZJg5q77O_IhM981Pn11ufbS6tpb4';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = DEBUG_TOKEN; // 使用硬编码的DEBUG_TOKEN
    // 当需要恢复正常登录流程时，请将上一行注释掉，并取消注释下一行：
    // const token = localStorage.getItem('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  },
);

// 响应拦截器 - 统一处理错误
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 这里可以添加路由跳转逻辑
      console.warn('认证失效，请重新登录');
    }
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  },
);

// API响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// 通用API调用方法
export const api = {
  get: <T>(url: string, params?: unknown): Promise<ApiResponse<T>> =>
    apiClient.get(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    apiClient.post(url, data).then((res) => res.data),

  put: <T>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    apiClient.put(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<ApiResponse<T>> =>
    apiClient.delete(url).then((res) => res.data),

  // 文件上传专用方法
  upload: <T>(url: string, formData: FormData): Promise<ApiResponse<T>> =>
    apiClient
      .post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => res.data),
};

export default apiClient;
