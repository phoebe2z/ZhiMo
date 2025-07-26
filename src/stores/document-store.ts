import { defineStore } from 'pinia';
import { ref } from 'vue';

// 定义数据结构 (TypeScript接口)
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'ppt' | 'image' | 'word' | 'web';
  status: '已完成' | '分析中' | '等待中';
  cloudUrl: string;
}

// 模拟后端API返回的数据
const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: '宏观经济学原理.pdf',
    type: 'pdf',
    status: '已完成',
    cloudUrl: '/docs/macroeconomics.pdf',
  },
  {
    id: 'doc-2',
    name: 'IS-LM模型详解.ppt',
    type: 'ppt',
    status: '已完成',
    cloudUrl: '/docs/is-lm.ppt',
  },
  {
    id: 'doc-3',
    name: '课堂笔记-01.jpg',
    type: 'image',
    status: '分析中',
    cloudUrl: '/docs/notes.jpg',
  },
  {
    id: 'doc-4',
    name: '凯恩斯主义经济学.docx',
    type: 'word',
    status: '等待中',
    cloudUrl: '/docs/keynes.docx',
  },
];

// 模拟API调用
const fakeDocApi = {
  fetchDocuments: () => new Promise<Document[]>((res) => setTimeout(() => res(mockDocuments), 800)),
  uploadFile: (file: File) =>
    new Promise<Document>((res) =>
      setTimeout(
        () =>
          res({
            id: `doc-${Date.now()}`,
            name: file.name,
            type: 'pdf', // 简化处理
            status: '等待中',
            cloudUrl: `/uploads/${file.name}`,
          }),
        1200,
      ),
    ),
};

export const useDocumentStore = defineStore('documents', () => {
  const documents = ref<Document[]>([]);
  const isLoading = ref(false);
  const currentDocument = ref<Document | null>(null);

  async function fetchDocuments() {
    isLoading.value = true;
    // TODO: 替换为真实API调用: const response = await api.get('/documents');
    documents.value = await fakeDocApi.fetchDocuments();
    isLoading.value = false;
  }

  async function uploadDocument(file: File) {
    // TODO: 替换为真实API调用: const newDoc = await api.post('/upload', file);
    const newDoc = await fakeDocApi.uploadFile(file);
    documents.value.unshift(newDoc);
    return newDoc; // 返回新文档对象
  }

  function selectDocument(doc: Document | null) {
    currentDocument.value = doc;
  }

  return {
    documents,
    isLoading,
    currentDocument,
    fetchDocuments,
    uploadDocument,
    selectDocument,
  };
});
