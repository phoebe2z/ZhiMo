<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-10 text-white">
    <q-header elevated class="bg-grey-9 q-py-xs">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="font-tech">
          <q-icon name="auto_stories" class="q-mr-sm" />
          知墨 ZhiMo
        </q-toolbar-title>
        <q-btn flat round dense icon="export_notes" to="/print-preview">
          <q-tooltip class="bg-primary">智能打印预览</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-10">
      <DocumentSidebar />
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocumentSidebar from 'src/components/DocumentSidebar.vue';

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
