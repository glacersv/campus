import { GoogleGenAI } from '@google/genai';
import { geminiConfig } from '../config';

let genai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genai) {
    if (!geminiConfig.apiKey) {
      throw new Error('VITE_GEMINI_API_KEY no está configurada');
    }
    genai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });
  }
  return genai;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function geminiChat(
  messages: GeminiMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const ai = getGenAI();
  
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: msg.parts,
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents,
    config: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 8192,
    },
  });

  return response.text || '';
}

export function isGeminiAvailable(): boolean {
  return !!geminiConfig.apiKey;
}