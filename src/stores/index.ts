// src/stores/index.ts
import { createPinia } from 'pinia';

// 创建一个 Pinia 实例
const pinia = createPinia();

// 导出该实例，以便在应用入口和 store 文件中使用
export default pinia;
