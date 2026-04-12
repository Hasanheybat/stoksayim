import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from './translations';

const SUPPORTED_LANGS = ['tr', 'az', 'ru'];
const LS_KEY = 'stoksay-lang';
const DEFAULT_LANG = 'az';

function detectLanguage() {
  // 1. Check localStorage
  const stored = localStorage.getItem(LS_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  // 2. Check browser language
  const browserLang = (navigator.language || navigator.userLanguage || '').split('-')[0].toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  // 3. Default
  return DEFAULT_LANG;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    localStorage.setItem(LS_KEY, newLang);
    setLangState(newLang);
    document.documentElement.lang = newLang;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: newLang } }));
  }, []);

  const t = useCallback((key, params) => {
    const entry = translations[key];
    if (!entry) return key;
    let text = entry[lang] || entry[DEFAULT_LANG] || key;
    // Parametre desteği: t('users.minChars', { n: 8 }) → "En az 8 karakter"
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [lang]);

  // Set html lang on mount
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, supportedLangs: SUPPORTED_LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { SUPPORTED_LANGS, DEFAULT_LANG };
