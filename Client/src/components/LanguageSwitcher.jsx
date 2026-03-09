import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
    const { language, setLanguage, t, supportedLanguages } = useLanguage();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '6px 10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
        }}>
            <label htmlFor="bye-language" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                {t('common.language')}
            </label>

            <select
                id="bye-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                }}
            >
                {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSwitcher;
