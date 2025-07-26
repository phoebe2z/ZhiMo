// src/stores/auth-store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, RegisterRequest, LoginRequest } from 'src/services/auth';
import { authService } from 'src/services/auth';

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!user.value);
  const displayName = computed(
    () => user.value?.profile?.displayName || user.value?.username || '',
  );

  // 初始化 - 从本地存储恢复用户状态
  function initializeAuth() {
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      user.value = currentUser;
    }
  }

  // 注册
  async function register(data: RegisterRequest) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        user.value = response.data.user;
        return response;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (err: unknown) {
      // FIX: Changed 'any' to 'unknown'
      if (err instanceof Error) {
        // FIX: Added type guard
        error.value = err.message;
      } else {
        error.value = 'An unexpected error occurred during registration.';
      }
      throw err; // Re-throw the error for further handling if needed
    } finally {
      isLoading.value = false;
    }
  }

  // 登录
  async function login(data: LoginRequest) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        user.value = response.data.user;
        return response;
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (err: unknown) {
      // FIX: Changed 'any' to 'unknown'
      if (err instanceof Error) {
        // FIX: Added type guard
        error.value = err.message;
      } else {
        error.value = 'An unexpected error occurred during login.';
      }
      throw err; // Re-throw the error for further handling if needed
    } finally {
      isLoading.value = false;
    }
  }

  // 退出登录
  function logout() {
    authService.logout();
    user.value = null;
    error.value = null;
  }

  // 清除错误
  function clearError() {
    error.value = null;
  }

  // 初始化认证状态
  initializeAuth();

  return {
    // 状态
    user,
    isLoading,
    error,

    // 计算属性
    isAuthenticated,
    displayName,

    // 方法
    register,
    login,
    logout,
    clearError,
    initializeAuth,
    // FIX: 暴露 getToken 方法，使其可以通过 authStore.getToken() 访问
    getToken: () => authService.getToken(),
  };
});
