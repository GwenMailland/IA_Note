import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import NewNotebookModal from '../components/NewNotebookModal';

function formatDate(iso, lang) {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatRelative(iso, lang) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (lang === 'fr') {
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours} h`;
    return `il y a ${days} j`;
  } else {
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export default function HomePage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNotebooks();
  }, []);

  async function loadNotebooks() {
    try {
      const r = await fetch('http://localhost:3001/api/notebooks');
      const data = await r.json();
      setNotebooks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(nb) {
    setShowModal(false);
    navigate(`/notebooks/${nb.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('home.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <span>+</span> {t('home.newNotebook')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">...</div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">📓</div>
          <p>{t('home.noNotebooks')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notebooks.map(nb => (
            <button
              key={nb.id}
              onClick={() => navigate(`/notebooks/${nb.id}`)}
              className="card p-4 text-left hover:border-indigo-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {nb.title}
                </h2>
                <span className="badge badge-gray ml-2 shrink-0">
                  {nb.noteCount} {nb.noteCount === 1 ? t('home.note') : t('home.notes')}
                </span>
              </div>
              {nb.context && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{nb.context}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{t('home.createdOn')} {formatDate(nb.createdAt, lang)}</span>
                <span>{t('home.lastActivity')} {formatRelative(nb.updatedAt, lang)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <NewNotebookModal
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
