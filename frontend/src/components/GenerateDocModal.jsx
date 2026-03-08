import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function GenerateDocModal({ notebookId, note, onGenerated, onClose }) {
  const { t, lang } = useTranslation();
  const [title, setTitle] = useState(note?.meta?.document_title || '');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!title.trim()) { setError(t('noteForm.required')); return; }
    setGenerating(true);
    setError('');
    try {
      const r = await fetch(`http://localhost:3001/api/notebooks/${notebookId}/documents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim(),
          noteId: note?.id,
          language: lang
        })
      });
      if (!r.ok) throw new Error('Failed');
      onGenerated();
    } catch (e) {
      setError(t('errors.aiFailed'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">{t('modal.generateDoc')}</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">{t('modal.docTitle')}</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder={t('modal.docTitlePlaceholder')}
            className="input w-full"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">{t('modal.docInstructions')}</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={t('modal.docInstructionsPlaceholder')}
            rows={4}
            className="input w-full resize-none text-sm"
          />
        </div>

        {note && (
          <p className="text-xs text-gray-600 mb-4">
            Source : {note.noteContext}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary">{t('modal.cancel')}</button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
          >
            {generating ? t('modal.generating') : t('modal.generate')}
          </button>
        </div>
      </div>
    </div>
  );
}
