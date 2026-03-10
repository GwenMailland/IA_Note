import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import Spinner from './Spinner';

export default function WeeklySummaryBanner({ notebookId, notesThisWeek, onGenerated }) {
  const { t, lang } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  if (dismissed) return null;

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3001/api/notebooks/${notebookId}/chat/summary/weekly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.empty) {
        setDismissed(true);
        return;
      }
      onGenerated(data.slug);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
         style={{
           background: 'linear-gradient(135deg, var(--nf-accent-muted), rgba(45,27,105,0.4))',
           border: '1px solid rgba(124,58,237,0.3)',
         }}>
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--nf-accent-text)', fontSize: '0.85em' }}>◆</span>
        <span className="text-sm" style={{ color: 'var(--nf-text-sec)' }}>
          <span className="font-semibold" style={{ color: 'var(--nf-accent-text)' }}>
            {notesThisWeek}
          </span>
          {' '}{t('weekly.banner', { count: notesThisWeek })}
        </span>
        {error && <span className="text-xs text-red-400 ml-2">{error}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={generate}
          disabled={loading}
          className="btn btn-primary text-xs px-3 py-1.5"
        >
          {loading ? <Spinner size="sm" /> : t('weekly.generate')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="btn btn-ghost text-xs p-1"
          style={{ color: 'var(--nf-text-faint)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
