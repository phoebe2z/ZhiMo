<template>
  <q-list dark separator padding>
    <q-item-label header class="text-grey-5 font-tech">
      <q-icon name="inventory_2" /> 原始资料架
    </q-item-label>

    <div class="q-pa-sm">
      <q-uploader
        dark
        flat
        bordered
        label="拖拽文件到此或点击上传"
        class="full-width bg-grey-9"
        :factory="uploadFactory"
        @uploaded="onUploaded"
        @failed="onFailed"
      >
        <template v-slot:header="scope">
          <div class="row no-wrap items-center q-pa-sm q-gutter-xs">
            <q-btn v-if="scope.canAddFiles" type="a" icon="add_box" round dense flat>
              <q-uploader-add-trigger />
              <q-tooltip>选择文件</q-tooltip>
            </q-btn>
            <div class="col">
              <div class="q-uploader__title">上传新资料</div>
            </div>
            <q-btn v-if="scope.isUploading" icon="clear" @click="scope.abort" round dense flat>
              <q-tooltip>取消上传</q-tooltip>
            </q-btn>
          </div>
        </template>
      </q-uploader>
    </div>

    <div v-if="docStore.isLoading" class="text-center q-py-lg">
      <q-spinner-grid color="primary" size="40px" />
    </div>

    <template v-if="docStore">
      <q-slide-item
        v-for="doc in docStore.documents"
        :key="doc.id"
        @left="(opt) => onAction(opt, 'archive', doc)"
        @right="(opt) => onAction(opt, 'delete', doc)"
        left-color="primary"
        right-color="negative"
      >
        <template #left><q-icon name="archive" /> 归档</template>
        <template #right><q-icon name="delete" /> 删除</template>

        <q-item
          clickable
          v-ripple
          :active="docStore.currentDocument?.id === doc.id"
          @click="selectDoc(doc)"
          active-class="bg-teal-10"
        >
          <q-item-section avatar>
            <q-icon :name="iconMap[doc.type] || 'article'" />
          </q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ doc.name }}</q-item-label>
            <q-item-label caption>
              <q-spinner-gears
                v-if="doc.status === '分析中'"
                color="amber"
                size="1.2em"
                class="q-mr-xs"
              />
              <q-icon
                v-else-if="doc.status === '已完成'"
                name="check_circle"
                color="green"
                class="q-mr-xs"
              />
              <q-icon v-else name="hourglass_empty" color="grey" class="q-mr-xs" />
              {{ doc.status }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useDocumentStore } from 'src/stores/document-store';
import { useKnowledgeStore } from 'src/stores/knowledge-store';
import type { QUploaderFactoryObject } from 'quasar';
import type { Document } from 'src/stores/document-store';

interface UploaderInfo {
  files: readonly File[];
  xhr: XMLHttpRequest;
}

// 使用最标准的 <script setup> 写法
const $q = useQuasar();
const docStore = useDocumentStore();
const knowledgeStore = useKnowledgeStore();

onMounted(() => {
  if (docStore.documents.length === 0) {
    void docStore.fetchDocuments();
  }
});

const iconMap: Record<string, string> = {
  pdf: 'picture_as_pdf',
  ppt: 'slideshow',
  image: 'image',
  word: 'article',
  web: 'public',
};

const selectDoc = (doc: Document) => {
  if (docStore.currentDocument?.id === doc.id) {
    docStore.selectDocument(null);
    knowledgeStore.clearElements();
    return;
  }

  if (doc.status !== '已完成') {
    $q.notify({
      message: '该文档正在分析或等待处理，暂无法查看成果。',
      icon: 'hourglass_top',
      color: 'orange',
    });
    return;
  }
  docStore.selectDocument(doc);
  void knowledgeStore.fetchElementsForDocument(doc.id);
};

const uploadFactory = (_: readonly File[]): Promise<QUploaderFactoryObject> => {
  return new Promise((resolve) => {
    resolve({
      url: 'http://localhost:4444/upload',
      method: 'POST',
      fieldName: 'file',
    });
  });
};

const onUploaded = (info: UploaderInfo) => {
  const fileName = info.files[0]?.name || '未知文件';

  $q.notify({
    icon: 'done',
    color: 'positive',
    message: `${fileName} 上传成功，等待服务器分析...`,
  });
  setTimeout(() => {
    void docStore.fetchDocuments();
  }, 2000);
};

const onFailed = (info: UploaderInfo) => {
  const fileName = info.files[0]?.name || '未知文件';

  $q.notify({
    icon: 'error',
    color: 'negative',
    message: `上传失败: ${fileName}`,
  });
};

const onAction = (
  { reset }: { reset: () => void },
  action: 'archive' | 'delete',
  doc: Document,
) => {
  $q.notify({
    message: `你确定要${action === 'archive' ? '归档' : '删除'} "${doc.name}" 吗?`,
    color: action === 'archive' ? 'primary' : 'negative',
    icon: 'warning',
    actions: [
      {
        label: '确定',
        color: 'white',
        handler: () => {
          console.log(`${action} ${doc.id}`);
        },
      },
      { label: '取消', color: 'white', handler: () => {} },
    ],
  });
  reset();
};
</script>
