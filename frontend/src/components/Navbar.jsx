import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const location = useLocation();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {});
  }, [location]);

  const providerLabel = config
    ? `${config.ai?.provider || 'ollama'} — ${config.ai?.[config.ai?.provider]?.model || ''}`
    : '';

  return (
    <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="text-indigo-400">◆</span>
            {t('app.name')}
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                location.pathname === '/'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('nav.notebooks')}
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('nav.settings')}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {providerLabel && (
            <span className="badge badge-indigo text-xs">{providerLabel}</span>
          )}
          <div className="flex items-center gap-1 bg-gray-800 rounded-md p-0.5">
            <button
              onClick={() => setLang('fr')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'fr' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
