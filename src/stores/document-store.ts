// src/stores/document-store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Document, DocumentQueryParams } from 'src/services/documents';
import { documentService } from 'src/services/documents';
import { AxiosError } from 'axios'; // FIX: 导入 AxiosError 用于类型守卫

export type { Document } from 'src/services/documents';

export const useDocumentStore = defineStore('document', () => {
  // 状态
  const documents = ref<Document[]>([]);
  const selectedDocument = ref<Document | null>(null);
  const isLoading = ref(false);
  const isUploading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const completedDocuments = computed(() =>
    documents.value.filter((doc) => doc.processingStatus === 'completed'),
  );

  const processingDocuments = computed(() =>
    documents.value.filter(
      (doc) => doc.processingStatus === 'processing' || doc.processingStatus === 'pending',
    ),
  );

  const failedDocuments = computed(() =>
    documents.value.filter((doc) => doc.processingStatus === 'failed'),
  );

  // 获取文档列表
  async function fetchDocuments(params?: DocumentQueryParams) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await documentService.getDocuments(params);

      if (response.success && response.data) {
        documents.value = response.data;
      } else {
        // documentService.getDocuments 已经会抛出带有 message 的 Error
        // 如果它返回 success:false，这意味着 API 本身返回了一个错误响应
        // 然后被封装到 ApiResponse 中。所以，我们重新抛出其 message。
        throw new Error(response.message || '获取文档列表失败');
      }
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '获取文档列表失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      console.error('获取文档列表失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  // 上传文档
  async function uploadDocument(file: File, title: string, tags?: string[]) {
    isUploading.value = true;
    error.value = null;

    try {
      const response = await documentService.uploadDocument(file, title, tags);

      if (response.success && response.data) {
        const newDocument = response.data.document;

        // 添加到文档列表
        documents.value.unshift(newDocument);

        // 开始轮询处理状态
        void pollDocumentProcessing(newDocument._id); // FIX: 使用 void 明确表示不处理 Promise 返回值
        return response;
      } else {
        // documentService.uploadDocument 已经会抛出带有 message 的 Error
        throw new Error(response.message || '文档上传失败');
      }
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '文档上传失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      throw new Error(errorMessage); // 重新抛出带处理信息的错误
    } finally {
      isUploading.value = false;
    }
  }

  // 轮询文档处理状态
  async function pollDocumentProcessing(documentId: string) {
    try {
      const updatedDocument = await documentService.pollDocumentStatus(documentId);

      // 更新文档列表中的对应文档
      const index = documents.value.findIndex((doc) => doc._id === documentId);
      if (index !== -1) {
        documents.value[index] = updatedDocument;
      }

      // 如果当前选中的是这个文档，也要更新
      if (selectedDocument.value?._id === documentId) {
        selectedDocument.value = updatedDocument;
      }

      return updatedDocument;
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '轮询文档处理状态失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error('轮询文档处理状态失败:', err);
      error.value = errorMessage;
    }
  }

  // 选择文档
  async function selectDocument(documentId: string) {
    if (selectedDocument.value?._id === documentId) {
      return selectedDocument.value;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await documentService.getDocumentById(documentId);

      if (response.success && response.data) {
        selectedDocument.value = response.data;
        return response.data;
      } else {
        throw new Error(response.message || '获取文档详情失败');
      }
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '选择文档失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      console.error('选择文档失败:', err);
      throw new Error(errorMessage); // 重新抛出带处理信息的错误
    } finally {
      isLoading.value = false;
    }
  }

  // 更新文档
  async function updateDocument(documentId: string, data: { title?: string; tags?: string[] }) {
    try {
      const response = await documentService.updateDocument(documentId, data);

      if (response.success && response.data) {
        const updatedDocument = response.data;

        // 更新文档列表
        const index = documents.value.findIndex((doc) => doc._id === documentId);
        if (index !== -1) {
          documents.value[index] = updatedDocument;
        }

        // 更新选中文档
        if (selectedDocument.value?._id === documentId) {
          selectedDocument.value = updatedDocument;
        }

        return updatedDocument;
      } else {
        throw new Error(response.message || '更新文档失败');
      }
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '更新文档失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      throw new Error(errorMessage); // 重新抛出带处理信息的错误
    }
  }

  // 删除文档
  async function deleteDocument(documentId: string) {
    try {
      const response = await documentService.deleteDocument(documentId);

      if (response.success) {
        // 从文档列表中移除
        documents.value = documents.value.filter((doc) => doc._id !== documentId);

        // 如果删除的是当前选中文档，清空选中状态
        if (selectedDocument.value?._id === documentId) {
          selectedDocument.value = null;
        }

        return response;
      } else {
        throw new Error(response.message || '删除文档失败');
      }
    } catch (err: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '删除文档失败';
      if (err instanceof AxiosError && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      error.value = errorMessage;
      throw new Error(errorMessage); // 重新抛出带处理信息的错误
    }
  }

  // 清空选中文档
  function clearSelectedDocument() {
    selectedDocument.value = null;
  }

  // 清除错误
  function clearError() {
    error.value = null;
  }

  return {
    // 状态
    documents,
    selectedDocument,
    isLoading,
    isUploading,
    error,

    // 计算属性
    completedDocuments,
    processingDocuments,
    failedDocuments,

    // 方法
    fetchDocuments,
    uploadDocument,
    selectDocument,
    updateDocument,
    deleteDocument,
    pollDocumentProcessing,
    clearSelectedDocument,
    clearError,
  };
});
