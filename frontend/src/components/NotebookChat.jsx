import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ssePost } from '../hooks/useSSEPost';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotebookChat({ notebookId }) {
  const { t, lang } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setLoading(true);
    setStatusLabel('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const result = await ssePost(
        `http://localhost:3001/api/notebooks/${notebookId}/chat/stream`,
        { question, language: lang },
        ({ label }) => setStatusLabel(label || '')
      );
      setMessages(prev => [...prev, {
        role: 'ai',
        content: result.answer,
        provider: result.provider,
        model: result.model
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${err.message}`, error: true }]);
    } finally {
      setLoading(false);
      setStatusLabel('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: '620px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4"
           style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--nf-border) transparent' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.5))' }}>◆</div>
            <p className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>
              {t('chat.empty.title')}
            </p>
            <p className="text-xs max-w-xs" style={{ color: 'var(--nf-text-muted)' }}>
              {t('chat.empty.hint')}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {(t('chat.suggestions') || []).map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
                  style={{
                    borderColor: 'var(--nf-border)',
                    color: 'var(--nf-text-muted)',
                    backgroundColor: 'var(--nf-elevated)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0 text-xs"
                   style={{ backgroundColor: 'var(--nf-accent-bg)', color: 'var(--nf-accent-text)' }}>
                ◆
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'chat-bubble-user px-4 py-2.5 text-sm' : 'chat-bubble-ai px-4 py-3'}`}>
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose-dark text-xs leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  {msg.provider && (
                    <p className="mt-2 text-xs opacity-50 not-prose">
                      {msg.provider} · {msg.model}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0 text-xs"
                 style={{ backgroundColor: 'var(--nf-accent-bg)', color: 'var(--nf-accent-text)' }}>
              ◆
            </div>
            <div className="chat-bubble-ai px-4 py-3 flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>
                {statusLabel || t('chat.thinking')}
              </span>
              <span className="flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ backgroundColor: 'var(--nf-accent)', animationDelay: `${d * 0.15}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--nf-border)' }}>
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={2}
            disabled={loading}
            className="input flex-1 text-sm resize-none"
            style={{ minHeight: '52px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary px-4 self-end"
            style={{ height: '52px' }}
          >
            {loading ? '…' : '↑'}
          </button>
        </form>
        <p className="text-xs mt-1.5" style={{ color: 'var(--nf-text-faint)' }}>
          {t('chat.hint')}
        </p>
      </div>
    </div>
  );
}
