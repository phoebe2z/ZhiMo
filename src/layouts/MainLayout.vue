<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="auto_stories" class="q-mr-sm" />
          知墨 (ZhiMo)
        </q-toolbar-title>

        <q-space />

        <div v-if="authStore.isAuthenticated">
          <q-btn flat round dense icon="person" class="q-mr-xs">
            <q-tooltip>当前用户</q-tooltip>
          </q-btn>
          <span>{{ authStore.displayName }}</span>
          <q-btn flat round dense icon="logout" class="q-ml-md" @click="authStore.logout()">
            <q-tooltip>退出登录</q-tooltip>
          </q-btn>
        </div>
        <div v-else>
          <q-btn flat label="登录" @click="showAuthDialog = true" />
          <q-btn flat label="注册" @click="showAuthDialog = true" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="showAuthDialog" persistent>
      <q-card style="width: 400px; max-width: 80vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ isLoginMode ? '用户登录' : '用户注册' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleAuth" class="q-gutter-md">
            <q-input
              filled
              v-model="authForm.username"
              label="用户名 *"
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || '请输入用户名']"
            />

            <q-input
              v-if="!isLoginMode"
              filled
              v-model="authForm.email"
              label="邮箱 *"
              type="email"
              lazy-rules
              :rules="[(val) => (val && val.length > 0 && val.includes('@')) || '请输入有效邮箱']"
            />

            <q-input
              filled
              v-model="authForm.password"
              label="密码 *"
              type="password"
              lazy-rules
              :rules="[(val) => (val && val.length >= 6) || '密码至少6位']"
            />

            <q-input v-if="!isLoginMode" filled v-model="authForm.displayName" label="显示名称" />

            <div class="text-negative" v-if="authStore.error">{{ authStore.error }}</div>

            <div>
              <q-btn label="提交" type="submit" color="primary" :loading="authStore.isLoading" />
              <q-btn
                :label="isLoginMode ? '注册新用户' : '已有账号？去登录'"
                flat
                class="q-ml-sm"
                @click="
                  isLoginMode = !isLoginMode;
                  authStore.clearError();
                "
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios'; // FIX: 导入 AxiosError 用于类型守卫

const authStore = useAuthStore();
const $q = useQuasar();

const showAuthDialog = ref(false);
const isLoginMode = ref(true); // true for login, false for register

const authForm = reactive({
  username: '',
  email: '',
  password: '',
  displayName: '',
});

// Watch for authentication status changes to close dialog
watch(
  () => authStore.isAuthenticated,
  (newVal) => {
    if (newVal) {
      showAuthDialog.value = false;
      $q.notify({
        type: 'positive',
        message: `欢迎回来，${authStore.displayName}！`,
      });
    }
  },
);

const handleAuth = async () => {
  try {
    if (isLoginMode.value) {
      await authStore.login({
        username: authForm.username,
        password: authForm.password,
      });
    } else {
      await authStore.register({
        username: authForm.username,
        email: authForm.email,
        password: authForm.password,
        profile: authForm.displayName ? { displayName: authForm.displayName } : undefined,
      });
    }
  } catch (err: unknown) {
    // FIX: 将 'error: any' 改为 'err: unknown'
    let errorMessage = '认证失败';
    if (err instanceof AxiosError && err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    // 错误由 store 处理并在模板中显示，但这里仍然记录更精确的错误信息
    console.error('Authentication failed:', errorMessage);
  }
};

// Clear form on dialog close or mode switch
watch(showAuthDialog, (newVal) => {
  if (!newVal) {
    resetForm();
  }
});
watch(isLoginMode, () => {
  resetForm();
});

const resetForm = () => {
  authForm.username = '';
  authForm.email = '';
  authForm.password = '';
  authForm.displayName = '';
  authStore.clearError();
};
</script>

<style scoped>
.q-header {
  background: linear-gradient(to right, #1a1a1a, #333333);
}
</style>
