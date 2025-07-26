// src/services/documents.ts

import type { ApiResponse } from './api';
import { api } from './api';
import { AxiosError } from 'axios'; // FIX: 导入 AxiosError 用于类型守卫

// 文档类型定义
export interface Document {
  _id: string;
  title: string;
  originalFormat: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  filePath: string;
  markdownContent?: string;
  restructuredContent?: string;
  metadata: {
    originalFileName: string;
    fileSize: number;
    mimeType: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// 文档上传响应
export interface DocumentUploadResponse {
  document: Document;
  processingStatus: string;
}

// 文档查询参数
export interface DocumentQueryParams {
  format?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// 文档更新请求
export interface DocumentUpdateRequest {
  title?: string;
  tags?: string[];
}

// 文档服务
export const documentService = {
  // 上传文档
  async uploadDocument(
    file: File,
    title: string,
    tags?: string[],
  ): Promise<ApiResponse<DocumentUploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title);

      if (tags && tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      const response = await api.upload<DocumentUploadResponse>('/documents/upload', formData);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '文档上传失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage); // 始终抛出标准的 Error 对象
    }
  },

  // 获取文档列表
  async getDocuments(params?: DocumentQueryParams): Promise<ApiResponse<Document[]>> {
    try {
      const response = await api.get<Document[]>('/documents', params);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '获取文档列表失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 获取文档详情
  async getDocumentById(documentId: string): Promise<ApiResponse<Document>> {
    try {
      const response = await api.get<Document>(`/documents/${documentId}`);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '获取文档详情失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 获取文档Markdown内容
  async getDocumentMarkdown(documentId: string): Promise<ApiResponse<{ markdown: string }>> {
    try {
      const response = await api.get<{ markdown: string }>(`/documents/${documentId}/markdown`);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '获取文档内容失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 更新文档
  async updateDocument(
    documentId: string,
    data: DocumentUpdateRequest,
  ): Promise<ApiResponse<Document>> {
    try {
      const response = await api.put<Document>(`/documents/${documentId}`, data);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '更新文档失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 删除文档
  async deleteDocument(documentId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.delete<{ message: string }>(`/documents/${documentId}`);
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '删除文档失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 轮询检查文档处理状态
  async pollDocumentStatus(
    documentId: string,
    maxAttempts: number = 30,
    interval: number = 2000,
  ): Promise<Document> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.getDocumentById(documentId);

        if (response.success && response.data) {
          const document = response.data;

          if (document.processingStatus === 'completed' || document.processingStatus === 'failed') {
            return document;
          }
        }

        // 等待指定时间后继续轮询
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error: unknown) {
        // FIX: 将 'error' 改为 'error: unknown'
        let warnMessage = `轮询文档状态失败 (尝试 ${attempt + 1}/${maxAttempts})`;
        if (error instanceof AxiosError && error.response?.data?.message) {
          warnMessage += `: ${error.response.data.message}`;
        } else if (error instanceof Error) {
          warnMessage += `: ${error.message}`;
        } else {
          warnMessage += ': 未知错误';
        }
        console.warn(warnMessage, error);
      }
    }

    throw new Error('文档处理超时，请稍后重试');
  },
};
