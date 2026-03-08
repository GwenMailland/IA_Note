import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { id: 'dark',  label: '◆', title: 'Dark',  color: '#6366f1' },
  { id: 'light', label: '◆', title: 'Light', color: '#e5e7eb' },
  { id: 'blood', label: '◆', title: 'Blood', color: '#ef4444' },
];

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();
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
            <span style={{ color: 'var(--nf-accent)' }}>◆</span>
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

          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-md p-0.5">
            {THEMES.map(th => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                title={th.title}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  theme === th.id ? 'bg-gray-700 opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
                style={{ color: th.color }}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-md p-0.5">
            <button
              onClick={() => setLang('fr')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'fr' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              style={lang === 'fr' ? { backgroundColor: 'var(--nf-accent)' } : {}}
            >
              FR
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === 'en' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
              style={lang === 'en' ? { backgroundColor: 'var(--nf-accent)' } : {}}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
