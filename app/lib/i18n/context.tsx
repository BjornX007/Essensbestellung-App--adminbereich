'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'de';

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({ locale: 'en', setLocale: () => {}, t: (k) => k });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const saved = (localStorage.getItem('locale') as Locale) || 'en';
    setLocaleState(saved);
  }, []);

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
    localStorage.setItem('locale', locale);
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (path: string): string => {
    const result = path.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, messages);

    if (typeof result === 'string') return result;
    return path; // fallback: return the key itself
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useTranslation = () => useContext(LocaleContext);