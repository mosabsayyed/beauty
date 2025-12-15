import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('josoor_theme');
      if (stored === 'light') return 'light';
    } catch (e) {}
    return 'dark';
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    const el = document.documentElement;
    // Always set explicit theme attribute so CSS theme selectors work predictably
    if (theme === 'light') {
      el.setAttribute('data-theme', 'light');
    } else {
      el.setAttribute('data-theme', 'dark');
    }
    try {
      localStorage.setItem('josoor_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const { language } = useLanguage();
  const translations = language === 'ar' ? ar : en;

  return (
    <button
      aria-label={translations.toggle_color_theme}
      title={theme === 'dark' ? translations.switch_to_light_mode : translations.switch_to_dark_mode}
      className="theme-toggle"
      onClick={toggle}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span style={{ fontSize: 13 }}>{theme === 'dark' ? translations.dark : translations.light}</span>
    </button>
  );
}
