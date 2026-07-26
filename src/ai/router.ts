import { type ModelType, models } from './config';
import { ollamaChat, isOllamaAvailable } from './providers/ollama';
import { geminiChat, isGeminiAvailable } from './providers/gemini';

export type TaskType = 'code' | 'reasoning' | 'general' | 'creative';

interface RouterOptions {
  preferLocal?: boolean;
  maxRetries?: number;
}

function selectModelForTask(taskType: TaskType): ModelType {
  switch (taskType) {
    case 'code':
      return 'qwen';
    case 'reasoning':
      return 'deepseek';
    case 'creative':
    case 'general':
      return 'gemini';
    default:
      return 'qwen';
  }
}

function estimateComplexity(input: string): 'low' | 'high' {
  const wordCount = input.split(/\s+/).length;
  const hasCode = /```|function|class|import|const|let|var/.test(input);
  const hasMath = /calcular|ecuación|derivada|integral|matemáticas/.test(input);
  
  if (wordCount > 100 || hasCode || hasMath) {
    return 'high';
  }
  return 'low';
}

export async function chat(
  input: string,
  taskType: TaskType = 'general',
  options?: RouterOptions & { temperature?: number; maxTokens?: number }
): Promise<{ content: string; model: ModelType }> {
  const complexity = estimateComplexity(input);
  let selectedModel = selectModelForTask(taskType);
  
  if (complexity === 'low' && options?.preferLocal !== false) {
    selectedModel = taskType === 'code' ? 'qwen' : 'deepseek';
  }
  
  const maxRetries = options?.maxRetries ?? 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const modelConfig = models[selectedModel];
      
      if (modelConfig.provider === 'ollama' && !isOllamaAvailable()) {
        if (isGeminiAvailable()) {
          selectedModel = 'gemini';
          continue;
        }
        throw new Error('No hay proveedores de IA disponibles');
      }
      
      if (modelConfig.provider === 'gemini' && !isGeminiAvailable()) {
        if (isOllamaAvailable()) {
          selectedModel = taskType === 'code' ? 'qwen' : 'deepseek';
          continue;
        }
        throw new Error('No hay proveedores de IA disponibles');
      }
      
      let content: string;
      
      if (modelConfig.provider === 'ollama') {
        content = await ollamaChat(selectedModel, [
          { role: 'user', content: input },
        ], options);
      } else {
        content = await geminiChat([
          { role: 'user', parts: [{ text: input }] },
        ], options);
      }
      
      return { content, model: selectedModel };
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        if (isOllamaAvailable() && selectedModel !== 'deepseek') {
          selectedModel = 'deepseek';
        } else if (isGeminiAvailable() && selectedModel !== 'gemini') {
          selectedModel = 'gemini';
        }
      }
    }
  }
  
  throw lastError || new Error('Error al procesar la solicitud');
}

export async function streamChat(
  input: string,
  taskType: TaskType = 'general',
  onChunk: (chunk: string) => void
): Promise<ModelType> {
  const selectedModel = selectModelForTask(taskType);
  
  if (models[selectedModel].provider === 'ollama' && isOllamaAvailable()) {
    const response = await fetch(`${models[selectedModel].provider === 'ollama' ? 'http://localhost:11434/v1' : ''}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: models[selectedModel].id,
        messages: [{ role: 'user', content: input }],
        stream: true,
      }),
    });
    
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onChunk(content);
          } catch {}
        }
      }
    }
  } else {
    const content = await chat(input, taskType);
    onChunk(content.content);
  }
  
  return selectedModel;
}