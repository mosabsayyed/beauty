import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';
import { Mail } from 'lucide-react';

export default function ContactUsPage() {
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Contact Us',
      subtitle: 'We are here to help you with your transformation journey.',
      emailLabel: 'Email Us',
      description: 'For inquiries, partnerships, or support, please reach out to us directly.',
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'نحن هنا لمساعدتك في رحلة التحول الخاصة بك.',
      emailLabel: 'راسلنا عبر البريد الإلكتروني',
      description: 'للاستفسارات أو الشراكات أو الدعم، يرجى التواصل معنا مباشرة.',
    }
  };

  const content = t[language];
  const isRTL = language === 'ar';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111827', 
      color: '#F9FAFB',
      fontFamily: isRTL ? '"Cairo", sans-serif' : '"Inter", sans-serif',
      paddingTop: '80px'
    }}>
      <Header />
      
      <main style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '80px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 80px)'
      }} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <div style={{ 
            background: 'rgba(31, 41, 55, 0.6)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '24px', 
            padding: '48px', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '16px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '50%',
              marginBottom: '24px'
            }}>
              <Mail size={48} color="#3B82F6" />
            </div>
            
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', fontFamily: isRTL ? '"Tajawal", sans-serif' : 'inherit' }}>{content.title}</h1>
            <p style={{ color: '#9CA3AF', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6' }}>
              {content.subtitle}
            </p>

            <div style={{ 
              background: 'rgba(17, 24, 39, 0.5)', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {content.emailLabel}
              </p>
              <a 
                href="mailto:info@aitwintech.com" 
                style={{ 
                  fontSize: '24px', 
                  color: '#FFD700', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FCD34D'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FFD700'}
              >
                info@aitwintech.com
              </a>
            </div>

            <p style={{ marginTop: '32px', color: '#6B7280', fontSize: '14px' }}>
              {content.description}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
