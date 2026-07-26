export { models, ollamaConfig, geminiConfig } from './config';
export type { ModelType, AIModel } from './config';
export { ollamaChat, isOllamaAvailable } from './providers/ollama';
export { geminiChat, isGeminiAvailable } from './providers/gemini';
export { chat, streamChat } from './router';
export type { TaskType } from './router';