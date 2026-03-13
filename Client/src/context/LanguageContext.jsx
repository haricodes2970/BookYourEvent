// LanguageContext.jsx
// Multi-language feature has been removed from this project.
// This file is kept as a no-op stub so that any existing imports
// across the codebase do not throw "cannot find module" errors.
// The LanguageProvider simply renders children unchanged.
// useLanguage returns a fixed English locale — nothing breaks.

import { createContext, useContext } from 'react';

const LanguageContext = createContext({
    language: 'en',
    setLanguage: () => {},
    t: (key) => key,
    supportedLanguages: [{ code: 'en', label: 'English' }],
});

export const LanguageProvider = ({ children }) => children;

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
