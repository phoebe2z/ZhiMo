<template>
  <div
    class="knowledge-card q-pa-md rounded-borders hover-lift"
    :class="[cardColor, { 'in-review': isInReview }]"
  >
    <div class="row items-center justify-between no-wrap">
      <div class="text-subtitle1 font-weight-bold row items-center no-wrap overflow-hidden">
        <q-icon :name="cardIcon" class="q-mr-sm" />
        <span class="ellipsis">{{ element.content.title }}</span>
      </div>
      <div class="q-gutter-xs">
        <q-btn flat round dense icon="fullscreen" size="sm" @click.stop="showFullscreen = true">
          <q-tooltip>全屏查看</q-tooltip>
        </q-btn>
        <q-btn
          v-if="isInReview"
          flat
          round
          dense
          icon="close"
          size="sm"
          @click.stop="$emit('remove')"
        >
          <q-tooltip>从笔记中移除</q-tooltip>
        </q-btn>
      </div>
    </div>
    <q-separator dark class="q-my-sm" />

    <div class="card-content-preview">
      <div v-if="element.type === 'points'" class="text-grey-4">
        {{ previewText((element.content as PointsContent).text) }}
      </div>
      <div v-if="element.type === 'qa'" class="text-grey-4">
        【题目】{{ previewText((element.content as QaContent).question) }}
      </div>
      <div v-if="element.type === 'deck'" class="row items-center q-gutter-sm">
        <q-icon name="style" size="lg" />
        <div>
          <div>{{ (element.content as DeckContent).cards.length }} 张记忆卡片</div>
          <div class="text-caption text-grey-5">点击全屏开始学习</div>
        </div>
      </div>
    </div>

    <q-dialog
      v-model="showFullscreen"
      persistent
      seamless
      position="bottom"
      full-width
      @show="onDialogShow"
      @hide="onDialogHide"
    >
      <q-card :class="element.type === 'points' ? 'fullscreen-card-light' : 'fullscreen-card-dark'">
        <q-bar :class="element.type === 'points' ? 'bg-grey-3 text-black' : ''">
          <q-icon :name="cardIcon" />
          <div>{{ element.content.title }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>关闭</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="scroll">
          <div v-if="element.type === 'points'" class="q-pa-md">
            <pre class="text-body1 full-width-pre">{{
              (element.content as PointsContent).text
            }}</pre>
            <q-separator class="q-my-lg" />
            <div class="text-h6 q-mb-md">思维导图</div>
            <div
              v-if="(element.content as PointsContent).mindmap"
              ref="mermaidContainer"
              class="mermaid-container"
            >
              {{ (element.content as PointsContent).mindmap }}
            </div>
            <div v-else class="text-grey-7">暂无思维导图</div>
          </div>

          <div v-if="element.type === 'qa'" class="flex flex-center" style="height: 80vh">
            <div
              class="qa-flipper"
              :class="{ 'is-flipped': isFlipped }"
              @click="isFlipped = !isFlipped"
            >
              <div class="flip-card-inner">
                <div class="flip-card-front flex flex-center text-center q-pa-lg">
                  <div>
                    <div class="text-overline">题目</div>
                    <div class="text-h5">{{ (element.content as QaContent).question }}</div>
                  </div>
                </div>
                <div class="flip-card-back q-pa-lg scroll">
                  <div class="text-overline">答案</div>
                  <div class="text-h6 text-green-4 q-mb-md">
                    {{ (element.content as QaContent).answer }}
                  </div>
                  <template v-if="(element.content as QaContent).analysis">
                    <q-separator dark spaced />
                    <div class="text-overline">解析</div>
                    <pre class="text-body2 full-width-pre">{{
                      (element.content as QaContent).analysis
                    }}</pre>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="element.type === 'deck' && (element.content as DeckContent).cards.length > 0"
            class="flex flex-center column no-wrap"
            style="height: 80vh"
          >
            <div
              class="deck-flipper"
              :class="{ 'is-flipped': isFlipped }"
              @click="isFlipped = !isFlipped"
            >
              <div class="flip-card-inner" v-if="currentCard">
                <div class="flip-card-front flex flex-center text-center q-pa-lg">
                  <div class="text-h4">{{ currentCard.term }}</div>
                </div>
                <div class="flip-card-back flex flex-center text-center q-pa-lg">
                  <div class="text-h6">{{ currentCard.definition }}</div>
                </div>
              </div>
            </div>
            <div class="row items-center q-mt-md" style="width: 80%; max-width: 600px">
              <q-btn
                @click.stop="prevCard"
                :disable="currentCardIndex === 0"
                round
                flat
                icon="arrow_back_ios"
              />
              <q-space />
              <div class="text-subtitle1 text-grey-5">
                {{ currentCardIndex + 1 }} / {{ (element.content as DeckContent).cards.length }}
              </div>
              <q-space />
              <q-btn
                @click.stop="nextCard"
                :disable="currentCardIndex === (element.content as DeckContent).cards.length - 1"
                round
                flat
                icon="arrow_forward_ios"
              />
            </div>
          </div>
          <div v-else-if="element.type === 'deck'" class="flex flex-center" style="height: 80vh">
            <div class="text-h6 text-grey-5">暂无记忆卡片</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { PropType } from 'vue';
import type { KnowledgeElement } from 'src/stores/knowledge-store'; // Ensure this path is correct
import mermaid from 'mermaid';

// Define the content types more precisely if they are not directly from `src/stores/knowledge-store`
// It is recommended that your `KnowledgeElement` type in `src/stores/knowledge-store.ts` is a discriminated union.
// Example:
// export type KnowledgeElement = {
//   id: string;
//   type: 'points';
//   content: PointsContent;
// } | {
//   id: string;
//   type: 'qa';
//   content: QaContent;
// } | {
//   id: string;
//   type: 'deck';
//   content: DeckContent;
// };
// If it is, these local interfaces can be removed.
interface PointsContent {
  title: string;
  text: string;
  mindmap?: string;
}

interface QaContent {
  title: string;
  question: string;
  answer: string;
  analysis?: string;
}

interface DeckContent {
  title: string;
  cards: { term: string; definition: string }[];
}

const props = defineProps({
  element: { type: Object as PropType<KnowledgeElement>, required: true },
  isInReview: { type: Boolean, default: false },
});
defineEmits(['remove']);

const showFullscreen = ref(false);
const isFlipped = ref(false);
const currentCardIndex = ref(0);
const mermaidContainer = ref<HTMLElement | null>(null);

const currentCard = computed(() => {
  if (props.element.type === 'deck') {
    const content = props.element.content as DeckContent;
    return content.cards[currentCardIndex.value];
  }
  return undefined;
});

// --- Mermaid.js 初始化 ---
mermaid.initialize({
  startOnLoad: false,
  theme: 'forest', // 一个好看的深色主题
  securityLevel: 'loose',
  fontFamily: 'sans-serif',
});

const onDialogShow = async () => {
  // 等待DOM更新完成
  await nextTick();
  if (props.element.type === 'points' && mermaidContainer.value) {
    // CRUCIAL CHANGE: Use a local variable to narrow type
    const pointsContent = props.element.content as PointsContent;
    if (pointsContent.mindmap) {
      try {
        // 渲染思维导图
        const { svg } = await mermaid.render(
          `mermaid-${props.element.id}`,
          pointsContent.mindmap, // Use the narrowed type
        );
        mermaidContainer.value.innerHTML = svg;
      } catch (e) {
        mermaidContainer.value.innerHTML = '思维导图渲染失败';
        console.error(e);
      }
    }
  }
};

const onDialogHide = () => {
  // 关闭弹窗时重置所有状态
  isFlipped.value = false;
  currentCardIndex.value = 0;
  if (mermaidContainer.value) {
    mermaidContainer.value.innerHTML = ''; // 清空，防止下次打开时闪烁
  }
};

watch(currentCardIndex, () => {
  isFlipped.value = false; // 切换记忆卡片时，自动翻回正面
});

const cardMeta = computed(() => {
  switch (props.element.type) {
    case 'points':
      return { icon: 'article', color: 'bg-blue-grey-8' };
    case 'qa':
      return { icon: 'quiz', color: 'bg-indigo-8' };
    case 'deck':
      return { icon: 'style', color: 'bg-deep-purple-8' };
    default:
      return { icon: 'notes', color: 'bg-grey-8' };
  }
});

const cardIcon = computed(() => cardMeta.value.icon);
const cardColor = computed(() => cardMeta.value.color);

const previewText = (text: string) => {
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
};

const prevCard = () => {
  if (props.element.type === 'deck' && currentCardIndex.value > 0) {
    currentCardIndex.value--;
  }
};
const nextCard = () => {
  if (
    props.element.type === 'deck' &&
    // CRUCIAL CHANGE: Added (props.element.content as DeckContent)
    currentCardIndex.value < (props.element.content as DeckContent).cards.length - 1
  ) {
    currentCardIndex.value++;
  }
};
</script>

<style lang="scss" scoped>
// --- 通用卡片样式 ---
.knowledge-card {
  cursor: grab;
  border-left: 4px solid;
  border-color: transparent;
  transition: all 0.3s ease;
  position: relative;
  &.bg-blue-grey-8 {
    border-color: #607d8b;
  }
  &.bg-indigo-8 {
    border-color: #3f51b5;
  }
  &.bg-deep-purple-8 {
    border-color: #673ab7;
  }
  &.in-review {
    box-shadow: 0 0 15px rgba(255, 193, 7, 0.3);
    border-color: #ffc107;
  }
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
.card-content-preview {
  max-height: 100px;
  overflow: hidden;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to bottom, transparent, #333);
  }
}

// --- 全屏弹窗通用样式 ---
.fullscreen-card-dark,
.fullscreen-card-light {
  height: 90vh;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.fullscreen-card-dark {
  background-color: #2a2a2a;
  color: white;
}
.fullscreen-card-light {
  background-color: #f5f5f5;
  color: black;
}
.full-width-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}

// --- 翻转卡片通用样式 ---
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s;
  transform-style: preserve-3d;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
.is-flipped .flip-card-inner {
  transform: rotateY(180deg);
}
.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

// --- 2. 题目卡片 (QA) 专属样式 ---
.qa-flipper {
  width: 90%;
  max-width: 700px;
  height: 450px;
  perspective: 1500px;
  cursor: pointer;
}
.qa-flipper .flip-card-front,
.qa-flipper .flip-card-back {
  background-color: #424242;
  border-radius: 12px;
}
.qa-flipper .flip-card-back {
  transform: rotateY(180deg);
}

// --- 3. 记忆卡片堆 (Deck) 专属样式 ---
.deck-flipper {
  width: 80%;
  max-width: 600px;
  height: 300px;
  perspective: 1000px;
  cursor: pointer;
}
.deck-flipper .flip-card-front,
.deck-flipper .flip-card-back {
  background-color: #555;
  border-radius: 12px;
}
.deck-flipper .flip-card-back {
  transform: rotateY(180deg);
  background-color: #388e3c;
}

// --- 思维导图容器样式 ---
.mermaid-container {
  width: 100%;
  text-align: center;
  // Mermaid.js 会生成SVG，我们可以用CSS来调整它的样式
  :deep(svg) {
    max-width: 100%;
    height: auto;
  }
}
</style>
