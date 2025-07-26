<template>
  <router-view />
</template>

<script setup lang="ts">
import { useDocumentStore } from 'src/stores/document-store';
import { useKnowledgeStore } from 'src/stores/knowledge-store';

// 这会确保在任何子组件加载之前，Pinia 已经被激活。
try {
  useDocumentStore();
  useKnowledgeStore();
} catch (e) {
  console.error('Failed to activate Pinia stores in App.vue. This might be normal during HMR.', e);
}
</script>
