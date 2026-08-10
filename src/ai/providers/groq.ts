const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getApiKey(): string {
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

export function isGroqAvailable(): boolean {
  return !!getApiKey();
}

export async function groqChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY no está configurada');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || 'llama-3.3-70b-versatile',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
