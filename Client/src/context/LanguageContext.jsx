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
