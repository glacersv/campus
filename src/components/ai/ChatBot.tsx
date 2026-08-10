import { useState, useRef, useEffect } from 'react';
import { chat, type TaskType } from '../../ai/router';
import { models } from '../../ai/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

export function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chat(userMessage, taskType);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          model: models[response.model].name,
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu solicitud.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="bg-white rounded-t-2xl shadow-sm border-b border-slate-200/80 p-4">
        <h2 className="text-lg font-semibold text-slate-800">Asistente IA</h2>
        <div className="flex gap-2 mt-2">
          {(['general', 'code', 'reasoning', 'creative'] as TaskType[]).map(type => (
            <button
              key={type}
              onClick={() => setTaskType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                taskType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'general' && 'General'}
              {type === 'code' && 'Código'}
              {type === 'reasoning' && 'Razonamiento'}
              {type === 'creative' && 'Creativo'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--bg-main)' }}>
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <p className="text-lg">¿Cómo puedo ayudarte hoy?</p>
            <p className="text-sm mt-2">
              Selecciona el tipo de tarea y escribe tu pregunta
            </p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              {message.model && (
                <p className="text-xs mt-1 opacity-70">
                  {message.model}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 shadow-sm border border-slate-200/80 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-2xl shadow-sm border-t border-slate-200/80 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="input-crema flex-1"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}