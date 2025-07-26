<!-- src/pages/IndexPage.vue -->
<template>
  <q-page class="row no-wrap">
    <!-- 左侧: AI分析成果 -->
    <div class="col-12 col-md-6 q-pa-md column">
      <div class="text-h5 text-cyan-3 q-mb-md font-tech">
        <q-icon name="smart_toy" /> AI 分析成果
        <span
          v-if="docStore.currentDocument"
          class="text-body1 text-grey-5 q-ml-sm ellipsis"
          style="max-width: 300px"
        >
          / {{ docStore.currentDocument.name }}
        </span>
      </div>
      <q-scroll-area class="col" v-if="docStore.currentDocument">
        <div v-if="knowledgeStore.isLoading" class="flex flex-center q-mt-xl column">
          <q-spinner-cube color="cyan" size="5.5em" />
          <div class="q-mt-md text-grey">AI助教正在努力分析中...</div>
        </div>
        <!-- --- FIX START: 中栏 draggable 保持不变，但我们将使用它的 @end 事件 --- -->
        <draggable
          :list="knowledgeStore.elements"
          class="q-gutter-md"
          item-key="id"
          :group="{ name: 'knowledge', pull: 'clone', put: false }"
          :sort="false"
          ghost-class="ghost-card"
          drag-class="drag-card"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <KnowledgeCard
              :element="element"
              :is-in-review="knowledgeStore.reviewElementIds.has(element.id)"
            />
          </template>
        </draggable>
        <!-- --- FIX END --- -->
      </q-scroll-area>
      <div v-else class="flex flex-center text-h6 text-grey-7 full-height column">
        <q-icon name="arrow_back" size="lg" />
        <div class="q-mt-md">请从左侧选择一份文档开始</div>
      </div>
    </div>

    <!-- 分割线 -->
    <q-separator vertical dark />

    <!-- 右侧: 我的复习笔记 -->
    <div class="col-12 col-md q-pa-md column bg-grey-9">
      <div class="text-h5 text-amber-3 q-mb-md font-tech">
        <q-icon name="edit_note" /> 我的复习笔记
      </div>
      <q-scroll-area class="col">
        <!-- --- FIX START: 右栏 draggable 放弃 v-model，改用 :list --- -->
        <draggable
          :list="knowledgeStore.reviewElements"
          class="q-gutter-md full-height"
          item-key="id"
          group="knowledge"
          ghost-class="ghost-card"
        >
          <template #item="{ element }">
            <KnowledgeCard :element="element" is-in-review @remove="removeElement(element.id)" />
          </template>
        </draggable>
        <!-- --- FIX END --- -->
        <div
          v-if="knowledgeStore.reviewElements.length === 0"
          class="flex flex-center text-grey-7 full-height column"
        >
          <q-icon name="ads_click" size="lg" />
          <div class="q-mt-md">从左侧拖拽知识卡片到这里</div>
        </div>
      </q-scroll-area>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useDocumentStore } from 'src/stores/document-store';
import { useKnowledgeStore } from 'src/stores/knowledge-store';
import KnowledgeCard from 'src/components/KnowledgeCard.vue';
import draggable from 'vuedraggable';

const docStore = useDocumentStore();
const knowledgeStore = useKnowledgeStore();

// --- FIX START: 全新的、手动控制的拖拽逻辑 ---
/**
 * 当拖拽操作结束时（无论成功与否）触发
 * @param {object} evt - vuedraggable 提供的事件对象
 */
function onDragEnd(evt: {
  originalEvent: DragEvent;
  item: HTMLElement;
  to: HTMLElement;
  from: HTMLElement;
  oldIndex?: number;
}) {
  // `from` 是拖拽起始的列表，`to` 是拖拽结束的目标列表
  // 如果起始和目标列表是同一个，说明只是在原地晃了一下，不做任何事
  if (evt.from === evt.to) {
    return;
  }

  // 从事件对象中获取被拖拽的原始数据
  // 我们需要从原始数组 `knowledgeStore.elements` 中找到它
  if (typeof evt.oldIndex !== 'undefined') {
    const draggedItem = knowledgeStore.elements[evt.oldIndex];

    // 如果找到了被拖拽的卡片，并且它尚未在复习笔记中
    if (draggedItem && !knowledgeStore.reviewElementIds.has(draggedItem.id)) {
      // 我们手动地、明确地将它添加到复习笔记数组中
      knowledgeStore.reviewElements.push(draggedItem);
    }
  }
}
// --- FIX END ---

function removeElement(elementId: string) {
  knowledgeStore.reviewElements = knowledgeStore.reviewElements.filter((e) => e.id !== elementId);
}
</script>

<style lang="scss">
/* 样式保持不变 */
.ghost-card {
  opacity: 0.5;
  background: #2d3748;
  border: 2px dashed #4a5568;
}
.drag-card {
  transform: scale(1.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  cursor: grabbing !important;
}
.sortable-chosen {
  opacity: 0.4 !important;
  background: #1a202c;
}
</style>
