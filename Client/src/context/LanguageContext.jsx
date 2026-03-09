import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY = 'bye_language';
const SUPPORTED_CODES = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.code));

const readInitialLanguage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_CODES.has(stored)) {
            return stored;
        }
    } catch {
        // Ignore localStorage errors and fall back to default language.
    }

    return DEFAULT_LANGUAGE;
};

const LanguageContext = createContext({
    language: DEFAULT_LANGUAGE,
    setLanguage: () => {},
    t: (key) => key,
    supportedLanguages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(readInitialLanguage);

    const setLanguage = useCallback((nextLanguage) => {
        if (!SUPPORTED_CODES.has(nextLanguage)) {
            return;
        }

        setLanguageState(nextLanguage);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // Ignore localStorage write issues (private mode / browser restrictions).
        }

        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);

    const t = useCallback((key, params = {}) => {
        const active = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE] || {};
        const fallback = TRANSLATIONS[DEFAULT_LANGUAGE] || {};
        const template = active[key] ?? fallback[key] ?? key;

        return template.replace(/\{(\w+)\}/g, (_, token) => {
            if (Object.prototype.hasOwnProperty.call(params, token)) {
                return String(params[token]);
            }

            return `{${token}}`;
        });
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
    }), [language, setLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
