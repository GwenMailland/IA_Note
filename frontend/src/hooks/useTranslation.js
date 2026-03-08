import { useContext } from 'react';
import { LangContext } from '../context/LangContext';

export function useTranslation() {
  const { lang, setLang } = useContext(LangContext);

  function t(key) {
    const translations = window.__NF_TRANSLATIONS__?.[lang] || {};
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) return key;
    }
    return result ?? key;
  }

  return { t, lang, setLang };
}
