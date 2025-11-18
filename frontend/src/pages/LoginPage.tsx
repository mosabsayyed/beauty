import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
// Use public logo asset instead of figma: URI (build can't handle figma: scheme)
import { register as apiRegister, signInWithProvider } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
const josoorLogo = '/logo192.png';


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
      title: 'Welcome to TwinLife',
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
        'Working Space for Your Organization\'s First DT Use Case'
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
      or: 'OR'
    },
    ar: {
      title: 'مرحباً بك في التوأمة الحية',
      subtitle: 'بوابتك إلى التحول الإدراكي',
      whyRegister: 'لماذا التسجيل؟',
      free: 'التسجيل مجاني واختياري',
      purpose: 'الهدف',
      purposeDesc: 'احفظ جلستك مع نور، تتبع تقدم التعلم، واحتفظ بنتائج العمل التي تنشئها.',
      whatYouGet: 'ما يقدمه هذا القسم',
      features: [
        'محاكاة التحول المباشرة',
        'لوحات معلومات الذكاء الحقيقي المعاد تصورها',
        'مجموعة معرفية متعددة الوسائط بالكامل',
        'مساحة عمل لحالة الاستخدام الأولى للتوأم الرقمي في مؤسستك'
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
      or: 'أو'
    }
  };

  // Resolve language: prefer prop, then localStorage, then default 'en'
  const [languageState, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('josoor_language');
      return (propLanguage as Language) || (saved as Language) || 'en';
    } catch {
      return (propLanguage as Language) || 'en';
    }
  });

  const language = (propLanguage as Language) || languageState;
  const t = content[language];

  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img src={josoorLogo} alt="JOSOOR" style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))' }} />
            </div>
            <h1 className="mb-3">{t.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
          </motion.div>

          {/* Two Column Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 32,
              maxWidth: 1100,
              margin: '0 auto',
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
          
          {/* Left Column - Information */}
          <motion.div initial={{ opacity: 0, x: language === 'ar' ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={language === 'ar' ? 'lg:col-start-2' : ''}>
            <Card className="card-base" style={{ padding: 24 }}>
              <div className="space-y-6">
                
                <div>
                  <h2 className="text-primary-dark mb-3">{t.whyRegister}</h2>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#D4AF37]/10 to-[#B8960F]/10 border border-[#D4AF37]/30 mb-4">
                    <p className="text-[#1A2435]">{t.free}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[#D4AF37] mb-2">{t.purpose}</h3>
                  <p className="text-slate-700">{t.purposeDesc}</p>
                </div>

                <div>
                  <h3 className="text-[#D4AF37] mb-4">{t.whatYouGet}</h3>
                  <div className="space-y-3">
                    {t.features.map((feature, i) => (
                      <div key={i} className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>

          {/* Right Column - Login/Register Form */}
          <motion.div initial={{ opacity: 0, x: language === 'ar' ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={language === 'ar' ? 'lg:col-start-1 lg:row-start-1' : ''}>
            <Card className="card-base" style={{ padding: 24 }}>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                
                <div className="text-center mb-6">
                  <h2 className="text-primary-dark mb-2">
                    {isRegistering ? t.register : t.login}
                  </h2>
                </div>

                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#1A2435]">{t.name}</Label>
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" dir={language === 'ar' ? 'rtl' : 'ltr'} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1A2435]">{t.email}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" dir="ltr" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#1A2435]">{t.password}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" dir="ltr" />
                </div>

                <Button type="submit" className="btn-primary" style={{ width: '100%' }}>{t.submit}</Button>

                <div className="text-center">
                  <p className="text-slate-600 text-sm mb-2">
                    {isRegistering ? t.haveAccount : t.noAccount}
                  </p>
                  <button type="button" onClick={() => setIsRegistering(!isRegistering)} style={{ color: 'var(--color-gold)', background: 'transparent', border: 'none', cursor: 'pointer' }}>{isRegistering ? t.switchToLogin : t.switchToRegister}</button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">{t.or}</span>
                  </div>
                </div>

                {/* Social sign in buttons */}
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <Button type="button" className="btn-social" style={{ width: '100%' }} onClick={() => {
                    // Google OAuth
                    signInWithProvider('google').catch((err) => alert(err.message || String(err)));
                  }}>Continue with Google</Button>
                  <Button type="button" className="btn-social" style={{ width: '100%' }} onClick={() => {
                    // Apple OAuth (iPhone)
                    signInWithProvider('apple').catch((err) => alert(err.message || String(err)));
                  }}>Continue with Apple</Button>
                </div>

                <Button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => {
                  if (onSkip) return onSkip();
                  try { localStorage.setItem('josoor_authenticated', 'true'); } catch {}
                  navigate('/chat', { replace: true });
                }}>{t.skip}</Button>

              </form>
            </Card>
          </motion.div>

          </div>
        </div>
      </div>
      
      
    </div>
  );
}
