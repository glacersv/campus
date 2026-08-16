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

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
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

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }

    const err = await response.json().catch(() => ({}));
    lastError = new Error(err.error?.message || `Error HTTP ${response.status}`);

    if (response.status === 429) {
      const m = (lastError.message || '').match(/try again in ([\d.]+)s/i);
      const waitMs = m ? parseFloat(m[1]) * 1000 + 800 : 15000;
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    throw lastError;
  }

  throw lastError;
}
