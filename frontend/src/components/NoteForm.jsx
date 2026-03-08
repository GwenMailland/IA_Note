import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from '../hooks/useTranslation';

const PROVIDERS = ['ollama', 'groq', 'claude'];

export default function NoteForm({ notebookId, onNoteAdded }) {
  const { t, lang } = useTranslation();
  const [noteContext, setNoteContext] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [provider, setProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [providerStatus, setProviderStatus] = useState({ ollama: false, groq: false, claude: false });
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/config').then(r => r.json()).catch(() => null),
      fetch('http://localhost:3001/api/ai/ollama/status').then(r => r.json()).catch(() => ({ available: false }))
    ]).then(([cfg, ollamaData]) => {
      setProviderStatus({
        ollama: ollamaData?.available || false,
        groq: !!cfg?.ai?.groq?.apiKey,
        claude: !!cfg?.ai?.claude?.apiKey
      });
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!noteContext.trim()) errs.noteContext = t('noteForm.required');
    if (!rawContent.trim()) errs.rawContent = t('noteForm.required');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors({});
    setPreview(false);
    try {
      const r = await fetch(`http://localhost:3001/api/notebooks/${notebookId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContext: noteContext.trim(),
          rawContent: rawContent.trim(),
          language: lang,
          provider: provider || undefined
        })
      });
      if (!r.ok) throw new Error('Failed');
      const note = await r.json();
      onNoteAdded(note);
      setNoteContext('');
      setRawContent('');
      setProvider('');
    } catch (e) {
      setErrors({ submit: t('errors.aiFailed') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">{t('noteForm.title')}</h2>

      <div className="mb-3">
        <input
          type="text"
          value={noteContext}
          onChange={e => { setNoteContext(e.target.value); setErrors({}); }}
          placeholder={t('noteForm.noteContextPlaceholder')}
          className="input w-full text-sm"
        />
        {errors.noteContext && <p className="text-red-400 text-xs mt-1">{errors.noteContext}</p>}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{t('noteForm.rawContent')}</span>
          {rawContent.trim() && (
            <button
              type="button"
              onClick={() => setPreview(v => !v)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {preview ? t('noteForm.editMode') : t('noteForm.preview')}
            </button>
          )}
        </div>

        {preview ? (
          <div
            className="input w-full text-sm min-h-[120px] cursor-text overflow-y-auto max-h-64 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0"
            onClick={() => setPreview(false)}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rawContent}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={rawContent}
            onChange={e => { setRawContent(e.target.value); setErrors({}); }}
            placeholder={t('noteForm.rawContentPlaceholder')}
            rows={5}
            className="input w-full resize-none text-sm"
          />
        )}
        {errors.rawContent && <p className="text-red-400 text-xs mt-1">{errors.rawContent}</p>}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={provider}
          onChange={e => setProvider(e.target.value)}
          className="input text-xs py-1.5"
        >
          <option value="">{t('noteForm.defaultProvider')}</option>
          {PROVIDERS.map(p => (
            <option key={p} value={p} disabled={!providerStatus[p]}>
              {t(`providers.${p}`)}{!providerStatus[p] ? ` (${t('noteForm.notConfigured')})` : ''}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary ml-auto"
        >
          {submitting ? t('noteForm.submitting') : t('noteForm.submit')}
        </button>
      </div>

      {errors.submit && (
        <p className="text-red-400 text-xs mt-2">{errors.submit}</p>
      )}
    </form>
  );
}
