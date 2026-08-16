export { models, ollamaConfig, geminiConfig } from './config';
export type { ModelType, AIModel } from './config';
export { ollamaChat, isOllamaAvailable } from './providers/ollama';
export { geminiChat, isGeminiAvailable } from './providers/gemini';
export { chat, streamChat } from './router';
export type { TaskType } from './router';

export function mensajeIA(e: any): string {
  const msg = String(e?.message || '');
  if (/rate limit|429|too many requests/i.test(msg)) return 'La IA alcanzó su límite de uso. Espera unos segundos y vuelve a intentarlo.';
  if (/no está configurada|no hay proveedor|no configurado/i.test(msg)) return 'No hay proveedor de IA configurado.';
  return msg.slice(0, 220);
}