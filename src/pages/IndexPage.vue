<template>
  <q-page class="row no-wrap">
    <!-- 左侧文档列表 -->
    <document-sidebar class="col-3" />

    <!-- 中间知识卡片区域 -->
    <q-page-container class="col-6 q-pa-md scroll-y">
      <div class="q-gutter-md">
        <template v-if="knowledgeStore.isLoading">
          <q-card v-for="n in 3" :key="n" class="q-pa-md rounded-borders bg-grey-9">
            <q-item>
              <q-item-section avatar>
                <q-skeleton type="QAvatar" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  <q-skeleton type="text" width="80%" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton type="text" width="50%" />
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-skeleton type="text" class="q-mt-sm" />
            <q-skeleton type="text" width="70%" />
          </q-card>
        </template>
        <template v-else-if="knowledgeStore.elements.length > 0">
          <knowledge-card
            v-for="element in knowledgeStore.elements"
            :key="element.id"
            :element="element"
            draggable="true"
            @dragstart="onDragStart(element)"
            @dragend="onDragEnd"
          />
        </template>
        <template v-else>
          <q-card class="q-pa-md text-center bg-grey-9 text-grey-5">
            <q-card-section>
              <q-icon name="info" size="xl" class="q-mb-md" />
              <div class="text-h6">请选择左侧文档以生成知识卡片</div>
              <div class="text-body2">
                文档处理完成后，AI将为您自动提取知识点、生成习题和记忆卡片。
              </div>
            </q-card-section>
          </q-card>
        </template>
      </div>
    </q-page-container>

    <!-- 右侧复习笔记区域 -->
    <q-page-container class="col-3 q-pa-md bg-grey-10 scroll-y" @dragover.prevent @drop="onDrop">
      <div class="text-h6 q-mb-md text-white">我的复习笔记</div>
      <q-list class="q-gutter-md">
        <knowledge-card
          v-for="element in knowledgeStore.reviewElements"
          :key="element.id"
          :element="element"
          :is-in-review="true"
          @remove="removeReviewElement(element.id)"
        />
        <q-card
          v-if="knowledgeStore.reviewElements.length === 0"
          class="q-pa-md text-center bg-grey-9 text-grey-5"
        >
          <q-card-section>
            <q-icon name="note_add" size="xl" class="q-mb-md" />
            <div class="text-h6">拖拽知识卡片到这里</div>
            <div class="text-body2">创建您的专属复习笔记。</div>
          </q-card-section>
        </q-card>
      </q-list>
    </q-page-container>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DocumentSidebar from 'src/components/DocumentSidebar.vue';
import KnowledgeCard from 'src/components/KnowledgeCard.vue';
import type { KnowledgeElement } from 'src/stores/knowledge-store';
import { useKnowledgeStore } from 'src/stores/knowledge-store';

const knowledgeStore = useKnowledgeStore();

const draggedElement = ref<KnowledgeElement | null>(null);

const onDragStart = (element: KnowledgeElement) => {
  draggedElement.value = element;
};

const onDragEnd = () => {
  draggedElement.value = null;
};

const onDrop = () => {
  if (draggedElement.value) {
    knowledgeStore.addReviewElement(draggedElement.value);
  }
};

const removeReviewElement = (id: string) => {
  knowledgeStore.removeReviewElement(id);
};
</script>

<style scoped>
.scroll-y {
  overflow-y: auto;
}
</style>
