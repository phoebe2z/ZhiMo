// src/components/DocumentSidebar.vue
<template>
  <q-card class="document-sidebar column no-wrap">
    <q-card-section class="q-pb-sm">
      <div class="text-h6">我的文档</div>
    </q-card-section>

    <q-card-section class="q-pt-none q-pb-sm">
      <q-input outlined dense placeholder="搜索文档..." v-model="searchQuery">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </q-card-section>

    <q-card-section class="col q-pt-none scroll">
      <q-list separator>
        <q-item v-if="documentStore.isLoading" class="flex flex-center q-py-md">
          <q-spinner-dots color="primary" size="lg" />
        </q-item>
        <q-item v-else-if="documentStore.documents.length === 0">
          <q-item-section class="text-center text-grey-6"> 暂无文档，请上传。 </q-item-section>
        </q-item>
        <q-item
          v-for="doc in documentStore.documents"
          :key="doc._id"
          clickable
          v-ripple
          :active="documentStore.selectedDocument?._id === doc._id"
          active-class="bg-blue-1 text-blue-8"
          @click="selectDoc(doc._id)"
        >
          <q-item-section avatar>
            <q-icon
              :name="doc.processingStatus === 'completed' ? 'description' : 'hourglass_empty'"
              :color="doc.processingStatus === 'completed' ? 'green' : 'orange'"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ doc.title }}</q-item-label>
            <q-item-label caption
              >{{ doc.originalFormat }} - {{ doc.processingStatus }}</q-item-label
            >
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <q-uploader
        :factory-fn="uploadFactory"
        label="上传文档"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.html,.url,.png,.jpg,.jpeg"
        max-files="1"
        hide-upload-btn
        auto-upload
        :headers="[{ name: 'Authorization', value: `Bearer ${authStore.getToken()}` }]"
        @uploaded="onUploaded"
        @failed="onFailed"
        @added="onFileAdded"
        ref="uploaderRef"
      >
        <template v-slot:header="scope">
          <div class="row flex-center q-pa-sm q-gutter-xs">
            <q-btn
              v-if="(scope as any).queuedFiles.length > 0"
              icon="clear"
              @click="(scope as any).removeQueuedFiles"
              round
              dense
              flat
            >
              <q-tooltip>清除</q-tooltip>
            </q-btn>
            <q-btn
              v-if="(scope as any).uploadedFiles.length > 0"
              icon="done_all"
              @click="(scope as any).removeUploadedFiles"
              round
              dense
              flat
            >
              <q-tooltip>清除已上传</q-tooltip>
            </q-btn>
            <q-spinner v-if="(scope as any).isUploading" class="q-uploader__spinner" />
            <div class="col no-wrap q-pl-sm">
              <div class="row q-col-gutter-xs no-wrap">
                <div class="col-grow q-pt-xs">
                  <q-linear-progress
                    v-if="(scope as any).isUploading"
                    :value="(scope as any).uploadProgress"
                    color="primary"
                    track-color="grey-2"
                    rounded
                  />
                </div>
                <div class="col-auto q-uploader__total-size">
                  {{ (scope as any).uploadSizeLabel }}
                </div>
              </div>
            </div>
            <q-btn
              v-if="(scope as any).canAddFiles"
              icon="add_box"
              @click="(scope as any).pickFiles"
              round
              dense
              flat
            >
              <q-tooltip>选择文件</q-tooltip>
            </q-btn>
            <q-btn
              v-if="(scope as any).canUpload"
              icon="cloud_upload"
              @click="(scope as any).upload"
              round
              dense
              flat
            >
              <q-tooltip>上传文件</q-tooltip>
            </q-btn>
            <q-btn
              v-if="(scope as any).isUploading && (scope as any).canAbort"
              icon="pause"
              @click="(scope as any).abort"
              round
              dense
              flat
            >
              <q-tooltip>暂停上传</q-tooltip>
            </q-btn>
          </div>
        </template>
      </q-uploader>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { QUploaderFactoryObject, QUploader } from 'quasar';
import { useQuasar } from 'quasar';
import { useDocumentStore } from 'src/stores/document-store';
import { useKnowledgeStore } from 'src/stores/knowledge-store';
import { useAuthStore } from 'src/stores/auth-store';

const $q = useQuasar();
const documentStore = useDocumentStore();
const knowledgeStore = useKnowledgeStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const uploaderRef = ref<QUploader | null>(null);

onMounted(async () => {
  await documentStore.fetchDocuments();
});

watch(searchQuery, (newVal) => {
  void documentStore.fetchDocuments({ search: newVal });
});

const selectDoc = async (docId: string) => {
  try {
    const selectedDoc = await documentStore.selectDocument(docId);
    if (selectedDoc) {
      if (selectedDoc.processingStatus === 'completed') {
        await knowledgeStore.fetchElementsForDocument(selectedDoc);
      } else {
        knowledgeStore.clearElements();
        $q.notify({
          type: 'info',
          message: `文档 [${selectedDoc.title}] 正在处理中，请稍候...`,
        });
      }
    }
  } catch (error: unknown) {
    // FIX: Changed 'any' to 'unknown'
    if (error instanceof Error) {
      // FIX: Added type guard
      $q.notify({
        type: 'negative',
        message: error.message || '选择文档失败',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: '选择文档失败: 发生未知错误',
      });
    }
  }
};

const uploadFactory = (_files: readonly File[]): Promise<QUploaderFactoryObject> => {
  return new Promise((resolve) => {
    resolve({
      url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/documents/upload`,
      method: 'POST',
    });
  });
};

const onFileAdded = (files: readonly File[]) => {
  if (files.length > 0) {
    const file = files[0];
    // FIX: Added 'file' undefined check
    if (!file) {
      console.error('No file found in onFileAdded.');
      return;
    }
    const _title = file.name.split('.').slice(0, -1).join('.');
  }
};

const onUploaded = (info: { files: readonly File[]; xhr: XMLHttpRequest }) => {
  const file = info.files[0];
  // FIX: Added 'file' undefined check
  if (!file) {
    console.error('No file found in uploaded info.');
    return;
  }
  const response = JSON.parse(info.xhr.responseText);

  if (response.success && response.data) {
    $q.notify({
      icon: 'done',
      color: 'positive',
      message: `${file.name} 上传成功，正在处理中...`,
    });
    void documentStore.fetchDocuments();
  } else {
    $q.notify({
      icon: 'error',
      color: 'negative',
      message: `上传失败: ${file.name}. ${response.message || ''}`,
    });
  }
  uploaderRef.value?.removeUploadedFiles();
  uploaderRef.value?.removeQueuedFiles();
};

const onFailed = (info: { files: readonly File[]; xhr: XMLHttpRequest }) => {
  const file = info.files[0];
  // FIX: Added 'file' undefined check
  if (!file) {
    console.error('No file found in failed info.');
    return;
  }
  let errorMessage = `上传失败: ${file.name}.`;
  try {
    const response = JSON.parse(info.xhr.responseText);
    errorMessage += ` ${response.message || ''}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    errorMessage += ' 服务器无响应或响应格式错误。';
  }

  $q.notify({
    icon: 'error',
    color: 'negative',
    message: errorMessage,
  });
  uploaderRef.value?.removeUploadedFiles();
  uploaderRef.value?.removeQueuedFiles();
};
</script>

<style lang="scss" scoped>
.document-sidebar {
  background-color: #2a2a2a;
  color: white;
  height: 100%;
  border-radius: 0;
}

.q-item--active {
  background-color: #1a1a1a !important;
  color: #42a5f5 !important;
}

.q-uploader {
  width: 100%;
}
</style>
