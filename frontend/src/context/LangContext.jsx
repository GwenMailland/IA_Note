import React, { createContext, useState, useEffect } from 'react';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

const translations = { fr, en };
window.__NF_TRANSLATIONS__ = translations;

export const LangContext = createContext({ lang: 'fr', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('fr');

  // Load initial language from backend config
  useEffect(() => {
    fetch('http://localhost:3001/api/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.language) setLangState(cfg.language);
      })
      .catch(() => {});
  }, []);

  function setLang(newLang) {
    setLangState(newLang);
    window.__NF_TRANSLATIONS__ = translations;
    // Persist to backend
    fetch('http://localhost:3001/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: newLang })
    }).catch(() => {});
  }

  // Keep translations always available
  window.__NF_TRANSLATIONS__ = translations;

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
