import { useState, useEffect } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImage from 'figma:asset/b8cb315aa51767ca721aed58d9a7e9bddafcb634.png';

interface NavigationProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Navigation({ language, onLanguageChange }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const t = content[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: '/', label: t.nav.home, type: 'route' as const },
    { id: '/experience', label: t.nav.twinLife, type: 'route' as const },
    { id: '/coffee', label: language === 'en' ? 'Chat Over Coffee' : 'دردشة على قهوة', type: 'route' as const },
    { id: '/origins', label: language === 'en' ? 'Origins' : 'الأصول', type: 'route' as const }
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${ 
        isScrolled ? 'shadow-2xl' : ''
      }`}
      style={{ 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderTop: 'none',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center h-20 bg-[rgba(229,73,73,0)]">
          {/* Logo - Absolute Left */}
          <button 
            onClick={() => navigate('/')}
            className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} flex items-center hover:opacity-80 transition-opacity ${
              language === 'ar' ? 'space-x-reverse gap-4' : 'gap-4'
            }`}
          >
            <img src={logoImage} alt="AI Twin Tech" className="h-19 w-auto object-contain" />
            <div className="text-[#1A2435]">AI Twin Tech</div>
          </button>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-12">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`transition-colors ${
                  location.pathname === item.id
                    ? 'text-[#1A2435]'
                    : 'text-[#1A2435]/70 hover:text-[#1A2435]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Language Toggle - Absolute Right */}
          <div className={`hidden md:flex items-center gap-3 absolute ${language === 'ar' ? 'left-0' : 'right-0'}`}>
            <span className={`text-[#1A2435] transition-opacity ${language === 'en' ? 'opacity-100' : 'opacity-50'}`}>
              EN
            </span>
            <Switch
              checked={language === 'ar'}
              onCheckedChange={(checked) => onLanguageChange(checked ? 'ar' : 'en')}
              className="data-[state=checked]:bg-[#1A2435] data-[state=unchecked]:bg-[#1A2435]/30"
            />
            <span className={`text-[#1A2435] transition-opacity ${language === 'ar' ? 'opacity-100' : 'opacity-50'}`}>
              ع
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden absolute ${language === 'ar' ? 'left-0' : 'right-0'} text-[#1A2435] p-2`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-t border-[#1A2435]/10"
          >
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.id
                      ? 'bg-[#1A2435]/10 text-[#1A2435]'
                      : 'text-[#1A2435]/70 hover:bg-[#1A2435]/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              <div className="flex items-center justify-between w-full px-4 py-2">
                <span className="text-[#1A2435]/70">{language === 'en' ? 'اللغة / Language' : 'Language / اللغة'}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-[#1A2435] transition-opacity ${language === 'en' ? 'opacity-100' : 'opacity-50'}`}>
                    EN
                  </span>
                  <Switch
                    checked={language === 'ar'}
                    onCheckedChange={(checked) => {
                      onLanguageChange(checked ? 'ar' : 'en');
                      setIsMobileMenuOpen(false);
                    }}
                    className="data-[state=checked]:bg-[#1A2435] data-[state=unchecked]:bg-[#1A2435]/30"
                  />
                  <span className={`text-[#1A2435] transition-opacity ${language === 'ar' ? 'opacity-100' : 'opacity-50'}`}>
                    ع
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
