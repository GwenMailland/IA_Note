import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from '../hooks/useTranslation';

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

  if (loading) return <div className="text-center py-8 text-gray-500">...</div>;

  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* Sidebar */}
      <div className="w-48 shrink-0">
        <button
          onClick={onGenerate}
          className="btn btn-primary w-full mb-3 text-sm"
        >
          + {t('documents.newDocument')}
        </button>

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
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selected.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-600 text-sm text-center py-8">
            {t('documents.noDocuments')}
          </p>
        )}
      </div>
    </div>
  );
}
