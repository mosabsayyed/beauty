import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      aria-label="Toggle language"
      title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className="language-toggle"
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      {/* Show target language (what you'd switch TO) */}
      <span style={{ fontSize: 14 }}>{language === 'en' ? '🇸🇦' : '🇬🇧'}</span>
      <span>{language === 'en' ? 'AR' : 'EN'}</span>
    </button>
  );
}
