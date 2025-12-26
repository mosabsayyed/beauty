import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageToggle from '../LanguageToggle';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const t = {
    betaText: language === 'en'
      ? 'Welcome to JOSOOR - Agentic Enterprise Platform - Invite Only for Public Sector'
      : 'مرحباً بك في جسور - منصة المؤسسات الوكيلة - دعوة فقط للقطاع العام',
    founder: language === 'en' ? 'Founder Letter' : 'رسالة المؤسس',
    contact: language === 'en' ? 'Contact Us' : 'اتصل بنا',
    login: language === 'en' ? 'Beta Login' : 'تسجيل الدخول',
    dashboard: language === 'en' ? 'Dashboard' : 'لوحة القيادة',
    settings: language === 'en' ? 'Settings' : 'الإعدادات',
    logout: language === 'en' ? 'Sign Out' : 'تسجيل الخروج',
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 40px',
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#F9FAFB',
      fontFamily: language === 'ar' ? '"Cairo", sans-serif' : '"Inter", sans-serif',
    }}>
      {/* Left: Logo & Beta Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title={language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
        >
          <img 
            src="/att/cube/logo-aitwintech.svg" 
            alt="AI Twin Tech" 
            style={{ height: '32px', width: 'auto' }} 
          />
        </button>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#D1D5DB',
          borderLeft: '1px solid #374151',
          paddingLeft: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {t.betaText}
        </span>
      </div>

      {/* Right: Navigation & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
          <button 
            onClick={() => navigate('/founder-letter')}
            style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
          >
            {t.founder}
          </button>
          <button 
            onClick={() => navigate('/contact-us')}
            style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
          >
            {t.contact}
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '30px',
                  padding: '6px 16px 6px 6px',
                  cursor: 'pointer',
                  color: '#F9FAFB',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827'
                }}>
                  <User size={16} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.full_name?.split('|')[0] || user.email?.split('@')[0] || 'User'}</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </button>

              {/* RICH DROPDOWN MENU */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '280px',
                  background: 'rgba(31, 41, 55, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  padding: '8px',
                  zIndex: 1001
                }}>
                  {/* User Info Header */}
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#FFD700', marginBottom: '4px' }}>
                      {user.full_name?.split('|')[0] || 'Authenticated User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => { navigate('/chat'); setShowUserMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#E5E7EB', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LayoutDashboard size={16} color="#FFD700" />
                      {t.dashboard}
                    </button>
                    
                    <button 
                      onClick={() => { setShowUserMenu(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#E5E7EB', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings size={16} color="#9CA3AF" />
                      {t.settings}
                    </button>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }}></div>

                    <button 
                      onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                      <LogOut size={16} />
                      {t.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: '1px solid #FFD700',
                color: '#FFD700',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFD700';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#FFD700';
              }}
            >
              {t.login}
            </button>
          )}
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
