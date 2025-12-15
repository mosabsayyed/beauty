import React from 'react';
// @ts-ignore
import ArchitectureRedesigned from '../ArchitectureRedesigned';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ProductRoadmap() {
  const { language, isRTL } = useLanguage();
  
  const containerStyle: React.CSSProperties = {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: 'var(--component-text-primary, #F9FAFB)',
    fontFamily: 'var(--font-sans, "Inter", sans-serif)',
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    background: isRTL 
      ? 'linear-gradient(270deg, #FFFFFF 0%, #FFD700 100%)'
      : 'linear-gradient(90deg, #FFFFFF 0%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: isRTL ? '0' : '-0.5px'
  };

  const subheaderStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.8',
    color: 'var(--component-text-secondary, #9CA3AF)',
    marginBottom: '40px',
    maxWidth: '800px'
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  // Bilingual content
  const content = {
    header: {
      en: 'Product Roadmap & Architecture',
      ar: 'خارطة طريق المنتج والهيكل التقني'
    },
    subheader: {
      en: 'A transparent view of the system\'s technical architecture and future development plans. This architecture enables the autonomous analytical capabilities of the platform.',
      ar: 'رؤية شفافة للهيكل التقني للنظام وخطط التطوير المستقبلية. هذا الهيكل يمكّن القدرات التحليلية المستقلة للمنصة.'
    },
    devPhases: {
      en: 'Development Phases',
      ar: 'مراحل التطوير'
    },
    phase1: {
      label: { en: 'Phase 1', ar: 'المرحلة ١' },
      title: { en: 'Foundation & Branding', ar: 'الأساس والهوية' },
      items: [
        { en: 'Landing Page Conversion & Logic', ar: 'تحويل ومنطق صفحة الهبوط' },
        { en: 'Routing & Auth Flow Security', ar: 'أمان التوجيه وتدفق المصادقة' },
        { en: 'Login Page Redesign', ar: 'إعادة تصميم صفحة تسجيل الدخول' },
        { en: 'Database Sanitization', ar: 'تنظيف قاعدة البيانات' }
      ]
    },
    phase2: {
      label: { en: 'Phase 2 (Active)', ar: 'المرحلة ٢ (نشطة)' },
      title: { en: 'Core Product & Content', ar: 'المنتج الأساسي والمحتوى' },
      items: [
        { en: 'Strategic Planning Dashboard', ar: 'لوحة التخطيط الاستراتيجي' },
        { en: 'Twin Knowledge Base Content', ar: 'محتوى قاعدة معرفة التوأم' },
        { en: 'Interactive Business Chains', ar: 'سلاسل الأعمال التفاعلية' },
        { en: 'Chat Context & Visualizations', ar: 'سياق المحادثة والتصورات' }
      ]
    },
    phase3: {
      label: { en: 'Phase 3', ar: 'المرحلة ٣' },
      title: { en: 'Advanced Architecture', ar: 'الهيكل المتقدم' },
      items: [
        { en: '4-Bank Memory Architecture', ar: 'هندسة الذاكرة رباعية البنوك' },
        { en: 'MCP Router (3 Instances)', ar: 'موجه MCP (٣ نسخ)' },
        { en: 'Role-Based Access Control', ar: 'التحكم في الوصول حسب الدور' },
        { en: 'Multi-LLM Orchestration', ar: 'تنسيق نماذج اللغة المتعددة' }
      ]
    }
  };

  const t = (obj: { en: string; ar: string }) => language === 'ar' ? obj.ar : obj.en;

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>{t(content.header)}</h1>
      <p style={subheaderStyle}>{t(content.subheader)}</p>
      
      {/* Development Phases */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', color: '#F9FAFB' }}>
          {t(content.devPhases)}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Phase 1 */}
            <div style={{ ...cardStyle, padding: '24px' }}>
                <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t(content.phase1.label)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#F9FAFB' }}>
                  {t(content.phase1.title)}
                </h3>
                <ul style={{ paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0', color: '#D1D5DB', fontSize: '14px', lineHeight: '1.6' }}>
                    {content.phase1.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}>{t(item)}</li>
                    ))}
                </ul>
            </div>

            {/* Phase 2 (Active) */}
            <div style={{ ...cardStyle, padding: '24px', border: '1px solid rgba(255, 215, 0, 0.3)', background: 'rgba(255, 215, 0, 0.05)' }}>
                <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t(content.phase2.label)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#F9FAFB' }}>
                  {t(content.phase2.title)}
                </h3>
                <ul style={{ paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0', color: '#E5E7EB', fontSize: '14px', lineHeight: '1.6' }}>
                    {content.phase2.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}>{t(item)}</li>
                    ))}
                </ul>
            </div>

            {/* Phase 3 */}
            <div style={{ ...cardStyle, padding: '24px' }}>
                <div style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {t(content.phase3.label)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#F9FAFB' }}>
                  {t(content.phase3.title)}
                </h3>
                <ul style={{ paddingLeft: isRTL ? '0' : '20px', paddingRight: isRTL ? '20px' : '0', color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>
                    {content.phase3.items.map((item, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}>{t(item)}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div style={cardStyle}>
        <ArchitectureRedesigned />
      </div>
    </div>
  );
}
