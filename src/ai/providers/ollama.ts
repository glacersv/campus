import { ollamaConfig, type ModelType } from '../config';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function ollamaChat(
  model: ModelType,
  messages: OllamaMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const modelConfig = {
    deepseek: 'deepseek-r1:7b',
    qwen: 'qwen2.5-coder:7b',
  }[model];

  const response = await fetch(`${ollamaConfig.baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelConfig,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data: OllamaResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

export function isOllamaAvailable(): boolean {
  return !!ollamaConfig.baseURL;
}