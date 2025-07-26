// src/services/auth.ts
import type { ApiResponse } from './api';
import { api } from './api';
import { AxiosError } from 'axios'; // FIX: Import AxiosError for type guarding

// 用户信息类型
export interface User {
  _id: string;
  username: string;
  email: string;
  profile?: {
    displayName: string;
  };
}

// 认证响应类型
export interface AuthResponse {
  user: User;
  token: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  profile: { displayName: string } | undefined;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 认证服务
export const authService = {
  // 用户注册
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);

      // 注册成功后自动保存token和用户信息
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_info', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error: unknown) {
      // FIX: Changed 'any' to 'unknown'
      let errorMessage = '注册失败';
      // FIX: Use AxiosError type guard to safely access error.response.data.message
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        // Fallback for standard Error objects
        errorMessage = error.message;
      }
      throw new Error(errorMessage); // Always throw a standard Error object with the message
    }
  },

  // 用户登录
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);

      // 登录成功后保存token和用户信息
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_info', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error: unknown) {
      // FIX: Changed 'any' to 'unknown'
      let errorMessage = '登录失败';
      // FIX: Use AxiosError type guard to safely access error.response.data.message
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        // Fallback for standard Error objects
        errorMessage = error.message;
      }
      throw new Error(errorMessage); // Always throw a standard Error object with the message
    }
  },

  // 退出登录
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  },

  // 获取当前用户信息
  getCurrentUser(): User | null {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
