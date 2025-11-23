import { useState, useEffect } from 'react';
import { Globe, LogOut, User } from 'lucide-react';
import { Language } from '../types';
import { QuickActionsMenu } from '../components/noor/QuickActionsMenu';
import { NoorUniversalPortal } from '../components/NoorUniversalPortal';
import { NoorWalkthrough } from '../components/NoorWalkthrough';
import { Switch } from '../components/ui/switch';

interface TwinXperiencePageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isAuthenticated: boolean;
}

export function TwinLifePage({ language, onLanguageChange, isAuthenticated }: TwinXperiencePageProps) {
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    try {
      const hasSeenWalkthrough = localStorage.getItem('josoor_walkthrough_seen');
      return !hasSeenWalkthrough;
    } catch {
      return true;
    }
  });

  // beforeunload prompt for anonymous users
  useEffect(() => {
    if (!isAuthenticated) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = language === 'en' 
          ? 'Your work is not saved. If you want to return to it, please register.'
          : 'عملك غير محفوظ. إذا كنت تريد العودة إليه، يرجى التسجيل.';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [isAuthenticated, language]);

  const handleLogout = () => {
    localStorage.removeItem('josoor_authenticated');
    window.location.href = '/';
  };

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
    try {
      localStorage.setItem('josoor_walkthrough_seen', 'true');
    } catch {
      // localStorage not available
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* HEADER: Minimal - Language + Login/Logout */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-[#1A2435]">JOSOOR</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{language === 'en' ? 'Noor Portal' : 'بوابة نور'}</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex items-center gap-3">
            <span className={`text-sm transition-opacity ${language === 'en' ? 'opacity-100' : 'opacity-50'}`}>
              EN
            </span>
            <Switch
              checked={language === 'ar'}
              onCheckedChange={(checked) => onLanguageChange(checked ? 'ar' : 'en')}
              className="data-[state=checked]:bg-[#1A2435] data-[state=unchecked]:bg-[#1A2435]/30"
            />
            <span className={`text-sm transition-opacity ${language === 'ar' ? 'opacity-100' : 'opacity-50'}`}>
              ع
            </span>
          </div>

          {/* Login/Logout */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-[#1A2435] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {language === 'en' ? 'Logout' : 'تسجيل الخروج'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                {language === 'en' ? 'Guest Mode' : 'وضع الضيف'}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN: Sidebar (Quick Actions) + Noor Portal */}
      <main className="flex-1 flex overflow-hidden">
        {/* Quick Actions Sidebar */}
        <aside className={`border-${language === 'ar' ? 'l' : 'r'} border-gray-200 bg-white overflow-y-auto`}>
          <QuickActionsMenu 
            language={language}
            onActionClick={(command) => {
              // TODO: Wire to Noor chat
              console.log('Quick action clicked:', command);
            }}
          />
        </aside>

        {/* Noor Universal Portal */}
        <div className="flex-1 relative">
          <NoorUniversalPortal language={language} />
        </div>
      </main>

      {/* FOOTER: Thin row */}
      <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-center px-6">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>© 2025 AI Twin Tech</span>
          <span>•</span>
          <a href="#" className="hover:text-[#1A2435] transition-colors">
            {language === 'en' ? 'Privacy' : 'الخصوصية'}
          </a>
          <span>•</span>
          <a href="#" className="hover:text-[#1A2435] transition-colors">
            {language === 'en' ? 'Terms' : 'الشروط'}
          </a>
          <span>•</span>
          <a href="#" className="hover:text-[#1A2435] transition-colors">
            {language === 'en' ? 'Contact' : 'اتصل'}
          </a>
        </div>
      </footer>

      {/* Walkthrough (first-time visitors) */}
      {showWalkthrough && (
        <NoorWalkthrough 
          language={language}
          onClose={handleWalkthroughComplete}
        />
      )}
    </div>
  );
}