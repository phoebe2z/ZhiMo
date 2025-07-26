// src/stores/knowledge-store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// --- FIX: 导出 (export) 所有需要被外部使用的类型 ---
export interface PointsContent {
  title: string;
  text: string;
  mindmap?: string;
}

export interface QaContent {
  title: string;
  question: string;
  answer: string;
  analysis?: string;
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
// --- END FIX ---

const mockKnowledgeElements: KnowledgeElement[] = [
  {
    id: 'ke-1',
    type: 'points',
    content: {
      title: '经济学的十大原理',
      text: '经济学原理是理解所有经济分析的基础...\n1. 人们面临权衡取舍\n2. 某种东西的成本是为了得到它所放弃的东西（机会成本）\n...',
      mindmap: `
mindmap
  root((经济学原理))
    原理一: 权衡取舍
    原理二: 机会成本
    原理三: 边际思考
      边际成本
      边际收益
    原理四: 激励反应
      `,
    },
  },
  {
    id: 'ke-2',
    type: 'qa',
    content: {
      title: '自测题：需求曲线',
      question: '为什么需求曲线通常向右下方倾斜？',
      answer: '因为价格和需求量之间存在负相关关系。',
      analysis: '这主要由两大效应决定：\n1. **替代效应**\n2. **收入效应**',
    },
  },
  {
    id: 'ke-3',
    type: 'deck',
    content: {
      title: '关键术语记忆卡',
      cards: [
        { term: '看不见的手', definition: '亚当·斯密提出的概念...' },
        { term: '通货膨胀', definition: '指物价水平持续、普遍地上涨...' },
        { term: '微观经济学', definition: '研究家庭和企业如何做出决策...' },
        { term: '宏观经济学', definition: '研究整体经济现象...' },
      ],
    },
  },
];

const fakeKnowledgeApi = {
  async getElements(docId: string): Promise<KnowledgeElement[]> {
    console.log(`Fetching knowledge elements for doc: ${docId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return JSON.parse(JSON.stringify(mockKnowledgeElements));
  },
};

export const useKnowledgeStore = defineStore('knowledge', () => {
  const elements = ref<KnowledgeElement[]>([]);
  const isLoading = ref(false);
  const reviewElements = ref<KnowledgeElement[]>([]);

  async function fetchElementsForDocument(docId: string) {
    isLoading.value = true;
    elements.value = [];
    try {
      elements.value = await fakeKnowledgeApi.getElements(docId);
    } catch (error) {
      console.error('Failed to fetch knowledge elements:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function clearElements() {
    elements.value = [];
  }

  const reviewElementIds = computed(() => new Set(reviewElements.value.map((e) => e.id)));

  return {
    elements,
    isLoading,
    reviewElements,
    reviewElementIds,
    fetchElementsForDocument,
    clearElements,
  };
});
