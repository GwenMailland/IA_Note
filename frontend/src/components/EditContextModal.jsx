import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function EditContextModal({ notebook, onSaved, onClose }) {
  const { t } = useTranslation();
  const [context, setContext] = useState(notebook.context || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const r = await fetch(`http://localhost:3001/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      if (!r.ok) throw new Error('Failed');
      const updated = await r.json();
      onSaved(updated);
    } catch (e) {
      setError(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">{t('modal.editContext')}</h2>
        <textarea
          value={context}
          onChange={e => { setContext(e.target.value); setError(''); }}
          rows={10}
          className="input w-full resize-none font-mono text-xs mb-4"
          placeholder={t('modal.globalContextPlaceholder')}
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-secondary">{t('modal.cancel')}</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? '…' : t('modal.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
