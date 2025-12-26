import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { supabase } from '../lib/supabaseClient';

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    graphMaturity: '',
    digitalTwinMaturity: '',
    aiMaturity: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Construct compound data for full_name since we lack specific columns in the replica
      // Format: "Name | Org: Organization | G:Level T:Level A:Level"
      const richFullName = `${formData.name} | Org: ${formData.organization} | Graph:${formData.graphMaturity} Twin:${formData.digitalTwinMaturity} AI:${formData.aiMaturity}`;

      // 2. Insert into users_pending
      const { data, error } = await supabase
        .from('users_pending')
        .insert([
          { 
            email: formData.email,
            password: 'pending-approval-' + Date.now(), // Dummy password for required field
            full_name: richFullName,
            role: 'user',
            is_active: false // Flagged as inactive as requested
          }
        ]);

      if (error) throw error;

      // 3. Success Feedback
      alert(language === 'en' 
        ? 'Request received! You have been added to the pending list. We will review and email you shortly.' 
        : 'تم استلام طلبك! تمت إضافتك إلى قائمة الانتظار. سنقوم بالمراجعة ومراسلتك قريباً.');
        
      // Reset form
      setFormData({
        name: '',
        email: '',
        organization: '',
        graphMaturity: '',
        digitalTwinMaturity: '',
        aiMaturity: ''
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      alert(language === 'en' 
        ? 'Error submitting request. Please try again or contact support.' 
        : 'خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.');
    }
  };

  const t = {
    hero: {
      title: language === 'en' ? 'Meet Noor, your Cognitive Twin guide.' : 'تعرف على نور، دليلك للتوأم الإدراكي.',
      subtitle: language === 'en' ? 'Ask in plain language. Noor answers in your operating model.' : 'اسأل بلغة بسيطة. نور يجيب من خلال نموذج التشغيل الخاص بك.',
      bullets: language === 'en' ? [
        'Start with simple prompts like "Show me digital transformation progress" or "Generate Q4 2024 report."',
        'No technical jargon, no Cypher—just your business language.'
      ] : [
        'ابدأ بمطالبات بسيطة مثل "أرني تقدم التحول الرقمي" أو "أنشئ تقرير الربع الرابع 2024".',
        'لا مصطلحات تقنية، لا Cypher—فقط لغة عملك.'
      ]
    },
    strategic: {
      title: language === 'en' ? 'Turn a question into a strategic brief.' : 'حول السؤال إلى موجز استراتيجي.',
      subtitle: language === 'en' ? "From 'What is happening?' to 'What should we do?' in one conversation." : "من 'ماذا يحدث؟' إلى 'ماذا يجب أن نفعل؟' في محادثة واحدة.",
      bullets: language === 'en' ? [
        'Reads your Digital Twin, not just a static report.',
        'Explains why a deviation matters and which levers to pull.',
        'Everything is traceable back to objectives, KPIs, policies, and risks.'
      ] : [
        'يقرأ توأمك الرقمي، وليس مجرد تقرير ثابت.',
        'يشرح سبب أهمية الانحراف وما هي الروافع التي يجب سحبها.',
        'كل شيء قابل للتتبع وصولاً إلى الأهداف ومؤشرات الأداء الرئيسية والسياسات والمخاطر.'
      ]
    },
    lenses: {
      title: language === 'en' ? 'One reality, three lenses.' : 'واقع واحد، ثلاث عدسات.',
      subtitle: language === 'en' ? 'The Cognitive Twin is visual and analytical, not just chat.' : 'التوأم الإدراكي مرئي وتحليلي، وليس مجرد دردشة.',
      panels: [
        {
          caption: language === 'en' ? 'Dashboards (Indicators)' : 'لوحات المعلومات (المؤشرات)',
          desc: language === 'en' ? 'Executive health view across engagement, efficiency, risk, and delivery—driven by the same Twin Noor reads.' : 'نظرة تنفيذية شاملة عبر المشاركة والكفاءة والمخاطر والتسليم - مدعومة بنفس التوأم الذي يقرأه نور.'
        },
        {
          caption: language === 'en' ? 'Chains (Ontology)' : 'السلاسل (الأنطولوجيا)',
          desc: language === 'en' ? 'See how objectives, citizens, policy tools, risks, and reports actually connect across your sector.' : 'شاهد كيف تتصل الأهداف والمواطنين وأدوات السياسة والمخاطر والتقارير فعلياً عبر قطاعك.'
        },
        {
          caption: language === 'en' ? '3D Graph' : 'الرسم البياني ثلاثي الأبعاد',
          desc: language === 'en' ? 'Explore thousands of nodes and relationships—clusters of culture, performance, or risk—inside a single view.' : 'استكشف آلاف العقد والعلاقات - مجموعات الثقافة أو الأداء أو المخاطر - داخل عرض واحد.'
        }
      ]
    },
    knowledge: {
      title: language === 'en' ? 'Twin Knowledge: the playbook inside the system.' : 'علم التوأم: دليل التشغيل داخل النظام.',
      subtitle: language === 'en' ? 'Chapters, episodes, and podcasts that explain the mechanics of transformation.' : 'فصول وحلقات وبودكاست تشرح آليات التحول.',
      bullets: language === 'en' ? [
        'Structured episodes that map your public sector ontology and transformation logic.',
        'Illustrative videos and podcasts embedded next to the content.',
        'Comment and discuss inside the same workspace.'
      ] : [
        'حلقات منظمة ترسم أنطولوجيا القطاع العام ومنطق التحول.',
        'فيديوهات توضيحية وبودكاست مدمجة بجانب المحتوى.',
        'علق وناقش داخل نفس مساحة العمل.'
      ]
    },
    hood: {
      title: language === 'en' ? 'Under the hood: Saudi-built cognitive architecture.' : 'تحت الغطاء: بنية إدراكية مبنية في السعودية.',
      subtitle: language === 'en' ? 'Multi-agent LLM ecosystem, knowledge graph, and governance in one view.' : 'نظام بيئي متعدد الوكلاء (LLM)، رسم بياني للمعرفة، وحوكمة في عرض واحد.',
      callouts: [
        {
          label: language === 'en' ? 'LLM Ecosystem' : 'نظام LLM البيئي',
          text: language === 'en' ? 'Reasoning, agentic workflows, and feeders tuned for your use cases.' : 'الاستدلال، وسير العمل الوكيل، والمغذيات المضبوطة لحالات الاستخدام الخاصة بك.'
        },
        {
          label: language === 'en' ? 'Cognitive Core' : 'الجوهر الإدراكي',
          text: language === 'en' ? 'Knowledge Graph + embeddings + relational data forming the Digital Twin.' : 'رسم بياني للمعرفة + التضمينات + البيانات العلائقية التي تشكل التوأم الرقمي.'
        },
        {
          label: language === 'en' ? 'Operations & Governance' : 'العمليات والحوكمة',
          text: language === 'en' ? 'Public policy performance, compliance, risk analysis, classification, and AI ethics anchored in the same model.' : 'أداء السياسة العامة، الامتثال، تحليل المخاطر، التصنيف، وأخلاقيات الذكاء الاصطناعي الراسخة في نفس النموذج.'
        }
      ]
    },
    health: {
      title: language === 'en' ? 'Know the health of your transformation at a glance.' : 'اعرف صحة تحولك بلمحة.',
      subtitle: language === 'en' ? 'No more hunting through decks and systems. One Twin, one view.' : 'لا مزيد من البحث في العروض والأنظمة. توأم واحد، عرض واحد.',
      bullets: language === 'en' ? [
        'Health scores vs plan for all key indicators.',
        'Executive summary generated by Noor on demand.',
        'Filter by year/quarter with a single click.'
      ] : [
        'درجات الصحة مقابل الخطة لجميع المؤشرات الرئيسية.',
        'ملخص تنفيذي ينشئه نور عند الطلب.',
        'تصفية حسب السنة/الربع بنقرة واحدة.'
      ]
    },
    workspace: {
      title: language === 'en' ? 'A workspace, not just a demo.' : 'مساحة عمل، وليست مجرد عرض توضيحي.',
      subtitle: language === 'en' ? 'Save sessions with Noor, track learning, and keep your artifacts.' : 'احفظ الجلسات مع نور، تتبع التعلم، واحتفظ بمصنوعاتك.',
      bullets: language === 'en' ? [
        'Registration is free and by invite during beta.',
        'Preserve analyses, dashboards, and Twin Knowledge you generate.',
        'Or continue as guest for a guided walkthrough.'
      ] : [
        'التسجيل مجاني وعن طريق الدعوة خلال الفترة التجريبية.',
        'احفظ التحليلات ولوحات المعلومات وعلم التوأم الذي تنشئه.',
        'أو استمر كضيف للحصول على جولة إرشادية.'
      ]
    },
    invite: {
      title: language === 'en' ? 'Request access to the Noor Cognitive Twin beta.' : 'اطلب الوصول إلى النسخة التجريبية من نور التوأم الإدراكي.',
      bullets: language === 'en' ? [
        'Designed for KSA public sector entities and national institutions.',
        'We onboard a limited number of agencies to ensure deep integration.',
        'We\'ll review your use case and contact you with next steps.'
      ] : [
        'مصمم لكيانات القطاع العام والمؤسسات الوطنية في المملكة العربية السعودية.',
        'نقوم بضم عدد محدود من الوكالات لضمان التكامل العميق.',
        'سنراجع حالة الاستخدام الخاصة بك ونتواصل معك بالخطوات التالية.'
      ],
      form: {
        name: language === 'en' ? 'Full Name' : 'الاسم الكامل',
        email: language === 'en' ? 'Work Email' : 'بريد العمل الإلكتروني',
        org: language === 'en' ? 'Organization / Entity' : 'المنظمة / الكيان',
        graph: language === 'en' ? "How do you rank your organization's maturity in Graph Technology?" : 'كيف تصنف نضج منظمتك في تقنية الرسم البياني؟',
        twin: language === 'en' ? "How do you rank your organization's maturity in Digital Twins?" : 'كيف تصنف نضج منظمتك في التوائم الرقمية؟',
        ai: language === 'en' ? "How do you rank your organization's maturity in AI Adoption?" : 'كيف تصنف نضج منظمتك في تبني الذكاء الاصطناعي؟',
        select: language === 'en' ? 'Select an option' : 'اختر خياراً',
        options: language === 'en' ? ['Low (Just starting)', 'Medium (Some implementation)', 'High (Fully integrated)'] : ['منخفض (بدأ للتو)', 'متوسط (بعض التنفيذ)', 'عالٍ (متكامل تماماً)'],
        submit: language === 'en' ? 'Request Invite' : 'طلب دعوة'
      }
    },
    footer: {
      rights: language === 'en' ? '© 2025 JOSOOR. All rights reserved.' : '© 2025 جسور. جميع الحقوق محفوظة.'
    }
  };

  // Inject CSS for the landing page
  useEffect(() => {
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');
      
      :root {
        --component-bg-primary: #111827;
        --component-panel-bg: rgba(31, 41, 55, 0.6); /* Glass effect increased */
        --component-panel-border: rgba(255, 255, 255, 0.1);
        --component-text-primary: #F9FAFB;
        --component-text-secondary: #D1D5DB;
        --component-text-muted: #9CA3AF;
        --component-text-accent: #FFD700;
        --component-text-on-accent: #111827;
      }

      html, body {
        overflow-y: auto !important; /* FORCE SCROLLING */
        height: auto !important;
        min-height: 100vh;
      }

      .landing-page {
        background: var(--component-bg-primary);
        color: var(--component-text-primary);
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
        overflow-x: hidden;
        overflow-y: auto;
        line-height: 1.5;
        min-height: 100vh;
        position: relative;
      }
      
      /* Arabic Font Overrides */
      [dir="rtl"] .landing-page {
        font-family: "Cairo", "Segoe UI", "Roboto", sans-serif;
      }
      
      [dir="rtl"] .landing-page h1, 
      [dir="rtl"] .landing-page h2, 
      [dir="rtl"] .landing-page h3 {
        font-family: "Tajawal", "Segoe UI", "Roboto", sans-serif;
      }

      .landing-page * {
        box-sizing: border-box;
      }

      /* HERO SECTION */
      .hero-section {
        position: relative;
        width: 100%;
        font-weight: 400;
        justify-content: center;
        overflow-y: auto;
        padding-bottom: 60px;
        flex-direction: row;
        margin-bottom: 0px;
      }

      .hero-background-video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
        /* Fallback gradient if video fails */
        background: radial-gradient(circle at center, #1f2937 0%, #111827 100%);
      }
      
      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 24, 39, 0.5); /* Dimming overlay */
        z-index: 1;
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 800px;
        text-align: left;
        margin-left: 40px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 0 20px;
      }

      .hero-title {
        font: 48px/67.2px "Inter", sans-serif;
        color: #FFFFFF;
        margin-bottom: 24px;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
        width: auto;
        align-self: start;
        text-align: left;
      }

      .hero-subtitle {
        font: 400 20px/1.5 "Inter", sans-serif;
        color: #E5E7EB;
        margin-bottom: 40px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }

      .scroll-indicator {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
        animation: bounce 2s infinite;
        opacity: 0.7;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
        40% {transform: translateX(-50%) translateY(-10px);}
        60% {transform: translateX(-50%) translateY(-5px);}
      }

      #background-image {
        position: absolute;
        top: 85vh; /* Push vector down below hero */
        left: 50%;
        transform: translateX(-50%);
        width: 1278px;
        pointer-events: none;
        z-index: 0;
        display: block;
        opacity: 0.3;
      }

      #main-content {
        position: relative;
        z-index: 1;
        padding-top: 0;
      }

      section {
        padding: 100px 40px; /* Increased padding */
        position: relative;
        background: transparent;
      }

      section.content-centered {
        max-width: 1280px; /* Wider container */
        margin: 0 auto;
      }

      .section-content-box {
        background-color: var(--component-panel-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 40px;
        border-radius: 16px;
        border: 1px solid var(--component-panel-border);
        display: inline-block;
        width: 100%;
        transition: transform 0.3s ease;
      }

      .section-grid {
        display: grid;
        gap: 80px; /* Increased gap */
        align-items: center;
        grid-template-columns: 1fr 1fr;
      }

      .landing-page h1 {
        font: 700 56px/1.2 "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 24px;
      }

      .landing-page h2 {
        font: 700 42px/1.2 "Inter", sans-serif; /* Larger H2 */
        color: var(--component-text-primary);
        margin-bottom: 20px;
      }

      .subtitle {
        font: 400 18px/28px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-bottom: 32px;
        max-width: 700px;
      }

      .screenshot-container {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        /* Removed background color to ensure transparency */
        background: transparent; 
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;
      }
      
      .screenshot-container:hover {
        transform: translateY(-5px);
      }

      .screenshot-container img {
        width: 100%;
        height: auto;
        display: block;
      }

      .microcopy-bullets, .value-bullets {
        list-style: none;
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px; 
      }

      .microcopy-bullets li, .value-bullets li {
        font: 400 16px/24px "Inter", sans-serif; /* Slightly larger text */
        color: var(--component-text-secondary);
        padding-left: 28px;
        padding-right: 0;
        position: relative;
      }
      
      /* RTL support for bullets */
      [dir="rtl"] .microcopy-bullets li, [dir="rtl"] .value-bullets li {
        padding-left: 0;
        padding-right: 28px;
      }

      .microcopy-bullets li:before {
        content: "→";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .microcopy-bullets li:before {
        left: auto;
        right: 0;
        content: "←";
      }

      .value-bullets li:before {
        content: "✓";
        position: absolute;
        left: 0;
        color: var(--component-text-accent);
        font-weight: 600;
        font-size: 18px;
      }
      
      [dir="rtl"] .value-bullets li:before {
        left: auto;
        right: 0;
      }

      .three-panel-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 40px;
      }

      .panel {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        background: transparent;
      }

      .panel img {
        width: 100%;
        height: auto;
        display: block;
      }

      .panel-caption {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        padding: 12px 0;
        margin-top: 8px;
      }

      .panel-description {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        margin-top: 6px;
        line-height: 1.6;
      }

      .architecture-callouts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
        margin-top: 40px;
      }

      .callout {
        padding: 24px;
        background: rgba(31, 41, 55, 0.5);
        border-left: 3px solid var(--component-text-accent);
        border-radius: 6px;
      }
      
      [dir="rtl"] .callout {
        border-left: none;
        border-right: 3px solid var(--component-text-accent);
      }

      .callout-label {
        font: 600 14px/20px "Inter", sans-serif;
        color: var(--component-text-accent);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .callout-text {
        font: 400 13px/20px "Inter", sans-serif;
        color: var(--component-text-secondary);
        line-height: 1.6;
      }

      /* Form Styles */
      .invite-form {
        background: rgba(31, 41, 55, 0.5);
        border: 1px solid var(--component-panel-border);
        border-radius: 12px;
        padding: 40px;
        margin-top: 40px;
        display: grid;
        gap: 20px;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        text-align: left;
      }
      
      [dir="rtl"] .form-group {
        text-align: right;
      }

      .form-group label {
        font: 600 13px/18px "Inter", sans-serif;
        color: var(--component-text-primary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .form-group input, .form-group select {
        padding: 12px 16px;
        background: rgba(17, 24, 39, 0.8);
        border: 1px solid var(--component-panel-border);
        border-radius: 6px;
        color: var(--component-text-primary);
        font: 400 14px/20px "Inter", sans-serif;
        transition: all 0.2s ease;
      }

      .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: var(--component-text-accent);
        background: rgba(31, 41, 55, 0.9);
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
      }

      .button-primary {
        display: inline-block;
        padding: 14px 32px;
        background: var(--component-text-accent);
        color: var(--component-text-on-accent);
        border: none;
        border-radius: 6px;
        font: 600 16px/20px "Inter", sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        width: 100%;
        text-align: center;
      }

      .button-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
      }

      @media (max-width: 1024px) {
        .section-grid, .three-panel-strip, .architecture-callouts {
          grid-template-columns: 1fr;
        }
        h1 { font-size: 40px; line-height: 48px; }
        h2 { font-size: 32px; line-height: 40px; }
        .hero-title { font-size: 40px; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="landing-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* 
        HERO SECTION (NEW IN COMPREHENSIVE ROADMAP)
        Video disabled for now, using gradient placeholder 
        TODO: User to upload /public/att/hero.mp4
      */}
      <section className="hero-section">
        <video 
          className="hero-background-video"
          autoPlay 
          muted 
          loop 
          playsInline
          poster="/att/landing-screenshots/Vector.svg"
        >
          {/* <source src="/att/hero.mp4" type="video/mp4" /> */}
          {/* Using a placeholder gradient effect via CSS class for now */}
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            {language === 'en' ? (
              <div>
                Complex Transformation? Good, help is here, meet your Agentic TMO Team
              </div>
            ) : (
              <div>
                تحول معقد؟ حسناً، المساعدة هنا، التقابل فريق TMO الوكيل الخاص بك
              </div>
            )}
          </h1>
          <p className="hero-subtitle">{language === 'en' ? 'The world\'s first Cognitive Twin designed for national scale transformation.' : 'أول توأم إدراكي في العالم مصمم للتحول على نطاق وطني.'}</p>
        </div>
        <div className="scroll-indicator">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 13L12 18L17 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 6L12 11L17 6" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      <img id="background-image" src="/att/landing-screenshots/Vector.svg" alt="" />
      
      <div id="main-content">
        {/* SECTION 1: MEET NOOR */}
        <section className="content-centered">
          <div className="section-grid">
            <div className="section-content-box">
              <h2>{t.hero.title}</h2>
              <p className="subtitle">{t.hero.subtitle}</p>
              <ul className="microcopy-bullets">
                {t.hero.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
              </ul>
            </div>
            <div className="screenshot-container">
              <img src="/att/landing-screenshots/noor-welcome.png" alt="Noor welcome screen" />
            </div>
          </div>
        </section>

        {/* SECTION 2: STRATEGIC ANSWER */}
        <section className="content-centered">
          <div className="section-grid">
            <div className="screenshot-container">
              <img src="/att/landing-screenshots/strategic-planning.png" alt="Strategic Planning text answer" />
            </div>
            <div className="section-content-box">
              <h2>{t.strategic.title}</h2>
              <p className="subtitle">{t.strategic.subtitle}</p>
              <ul className="value-bullets">
                {t.strategic.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3: SEE THE TWIN */}
        <section className="content-centered">
          <div className="section-content-box">
            <h2>{t.lenses.title}</h2>
            <p className="subtitle">{t.lenses.subtitle}</p>
            <div className="three-panel-strip">
              {t.lenses.panels.map((panel, i) => (
                <div key={i}>
                  <div className="panel">
                    <img src={i === 0 ? "/att/landing-screenshots/indicators-dashboard.png" : i === 1 ? "/att/landing-screenshots/ontology-graph.png" : "/att/landing-screenshots/3d-graph.png"} alt={panel.caption} />
                  </div>
                  <div className="panel-caption">{panel.caption}</div>
                  <div className="panel-description">{panel.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: TWIN KNOWLEDGE */}
        <section className="content-centered">
          <div className="section-content-box">
            <div className="section-grid">
              <div>
                <h2>{t.knowledge.title}</h2>
                <p className="subtitle">{t.knowledge.subtitle}</p>
                <ul className="value-bullets">
                  {t.knowledge.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                </ul>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="screenshot-container">
                  <img src="/att/landing-screenshots/episode-1-1.png" alt="Episode 1.1" />
                </div>
                <div className="screenshot-container">
                  <img src="/att/landing-screenshots/episode-4-2-podcast.png" alt="Episode 4.2 + podcast" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: UNDER THE HOOD */}
        <section className="content-centered">
          <div className="section-content-box">
            <h2>{t.hood.title}</h2>
            <p className="subtitle">{t.hood.subtitle}</p>
            <div className="screenshot-container" style={{ margin: '40px 0' }}>
              <img src="/att/landing-screenshots/architecture-roadmap.png" alt="Product Roadmap / architecture map" />
            </div>
            <div className="architecture-callouts">
              {t.hood.callouts.map((callout, i) => (
                <div className="callout" key={i}>
                  <div className="callout-label">{callout.label}</div>
                  <div className="callout-text">{callout.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: DASHBOARDS IN PRACTICE */}
        <section className="content-centered">
          <div className="section-content-box">
            <div className="section-grid">
              <div>
                <h2>{t.health.title}</h2>
                <p className="subtitle">{t.health.subtitle}</p>
                <ul className="value-bullets">
                  {t.health.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                </ul>
              </div>
              <div className="screenshot-container">
                <img src="/att/landing-screenshots/indicators-dashboard.png" alt="Dashboards in practice" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: ACCOUNTS & WORKSPACE */}
        <section className="content-centered">
          <div className="section-content-box">
            <div className="section-grid">
              <div>
                <h2>{t.workspace.title}</h2>
                <p className="subtitle">{t.workspace.subtitle}</p>
                <ul className="value-bullets">
                  {t.workspace.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                </ul>
              </div>
              <div className="screenshot-container">
                <img src="/att/landing-screenshots/welcome-login.png" alt="Welcome to JOSOOR / login" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: REQUEST INVITE */}
        <section className="content-centered" id="section-invite">
          <div className="section-content-box" style={{ textAlign: 'center' }}>
            <h1>{t.invite.title}</h1>
            <ul className="value-bullets" style={{ alignItems: 'flex-start', maxWidth: '600px', margin: '40px auto' }}>
              {t.invite.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
            </ul>
            
            <form className="invite-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">{t.invite.form.name}</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t.invite.form.email}</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="organization">{t.invite.form.org}</label>
                <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label htmlFor="graphMaturity">{t.invite.form.graph}</label>
                <select id="graphMaturity" name="graphMaturity" value={formData.graphMaturity} onChange={handleInputChange} required>
                  <option value="">{t.invite.form.select}</option>
                  {t.invite.form.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="digitalTwinMaturity">{t.invite.form.twin}</label>
                <select id="digitalTwinMaturity" name="digitalTwinMaturity" value={formData.digitalTwinMaturity} onChange={handleInputChange} required>
                  <option value="">{t.invite.form.select}</option>
                  {t.invite.form.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="aiMaturity">{t.invite.form.ai}</label>
                <select id="aiMaturity" name="aiMaturity" value={formData.aiMaturity} onChange={handleInputChange} required>
                  <option value="">{t.invite.form.select}</option>
                  {t.invite.form.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              </div>

              <button type="submit" className="button-primary">{t.invite.form.submit}</button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '40px', textAlign: 'center', color: 'var(--component-text-muted)', fontSize: '14px' }}>
          <p>{t.footer.rights}</p>
        </footer>

      </div>
    </div>
  );
}
