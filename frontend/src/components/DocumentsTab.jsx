import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';
import { useTranslation } from '../hooks/useTranslation';
import Spinner from './Spinner';

function formatDate(iso, lang) {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DocumentsTab({ notebookId, onGenerate }) {
  const { t, lang } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [notebookId]);

  async function loadDocs() {
    try {
      const r = await fetch(`http://localhost:3001/api/notebooks/${notebookId}/documents`);
      const data = await r.json();
      setDocs(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function exportZip() {
    setZipping(true);
    try {
      const zip = new JSZip();
      docs.forEach(doc => zip.file(`${doc.slug}.md`, doc.content));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-${notebookId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setZipping(false); }
  }

  if (loading) return <div className="py-8"><Spinner /></div>;

  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0">
        <button
          onClick={onGenerate}
          className="btn btn-primary w-full mb-2 text-sm"
        >
          + {t('documents.newDocument')}
        </button>

        {docs.length > 1 && (
          <button
            onClick={exportZip}
            disabled={zipping}
            className="btn btn-secondary w-full mb-3 text-xs"
          >
            {zipping ? '…' : t('documents.exportZip')}
          </button>
        )}

        {docs.length === 0 ? (
          <p className="text-xs text-gray-600">{t('documents.noDocuments')}</p>
        ) : (
          <div className="space-y-1">
            {docs.map(doc => (
              <button
                key={doc.slug}
                onClick={() => setSelected(doc)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                  selected?.slug === doc.slug
                    ? 'bg-indigo-900 text-indigo-100'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <div className="font-medium truncate">{doc.slug.replace(/-/g, ' ')}</div>
                <div className="text-gray-600 mt-0.5">{formatDate(doc.updatedAt, lang)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 card p-4 overflow-auto">
        {selected ? (
          <>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => downloadFile(`${selected.slug}.md`, selected.content)}
                className="btn btn-ghost text-xs"
              >
                ↓ {t('documents.downloadMd')}
              </button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selected.content}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-sm text-center py-8">
            {t('documents.noDocuments')}
          </p>
        )}
      </div>
    </div>
  );
}
