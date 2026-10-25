import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import hinglish from './locales/hinglish.json';

export const LANGUAGES = [
  { code: 'en', htmlLang: 'en', script: 'latin' },
  { code: 'hi', htmlLang: 'hi', script: 'devanagari' },
  { code: 'hinglish', htmlLang: 'hi-Latn', script: 'latin' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'hinglish';
const STORAGE_KEY = 'bvv.language';

function isLanguage(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

function readStoredLanguage(): LanguageCode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

/** Sets <html lang> and data-script; index.css switches to the Devanagari font when script is devanagari. */
function applyDocumentLanguage(code: string) {
  const meta = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dataset.script = meta.script;
  document.title = i18n.t('meta.title');
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    hinglish: { translation: hinglish },
  },
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (code) => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage can be blocked (private mode); the language still applies for this visit.
  }
  applyDocumentLanguage(code);
});

applyDocumentLanguage(i18n.language);

export default i18n;
