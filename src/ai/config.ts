export type ModelType = 'deepseek' | 'qwen' | 'gemini';

export interface AIModel {
  id: string;
  name: string;
  provider: 'ollama' | 'gemini';
  type: ModelType;
  maxTokens: number;
  contextLength: number;
}

export const models: Record<ModelType, AIModel> = {
  deepseek: {
    id: 'deepseek-r1:7b',
    name: 'DeepSeek R1 7B',
    provider: 'ollama',
    type: 'deepseek',
    maxTokens: 4096,
    contextLength: 131072,
  },
  qwen: {
    id: 'qwen2.5-coder:7b',
    name: 'Qwen 2.5 Coder 7B',
    provider: 'ollama',
    type: 'qwen',
    maxTokens: 4096,
    contextLength: 32768,
  },
  gemini: {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    type: 'gemini',
    maxTokens: 8192,
    contextLength: 1048576,
  },
};

export const ollamaConfig = {
  baseURL: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434/v1',
};

export const geminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
};