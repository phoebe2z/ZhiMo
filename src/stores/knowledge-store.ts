// src/stores/knowledge-store.ts (更新版本)

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { aiService } from 'src/services/ai';
import type { Document } from 'src/services/documents';
import { AxiosError } from 'axios';

// 导入KnowledgeElement相关的类型定义，确保与services/ai.ts中的AI响应类型兼容
// 这些类型应该与KnowledgeCard.vue中使用的类型保持一致

export interface PointsContent {
  title: string;
  text: string;
  mindmap?: string;
}

export interface QaContent {
  title: string;
  question: string;
  answer: string;
  analysis: string | undefined; // 已在上次修复中明确为 string | undefined
}

export interface DeckContent {
  title: string;
  cards: { term: string; definition: string }[];
}

export type KnowledgeElementType = 'points' | 'qa' | 'deck';

export interface KnowledgeElement {
  id: string;
  type: KnowledgeElementType;
  content: PointsContent | QaContent | DeckContent;
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  const elements = ref<KnowledgeElement[]>([]);
  const isLoading = ref(false);
  const reviewElements = ref<KnowledgeElement[]>([]);
  const error = ref<string | null>(null);

  const reviewElementIds = computed(() => new Set(reviewElements.value.map((e) => e.id)));

  // 根据文档ID从后端获取并生成知识卡片
  async function fetchElementsForDocument(document: Document) {
    isLoading.value = true;
    elements.value = [];
    error.value = null;

    try {
      const batchResponse = await aiService.batchProcess(document._id, {
        includeSummary: true,
        includeExercises: true,
        includeConcepts: true,
        includeMindMap: true,
        language: 'zh',
      });

      if (batchResponse.success && batchResponse.data) {
        const newElements: KnowledgeElement[] = [];

        if (batchResponse.data.summary) {
          const summaryContent = batchResponse.data.summary;
          newElements.push({
            id: `summary-${document._id}`,
            type: 'points',
            content: {
              title: `${document.title} - 摘要`,
              text: summaryContent.summary,
            },
          });
        }

        if (batchResponse.data.mindMap) {
          const mindmapContent = batchResponse.data.mindMap;
          const existingSummaryCard = newElements.find((el) => el.id === `summary-${document._id}`);
          if (existingSummaryCard && existingSummaryCard.type === 'points') {
            (existingSummaryCard.content as PointsContent).mindmap = mindmapContent.mindMap;
          } else {
            newElements.push({
              id: `mindmap-${document._id}`,
              type: 'points',
              content: {
                title: `${document.title} - 思维导图`,
                text: '文档的思维导图内容。',
                mindmap: mindmapContent.mindMap,
              },
            });
          }
        }

        if (batchResponse.data.exercises) {
          const exercisesContent = batchResponse.data.exercises;
          exercisesContent.exercises.forEach((exercise, index) => {
            newElements.push({
              id: `exercise-${document._id}-${index}`,
              type: 'qa',
              content: {
                title: `练习题 ${index + 1}`,
                question: exercise.question,
                answer: exercise.correctAnswer,
                analysis: exercise.explanation,
              },
            });
          });
        }

        if (batchResponse.data.concepts) {
          const conceptsContent = batchResponse.data.concepts;
          if (conceptsContent.concepts.length > 0) {
            newElements.push({
              id: `concepts-${document._id}`,
              type: 'deck',
              content: {
                title: `${document.title} - 核心概念`,
                cards: conceptsContent.concepts.map((concept) => ({
                  term: concept.term,
                  definition: concept.definition,
                })),
              },
            });
          }
        }

        elements.value = newElements;
      } else {
        throw new Error(batchResponse.message || '获取AI处理结果失败');
      }
    } catch (err: unknown) {
      let errorMessage = '获取知识卡片失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      console.error('获取知识卡片失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  function clearElements() {
    elements.value = [];
  }

  // FIX: 添加 addReviewElement 函数
  function addReviewElement(element: KnowledgeElement) {
    // 检查元素是否已存在于复习列表中，避免重复添加
    if (!reviewElementIds.value.has(element.id)) {
      reviewElements.value.push(element);
    }
  }

  // FIX: 添加 removeReviewElement 函数
  function removeReviewElement(id: string) {
    reviewElements.value = reviewElements.value.filter((e) => e.id !== id);
  }

  return {
    elements,
    isLoading,
    reviewElements,
    error,
    reviewElementIds,
    fetchElementsForDocument,
    clearElements,
    // FIX: 暴露新添加的函数
    addReviewElement,
    removeReviewElement,
  };
});
