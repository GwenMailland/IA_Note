import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from '../hooks/useTranslation';

function formatDateTime(iso, lang) {
  return new Date(iso).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Highlight plain text occurrences with <mark> spans
function Highlight({ text, query }) {
  if (!query.trim() || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  );
}

// Inject <mark> tags into a markdown string for rendering via rehype-raw
function highlightMarkdown(content, query) {
  if (!query.trim() || !content) return content;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>'
  );
}

export default function NoteCard({ note, onGenerateDoc, searchQuery = '' }) {
  const { t, lang } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(note.structuredContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const processedContent = searchQuery
    ? highlightMarkdown(note.structuredContent, searchQuery)
    : note.structuredContent;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="text-gray-500 hover:text-gray-300 shrink-0 transition-colors"
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-indigo">
                <Highlight text={note.noteContext} query={searchQuery} />
              </span>
              <span className="text-xs text-gray-600">{formatDateTime(note.createdAt, lang)}</span>
            </div>
          </div>
        </div>
        <span className="badge badge-gray shrink-0 text-xs">
          {note.provider} · {note.model?.split(':')[0] || note.model}
        </span>
      </div>

      {/* Suggestion banner */}
      {!collapsed && note.meta?.suggest_document && (
        <div className="px-4 py-2 bg-indigo-950/50 border-b border-indigo-900 flex items-center justify-between gap-2">
          <span className="text-xs text-indigo-300">
            ✦ {t('noteCard.suggestDoc')}
            {note.meta.document_title && ` : "${note.meta.document_title}"`}
          </span>
          <button
            onClick={() => onGenerateDoc(note)}
            className="btn btn-primary text-xs py-1"
          >
            {t('noteCard.createDoc')}
          </button>
        </div>
      )}

      {/* Content */}
      {!collapsed && (
        <div className="px-4 py-3">
          {showRaw ? (
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
              <Highlight text={note.rawContent} query={searchQuery} />
            </pre>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0 max-h-96 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={searchQuery ? [rehypeRaw] : []}>
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-2">
          <button
            onClick={() => setShowRaw(v => !v)}
            className="btn btn-ghost text-xs"
          >
            {showRaw ? t('noteCard.structured') : t('noteCard.raw')}
          </button>
          <button
            onClick={() => onGenerateDoc(note)}
            className="btn btn-ghost text-xs"
          >
            {t('noteCard.generateDoc')}
          </button>
          <button
            onClick={handleCopy}
            className="btn btn-ghost text-xs ml-auto"
          >
            {copied ? t('noteCard.copied') : t('noteCard.copy')}
          </button>
        </div>
      )}
    </div>
  );
}
