import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from '../hooks/useTranslation';
import Spinner from './Spinner';

function formatDate(iso, lang) {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export default function DocumentsTab({ notebookId, onGenerate }) {
  const { t, lang } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savedPath, setSavedPath] = useState('');

  useEffect(() => { loadDocs(); }, [notebookId]);

  async function loadDocs() {
    try {
      const r = await fetch(`http://localhost:3001/api/notebooks/${notebookId}/documents`);
      const data = await r.json();
      setDocs(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function showSavedToast(path) {
    setSavedPath(path);
    setTimeout(() => setSavedPath(''), 4000);
  }

  async function exportToDir(files) {
    const r = await fetch('http://localhost:3001/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    if (!r.ok) throw new Error('Export failed');
    return r.json();
  }

  async function saveOne() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await exportToDir([{ name: `${selected.slug}.md`, content: selected.content }]);
      showSavedToast(result.saved[0].path);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function saveAll() {
    setSavingAll(true);
    try {
      const files = docs.map(d => ({ name: `${d.slug}.md`, content: d.content }));
      const result = await exportToDir(files);
      showSavedToast(result.dir);
    } catch (e) { console.error(e); }
    finally { setSavingAll(false); }
  }

  if (loading) return <div className="py-8"><Spinner /></div>;

  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0">
        <button onClick={onGenerate} className="btn btn-primary w-full mb-2 text-sm">
          + {t('documents.newDocument')}
        </button>

        {docs.length > 1 && (
          <button
            onClick={saveAll}
            disabled={savingAll}
            className="btn btn-secondary w-full mb-3 text-xs"
          >
            {savingAll ? <Spinner size="sm" /> : t('documents.saveAll')}
          </button>
        )}

        {docs.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--nf-text-faint)' }}>
            {t('documents.noDocuments')}
          </p>
        ) : (
          <div className="space-y-1">
            {docs.map(doc => (
              <button
                key={doc.slug}
                onClick={() => setSelected(doc)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
                style={selected?.slug === doc.slug ? {
                  backgroundColor: 'var(--nf-accent-bg)',
                  color: 'var(--nf-accent-text)',
                } : {
                  color: 'var(--nf-text-muted)',
                }}
              >
                <div className="font-medium truncate">{doc.slug.replace(/-/g, ' ')}</div>
                <div className="mt-0.5 opacity-60">{formatDate(doc.updatedAt, lang)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 card p-4 overflow-auto">
        {selected ? (
          <>
            <div className="flex items-center justify-between mb-3 gap-3">
              {savedPath ? (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md truncate"
                      style={{ backgroundColor: 'var(--nf-accent-muted)', color: 'var(--nf-accent-text)', maxWidth: '60%' }}>
                  ✓ {savedPath}
                </span>
              ) : <div />}
              <button
                onClick={saveOne}
                disabled={saving}
                className="btn btn-ghost text-xs shrink-0 flex items-center gap-1"
              >
                {saving ? <Spinner size="sm" /> : '↓'}
                {t('documents.saveToDir')}
              </button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:font-semibold
              prose-h1:text-xl prose-h2:text-lg prose-h2:border-b prose-h2:pb-1
              prose-p:my-2 prose-li:my-0.5
              prose-code:px-1 prose-code:rounded prose-pre:border
              prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selected.content}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: 'var(--nf-text-faint)' }}>
            {t('documents.noDocuments')}
          </p>
        )}
      </div>
    </div>
  );
}
