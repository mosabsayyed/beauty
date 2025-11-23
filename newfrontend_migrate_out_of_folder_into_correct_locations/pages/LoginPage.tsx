import { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Footer } from '../components/Footer';
const josoorLogo = 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Fefbe50adfc8743cfa8a2c93570680bae';

interface LoginPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSkip: () => void;
  onLogin: () => void;
}

export function LoginPage({ language, onLanguageChange, onSkip, onLogin }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Inject responsive CSS similar to the requested diff
  useEffect(() => {
    const css = `
      @media (max-width: 991px) {
        .login-card-left { background-color: rgba(0,0,0,1) !important; color: #fff !important; }
        .login-title { color: #fff !important; }
        .login-subtitle { color: #fff !important; }
        .feature-icon, svg { stroke: rgb(255,255,255) !important; color: rgb(255,255,255) !important; }
        .login-form { display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
        .label-col { width: 30% !important; }
        .input-field { margin-left: 10px !important; }
        .helper-box { background-color: rgba(0,0,0,1) !important; width: 50% !important; height: 100% !important; }
        .features-list { display: flex !important; flex-direction: row !important; }
        .feature-text { margin-left: 20px !important; width: 100% !important; }
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-generated', 'login-responsive');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

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

  const t = content[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - in production, this would call an API
    onLogin();
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <img 
                src={josoorLogo} 
                alt="JOSOOR" 
                className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              />
            </div>
            <h1 className="text-primary-dark mb-3">{t.title}</h1>
            <p className="text-slate-600">{t.subtitle}</p>
          </motion.div>

          {/* Two Column Layout */}
          <div className={`grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto ${language === 'ar' ? 'lg:grid-flow-dense' : ''}`}>
          
          {/* Left Column - Information */}
          <motion.div
            id="login-page"
            initial={{ opacity: 0, x: language === 'ar' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={language === 'ar' ? 'lg:col-start-2' : ''}
          >
            <Card className="p-8 bg-white border-2 border-[#1A2435]/10 h-full login-card-left" style={{ padding: 24 }}>
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
                      <div key={i} className={`flex items-start gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''} features-list`}>
                        <CheckCircle2 className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5 feature-icon" />
                        <span className="text-slate-700 feature-text">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>

          {/* Right Column - Login/Register Form */}
          <motion.div
            initial={{ opacity: 0, x: language === 'ar' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={language === 'ar' ? 'lg:col-start-1 lg:row-start-1' : ''}
          >
            <Card className="p-8 bg-white border-2 border-[#D4AF37]/30">
              <form onSubmit={handleSubmit} className="login-form" style={{ display: 'grid', gap: 16 }}>
                
                <div className="text-center mb-6">
                  <h2 className="text-primary-dark mb-2">
                    {isRegistering ? t.register : t.login}
                  </h2>
                </div>

                {isRegistering && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#1A2435]">{t.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-[#1A2435]/20 focus:border-[#D4AF37]"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>
                )}

                <div className="space-y-2" style={{ display: 'flex', alignItems: 'center' }}>
                  <Label htmlFor="email" className="text-[#1A2435] label-col">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-[#1A2435]/20 focus:border-[#D4AF37] input-field"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2" style={{ display: 'flex', alignItems: 'center' }}>
                  <Label htmlFor="password" className="text-[#1A2435] label-col">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-[#1A2435]/20 focus:border-[#D4AF37] input-field"
                    dir="ltr"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#1A2435] to-[#1A2435]/90 hover:from-[#1A2435]/90 hover:to-[#1A2435]/80 text-white"
                >
                  {t.submit}
                </Button>

                <div className="text-center">
                  <p className="text-slate-600 text-sm mb-2">
                    {isRegistering ? t.haveAccount : t.noAccount}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[#D4AF37] hover:text-[#B8960F] transition-colors"
                  >
                    {isRegistering ? t.switchToLogin : t.switchToRegister}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">{t.or}</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  onClick={onSkip}
                  variant="outline"
                  className="w-full border-[#1A2435]/30 text-[#1A2435] hover:bg-[#1A2435]/5"
                >
                  {t.skip}
                </Button>

              </form>
            </Card>
          </motion.div>

          </div>
        </div>
      </div>

      <div className="helper-box" style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginTop: 20, height: 200 }} />

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
