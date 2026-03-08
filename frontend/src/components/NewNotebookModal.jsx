import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function NewNotebookModal({ onCreated, onClose }) {
  const { t, lang } = useTranslation();
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSuggest() {
    if (!title.trim()) {
      setErrors({ title: t('noteForm.required') });
      return;
    }
    setSuggesting(true);
    try {
      const r = await fetch('http://localhost:3001/api/notebooks/suggest-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), language: lang })
      });
      const data = await r.json();
      if (data.context) setContext(data.context);
    } catch (e) {
      console.error(e);
    } finally {
      setSuggesting(false);
    }
  }

  async function handleCreate() {
    const errs = {};
    if (!title.trim()) errs.title = t('noteForm.required');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setCreating(true);
    try {
      const r = await fetch('http://localhost:3001/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), context: context.trim(), language: lang })
      });
      const nb = await r.json();
      onCreated(nb);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">{t('modal.newNotebook')}</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">{t('modal.title')}</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors({}); }}
            placeholder={t('modal.titlePlaceholder')}
            className="input w-full"
            autoFocus
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-400">{t('modal.globalContext')}</label>
            <button
              onClick={handleSuggest}
              disabled={suggesting || !title.trim()}
              className="btn btn-ghost text-xs"
            >
              {suggesting ? t('modal.suggesting') : t('modal.suggestContext')}
            </button>
          </div>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder={t('modal.globalContextPlaceholder')}
            rows={6}
            className="input w-full resize-none font-mono text-xs"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary">{t('modal.cancel')}</button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn btn-primary"
          >
            {creating ? '…' : t('modal.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
