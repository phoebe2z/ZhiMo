// src/services/ai.ts
import type { ApiResponse } from './api';
import { api } from './api';
import { AxiosError } from 'axios'; // FIX: 导入 AxiosError 用于类型守卫

// AI功能请求和响应类型定义

// 文档重构
export interface RestructureRequest {
  style: 'academic' | 'casual' | 'professional';
  language: 'zh' | 'en';
}

export interface RestructureResponse {
  restructuredContent: string;
  options: RestructureRequest;
}

// 生成摘要
export interface SummaryRequest {
  length: 'short' | 'medium' | 'long';
  language: 'zh' | 'en';
  includeKeyPoints?: boolean;
}

export interface SummaryResponse {
  summary: string;
  options: SummaryRequest;
}

// 生成练习题
export interface ExercisesRequest {
  count: number;
  types: ('multiple_choice' | 'true_false' | 'short_answer')[];
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'zh' | 'en';
}

export interface Exercise {
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExercisesResponse {
  exercises: Exercise[];
  options: ExercisesRequest;
}

// 提取概念
export interface ConceptsRequest {
  maxConcepts: number;
  language: 'zh' | 'en';
}

export interface Concept {
  term: string;
  definition: string;
  importance: number;
}

export interface ConceptsResponse {
  concepts: Concept[];
  options: ConceptsRequest;
}

// 生成思维导图
export interface MindmapRequest {
  maxNodes: number;
  language: 'zh' | 'en';
  style: 'mindmap' | 'flowchart';
}

export interface MindmapResponse {
  mindMap: string;
  isValidSyntax: boolean;
  options: MindmapRequest;
}

// 批量AI处理
export interface BatchProcessRequest {
  includeRestructure?: boolean;
  includeSummary?: boolean;
  includeExercises?: boolean;
  includeConcepts?: boolean;
  includeMindMap?: boolean;
  language: 'zh' | 'en';
}

export interface BatchProcessResponse {
  restructure?: RestructureResponse;
  summary?: SummaryResponse;
  exercises?: ExercisesResponse;
  concepts?: ConceptsResponse;
  mindMap?: MindmapResponse;
}

// AI服务
export const aiService = {
  // 文档重构
  async restructureDocument(
    documentId: string,
    options: RestructureRequest,
  ): Promise<ApiResponse<RestructureResponse>> {
    try {
      const response = await api.post<RestructureResponse>(
        `/documents/${documentId}/ai/restructure`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '文档重构失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 生成摘要
  async generateSummary(
    documentId: string,
    options: SummaryRequest,
  ): Promise<ApiResponse<SummaryResponse>> {
    try {
      const response = await api.post<SummaryResponse>(
        `/documents/${documentId}/ai/summary`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '生成摘要失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 生成练习题
  async generateExercises(
    documentId: string,
    options: ExercisesRequest,
  ): Promise<ApiResponse<ExercisesResponse>> {
    try {
      const response = await api.post<ExercisesResponse>(
        `/documents/${documentId}/ai/exercises`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '生成练习题失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 提取概念
  async extractConcepts(
    documentId: string,
    options: ConceptsRequest,
  ): Promise<ApiResponse<ConceptsResponse>> {
    try {
      const response = await api.post<ConceptsResponse>(
        `/documents/${documentId}/ai/concepts`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '提取概念失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 生成思维导图
  async generateMindmap(
    documentId: string,
    options: MindmapRequest,
  ): Promise<ApiResponse<MindmapResponse>> {
    try {
      const response = await api.post<MindmapResponse>(
        `/documents/${documentId}/ai/mindmap`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '生成思维导图失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // 批量AI处理
  async batchProcess(
    documentId: string,
    options: BatchProcessRequest,
  ): Promise<ApiResponse<BatchProcessResponse>> {
    try {
      const response = await api.post<BatchProcessResponse>(
        `/documents/${documentId}/ai/process`,
        options,
      );
      return response;
    } catch (error: unknown) {
      // FIX: 将 'any' 改为 'unknown'
      let errorMessage = '批量AI处理失败';
      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },
};
