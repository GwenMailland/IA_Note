import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { id: 'dark',  label: '◆', title: 'Obsidian', color: '#c4b5fd' },
  { id: 'light', label: '◆', title: 'Light',    color: '#7c3aed' },
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
    <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10 backdrop-blur-md"
         style={{ backgroundColor: 'rgba(22,22,31,0.85)', borderColor: 'var(--nf-border)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg"
                style={{ color: 'var(--nf-text)' }}>
            <span style={{
              color: 'var(--nf-accent)',
              filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.6))',
              fontSize: '0.9em'
            }}>◆</span>
            <span style={{ letterSpacing: '-0.02em' }}>{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                location.pathname === '/'
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={location.pathname === '/' ? {
                backgroundColor: 'var(--nf-elevated)',
                color: 'var(--nf-text)'
              } : {}}
            >
              {t('nav.notebooks')}
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                location.pathname === '/settings'
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={location.pathname === '/settings' ? {
                backgroundColor: 'var(--nf-elevated)',
                color: 'var(--nf-text)'
              } : {}}
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
          <div className="flex items-center gap-0.5 rounded-lg p-0.5"
               style={{ backgroundColor: 'var(--nf-elevated)', border: '1px solid var(--nf-border)' }}>
            {THEMES.map(th => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                title={th.title}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  theme === th.id ? 'opacity-100' : 'opacity-35 hover:opacity-65'
                }`}
                style={{
                  color: th.color,
                  backgroundColor: theme === th.id ? 'var(--nf-surface)' : 'transparent',
                  boxShadow: theme === th.id ? '0 0 8px rgba(124,58,237,0.3)' : 'none',
                }}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5"
               style={{ backgroundColor: 'var(--nf-elevated)', border: '1px solid var(--nf-border)' }}>
            {['fr', 'en'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  lang === l ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                style={lang === l ? {
                  backgroundColor: 'var(--nf-accent)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                } : {}}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
