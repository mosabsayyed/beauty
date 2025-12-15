import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../types';
import { Label } from '../components/ui/label';
import { CheckCircle2 } from 'lucide-react';
// Use public logo asset instead of figma: URI (build can't handle figma: scheme)
import { register as apiRegister, signInWithProvider } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';
const josoorLogo = '/icons/josoor.svg';


interface LoginPageProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onSkip?: () => void;
  onLogin?: () => void;
}

export function LoginPage({ language: propLanguage, onLanguageChange, onSkip, onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const content = {
    en: {
      title: 'Welcome to JOSOOR',
      subtitle: 'Your Gateway to Cognitive Transformation',
      whyRegister: 'Why Register?',
      free: 'Registration is FREE & Optional',
      purpose: 'Purpose',
      purposeDesc: 'Save your session with Noor, track learning progress, and preserve work artifacts you create.',
      whatYouGet: 'What This Section Offers',
      features: [
        'Live Transformation Simulation',
        'Re-imagined True-Intelligence Dashboards',
        'Full Multi-Media Body of Knowledge',
        'ٍSoveriegn compliant with KSA Policies',
        'Working Space for UC 001'
      ],
      login: 'Login',
      register: 'Register',
      email: 'Email Address',
      password: 'Password',
      name: 'Full Name',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      switchToRegister: 'Register here',
      switchToLogin: 'Login here',
      skip: 'Skip and Continue as Guest',
      submit: 'Continue',
      or: 'OR',
      socialLoginCaption: 'Sign in quickly using Google',
      socialRegisterCaption: 'Register quickly using Google'
    },
    ar: {
      title: 'مرحباً بكم في جسور',
      subtitle: 'بوابتك إلى التحول المعرفي',
      whyRegister: 'لماذا التسجيل؟',
      free: 'التسجيل مجاني واختياري',
      purpose: 'الهدف',
      purposeDesc: 'احفظ جلستك مع نور، تتبع تقدم التعلم، واحتفظ بنتائج العمل التي تنشئها.',
      whatYouGet: 'ما يقدمه هذا القسم',
      features: [
        'محاكاة مباشرة للتحول',
        'لوحات معلومات ذكيةأعيد تخيلها',
        'جسم معرفي غني بالوسائط المتعددة',
        'خصوصية تامة متوافقة مع المعايير السعودية',
        'بيئة عمل متكاملة لتوأم مؤسستك'
      ],
      login: 'تسجيل الدخول',
      register: 'التسجيل',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم الكامل',
      noAccount: 'ليس لديك حساب؟',
      haveAccount: 'لديك حساب بالفعل؟',
      switchToRegister: 'سجل هنا',
      switchToLogin: 'سجل دخولك هنا',
      skip: 'تخطي والمتابعة كضيف',
      submit: 'متابعة',
      or: 'أو',
      socialLoginCaption: 'سجّل الدخول بسرعة باستخدام Google',
      socialRegisterCaption: 'سجّل حسابًا جديدًا بسرعة باستخدام Google'
    }
  };

  // Use global LanguageContext so Header toggle syncs with Login page
  const { language: contextLanguage, setLanguage: setContextLanguage } = useLanguage();
  
  // Fallback to prop or context
  const language = (propLanguage as Language) || contextLanguage;
  const t = content[language];

  const auth = useAuth();

  // Sync local toggle with global context
  const setLanguageState = (newLang: Language) => {
    setContextLanguage(newLang);
    try { localStorage.setItem('josoor_language', newLang); } catch {}
    if (onLanguageChange) onLanguageChange(newLang);
  };

  // Inject CSS for the split layout - RTL-aware
  const isRTL = language === 'ar';
  useEffect(() => {
    // For RTL (Arabic): gradient goes 270deg (dark on right)
    // For LTR (English): gradient goes 90deg (dark on left)
    const gradientDirection = isRTL ? '270deg' : '90deg';
    const css = `
      .login-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        /* create the split background colors - RTL-aware */
        background: linear-gradient(${gradientDirection}, #0F172A 50%, #FFFFFF 50%);
        font-family: var(--component-font-family), 'Inter', sans-serif;
        font-style: normal;
        position: relative;
      }

      /* Background Image Overlay - RTL-aware */
      .login-container::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('/att/landing-screenshots/vector_login.svg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        pointer-events: none;
        background-size: 100% 100%;
        z-index: 1;
        opacity: 0.3;
        ${isRTL ? 'transform: scaleX(-1);' : ''}
      }
      
      /* LEFT SIDE: HERO CONTENT WRAPPER */
      .login-hero {
        width: 50%;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center; 
        padding: 60px;
        color: white; 
        z-index: 2; 
      }
      
      .hero-content {
        position: relative;
        width: 100%;
        max-width: 480px; 
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left; 
      }

      /* Middle section (Features) - Center vertically */
      .hero-middle {
        margin: auto 0;
      }

      /* RIGHT SIDE: FORM WRAPPER */
      .login-form-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 40px;
        background: transparent; 
        position: relative;
        z-index: 2; 
        /* Ensure text is standard dark on the white side */
        color: #111827;
      }

      .login-card {
        width: 100%;
        max-width: 440px;
        padding: 32px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #fff;
        border-radius: 16px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }
      
      /* Override text colors for Right Side to be Dark */
      .login-card h2 { color: #111827 !important; }
      .login-card p { color: #4B5563 !important; }
      .login-card label { color: #374151 !important; }

      .form-input {
        width: 100%;
        padding: 12px 16px;
        background: #F8FAFC;
        border: 1px solid #000000; /* Black border */
        border-radius: 6px;
        color: #0F172A;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
        font-family: inherit;
      }

      .form-input:focus {
        border-color: var(--component-text-accent);
        box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
      }

      .submit-btn {
        width: 100%;
        padding: 14px;
        background-color: var(--component-text-accent);
        color: var(--component-text-on-accent);
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: opacity 0.2s;
        margin-top: 10px;
        font-family: inherit;
      }
      .submit-btn:hover { opacity: 0.9; }

      .google-btn {
        width: 100%;
        padding: 12px;
        background: white;
        color: #374151;
        border: 1px solid #000000; /* Black border */
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: background 0.2s;
        font-family: inherit;
      }
      .google-btn:hover { background: #F9FAFB; }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        width: 100%;
        justify-content: flex-start;
      }

      @media (max-width: 1024px) {
        .login-container { 
          background: #FFFFFF; 
          flex-direction: column;
          overflow-y: auto;
        }
        .login-hero { display: none; }
        .login-form-container { width: 100%; padding: 20px; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [isRTL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backup guest conversations to avoid accidental removal during login (safety net)
      try {
        const guestConvos = localStorage.getItem('josoor_guest_conversations');
        if (guestConvos) {
          localStorage.setItem('josoor_guest_conversations_backup', guestConvos);
        }
      } catch (err) {
        // ignore
      }
      if (isRegistering) {
        await apiRegister(email, password, name || undefined);
      }
      await auth.login(email, password);
      try {
        if (onLogin) {
          onLogin();
        } else {
          try { localStorage.setItem('josoor_authenticated', 'true'); } catch {}
        }
      } catch {
        // ignore localStorage errors
      }
      if (!onLogin) navigate('/chat', { replace: true });
    } catch (err: any) {
      alert(`Authentication error: ${err?.message || String(err)}`);
    }
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="login-container">
      <Header />
      
      {/* Language Toggle - Fixed position top-right */}
      <button
        onClick={() => {
          const newLang = language === 'en' ? 'ar' : 'en';
          setLanguageState(newLang);
          try { localStorage.setItem('josoor_language', newLang); } catch {}
          if (onLanguageChange) onLanguageChange(newLang);
        }}
        style={{
          position: 'fixed',
          top: '20px',
          [language === 'ar' ? 'left' : 'right']: '20px',
          zIndex: 100,
          padding: '8px 16px',
          background: '#1F2937',
          border: '2px solid #D97706',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
        title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
      >
        <span>{language === 'en' ? '🇸🇦' : '🇬🇧'}</span>
        <span>{language === 'en' ? 'AR' : 'EN'}</span>
      </button>

      {/* LEFT PANEL: BRANDING / HERO */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.8 }}
        className="login-hero"
      >
        {/* Branding Content */}
        <div className="hero-content">
          <img src={josoorLogo} alt="JOSOOR" style={{ width: '80px', marginBottom: '32px', filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.5))' }} />
          <h1 style={{ fontSize: '48px', fontWeight: 700, margin: '0 0 16px 0', lineHeight: 1.1 }}>{t.title}</h1>
          <p style={{ fontSize: '20px', color: '#E5E7EB', lineHeight: 1.5, maxWidth: '400px' }}>{t.subtitle}</p>
        </div>

        <div className="hero-content hero-middle">
          <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--component-text-accent)', marginBottom: '24px' }}>{t.whatYouGet}</h3>
          <div style={{ width: '100%' }}>
            {t.features.map((feature, i) => (
              <div key={i} className="feature-item">
                <CheckCircle2 size={24} color="#FFD700" />
                <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-content" style={{ fontSize: '13px', color: '#9CA3AF' }}>
          © 2025 AI Twin Tech. All rights reserved.
        </div>
      </motion.div>

      {/* RIGHT PANEL: FORM */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.8, delay: 0.2 }}
        className="login-form-container"
      >
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {/* Mobile Logo */}
            <div style={{ display: 'none' }} className="mobile-logo">
               <img src={josoorLogo} alt="JOSOOR" style={{ width: '60px', margin: '0 auto 16px' }} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: '8px' }}>
              {isRegistering ? t.register : t.login}
            </h2>
            <p style={{ color: 'var(--component-text-secondary)' }}>
              {isRegistering ? t.free : t.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isRegistering && (
              <div>
                <Label htmlFor="name" style={{ display: 'block', marginBottom: '8px', color: 'var(--component-text-primary)' }}>{t.name}</Label>
                <input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="form-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: 'var(--component-text-primary)' }}>{t.email}</Label>
              <input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="form-input"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: 'var(--component-text-primary)' }}>{t.password}</Label>
              <input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="form-input"
                dir="ltr"
              />
            </div>

            <button type="submit" className="submit-btn">
              {t.submit}
            </button>
          </form>

          <div style={{ marginTop: '32px' }}>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#E5E7EB' }}></div>
              <span style={{ position: 'relative', background: '#FFFFFF', padding: '0 10px', color: '#6B7280', fontSize: '14px' }}>{t.or}</span>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                className="google-btn"
                onClick={() => signInWithProvider('google').catch((err) => alert(err.message || String(err)))}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px' }} />
                <span>
                  {isRegistering ? (language === 'ar' ? 'سجّل باستخدام Google' : 'Register with Google') : (language === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google')}
                </span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px' }}>
            <span style={{ color: '#4B5563' }}>
              {isRegistering ? t.haveAccount : t.noAccount}
            </span>
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)} 
              style={{ background: 'none', border: 'none', color: 'var(--component-text-accent)', fontWeight: 600, cursor: 'pointer', marginLeft: '8px' }}
            >
              {isRegistering ? t.switchToLogin : t.switchToRegister}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
