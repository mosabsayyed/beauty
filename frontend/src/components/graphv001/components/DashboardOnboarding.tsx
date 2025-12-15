import React, { useEffect, useRef } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// CSS for driver.js popovers to match theme (injected globally or via style block)
// We'll inject some custom styles for dark mode compatibility if needed
const DRIVER_THEME_STYLES = `
  /* Dark theme for popovers */
  .driver-popover.driverjs-theme {
    background-color: #1f2937;
    color: #f9fafb;
    border: 1px solid #374151;
    max-width: 500px;
  }
  .driver-popover.driverjs-theme .driver-popover-title {
    color: #FFD700; 
    font-size: 1.1rem;
    font-weight: 600;
  }
  .driver-popover.driverjs-theme .driver-popover-description {
    color: #f9fafb;
    font-size: 0.95rem;
    line-height: 1.5;
  }
  .driver-popover.driverjs-theme button {
    background-color: #374151;
    color: #f9fafb;
    border: 1px solid #4B5563;
    text-shadow: none;
  }
  .driver-popover.driverjs-theme button:hover {
    background-color: #4B5563;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn {
    background-color: #D97706;
    color: #111827;
    font-weight: 600;
    border: none;
  }
  .driver-popover.driverjs-theme button.driver-popover-next-btn:hover {
    background-color: #B45309;
  }
  
  /* Make popover more prominent */
  .driver-popover {
    z-index: 100001 !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* RTL support for Arabic */
  [dir="rtl"] .driver-popover {
    text-align: right;
  }
`;

interface DashboardOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onViewChange: (view: 'dashboard' | 'business_chains' | 'graph') => void;
  language?: 'en' | 'ar';
}

const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({ isOpen, onClose, isDark, onViewChange, language = 'en' }) => {
  const driverObj = useRef<any>(null);
  const isRTL = language === 'ar';

  useEffect(() => {
    // Inject styles
    const styleId = 'driver-theme-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = DRIVER_THEME_STYLES;
      document.head.appendChild(style);
    }

    // Initialize driver - using default overlay settings for proper element highlighting
    driverObj.current = driver({
      showProgress: true,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 8,
      onDestroyStarted: () => {
         onViewChange('dashboard'); // Reset to dashboard on close
         onClose();
         driverObj.current.destroy();
      },
      popoverClass: isDark ? 'driverjs-theme' : '',
      steps: [
        {
          element: '#onboarding-intro-target',
          popover: {
            side: 'over',
            align: 'center',
            title: isRTL ? 'سيناريو التحول' : 'The Transformation Scenario',
            description: isRTL ? `
              <div dir="rtl" style="text-align: right;">
                <p>هذا عرض توضيحي لرحلة تحول جهة حكومية على مدى 5 سنوات. تمت إضافة البيانات بناءً على <strong>خطط مستقبلية</strong>.</p>
                <p>تم توجيه الذكاء الاصطناعي للتعامل مع البيانات المستقبلية على أنها "مخططة" حتى لو كانت نسبة الإنجاز ليست صفر.</p>
                <div style="background-color: rgba(255, 215, 0, 0.1); padding: 0.75rem; border-radius: 0.375rem; border-right: 4px solid #F59E0B; margin-top: 1rem;">
                  <p style="margin: 0; font-size: 0.85rem;">توفر مؤشرات لوحة المعلومات مدخلات من جلسة <strong>التخطيط الاستراتيجي</strong>. هذا يمكّن <strong>زر الصحة</strong> من إجراء تحليل للخطط الجديدة مقابل الخطط الحالية.</p>
                </div>
              </div>
            ` : `
              <div class="space-y-4">
                <p>This is a demo of an agency's 5-year transformation journey. The data was added based on <strong>future data being planned</strong>.</p>
                <p>The AI is instructed to look at future data as "planned" (even if the % of completion is not 0) so that the simulation runs effectively.</p>
                <div style="background-color: rgba(255, 215, 0, 0.1); padding: 0.75rem; border-radius: 0.375rem; border-left: 4px solid #F59E0B; margin-top: 1rem;">
                  <p style="margin: 0; font-size: 0.85rem;">The dashboard indicators provide inputs from a <strong>Strategic Planning</strong> session. This enables the <strong>Health Button</strong> to perform an analysis of new plans vs. existing plans.</p>
                </div>
              </div>
            `
          }
        },
        {
          element: '#onboarding-intro-target',
          popover: {
            side: 'over',
            align: 'center',
            title: isRTL ? 'التفاعل مع الذكاء الاصطناعي وواقع البيانات' : 'AI Interaction & Data Reality',
            description: isRTL ? `
              <div dir="rtl" style="text-align: right;">
                <p>في <strong>منطقة المحادثة</strong>، يمكنك طرح أسئلة من زوايا وأدوار مختلفة، والتنقل في الأنطولوجيا باستخدام هياكل مألوفة.</p>
                <div style="background-color: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 0.375rem; border-right: 4px solid #EF4444; margin-top: 1rem;">
                  <p style="margin: 0; font-size: 0.85rem;"><strong>ملاحظة:</strong> بعض العلاقات مكسورة عمداً لنرى كيف يتعامل معها الذكاء الاصطناعي وينصح بإغلاقها.</p>
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; font-style: italic;">هذا السيناريو يحاكي واقع توفر البيانات.</p>
                </div>
              </div>
            ` : `
              <div class="space-y-4">
                <p>In the <strong>Chat Area</strong>, you can ask questions from different angles and roles, navigating the ontology using familiar setups and structures.</p>
                <div style="background-color: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 0.375rem; border-left: 4px solid #EF4444; margin-top: 1rem;">
                  <p style="margin: 0; font-size: 0.85rem;"><strong>NOTE:</strong> Some relations are broke intentionally to see how the AI handles them and advises on closing them.</p>
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; font-style: italic;">This scenario mimics the realities of data availability.</p>
                </div>
              </div>
            `
          }
        },
        {
          element: '#tour-health-panel',
          popover: {
            title: isRTL ? '8 مؤشرات استباقية' : '8 Leading Indicators',
            description: isRTL 
              ? `<div dir="rtl" style="text-align: right;"><p><strong>هذه ليست لوحة معلومات عادية.</strong> هذه المؤشرات الـ 8 (الثقافة، مشاركة الموظفين، التواصل مع المستثمرين، إلخ) هي <strong>علامات استباقية</strong> تتحول للأحمر قبل فشل المقاييس التشغيلية.</p>
              <p style="margin-top: 0.5rem;">البيانات موجودة في أنظمة الحكومة السعودية. الابتكار؟ <strong>ربطناها بشكل صحيح</strong> من خلال الأنطولوجيا.</p></div>`
              : `<p><strong>This isn't a typical dashboard.</strong> These 8 indicators (Culture, Employee Engagement, Investor Outreach, etc.) are <strong>leading markers</strong> that go red BEFORE operational metrics fail.</p>
              <p style="margin-top: 0.5rem;">The data exists in KSA gov systems (Adaa, etc.). The innovation? <strong>We wired them correctly</strong> through an ontology.</p>`
          },
          onHighlightStarted: () => {
            onViewChange('dashboard');
          }
        },
        {
          element: '#tour-views',
          popover: {
            title: isRTL ? 'ثلاث عدسات: سلاسل الأعمال' : 'Three Lenses: Business Chains',
            description: isRTL
              ? `<div dir="rtl" style="text-align: right;"><p>الآن لنرى عرض <strong>سلاسل الأعمال</strong>...</p>
              <p style="margin-top: 0.5rem;">يوضح هذا ما هي البيانات المتصلة وما هو مكسور → مما يساعدك على تحديد أولويات الحصول على البيانات و<em>لماذا تحتاجها</em>.</p></div>`
              : `<p>Now let's see the <strong>Business Chains</strong> view...</p>
              <p style="margin-top: 0.5rem;">This shows what data is connected and what's broken → helping you prioritize where to get data and <em>why you need it</em>.</p>`
          },
          onHighlightStarted: () => {
            setTimeout(() => onViewChange('business_chains'), 300);
          }
        },
        {
          element: '#onboarding-intro-target',
          popover: {
            side: 'over',
            align: 'center',
            title: isRTL ? 'عرض سلاسل الأعمال' : 'Business Chains View',
            description: isRTL
              ? `<div dir="rtl" style="text-align: right;"><p>هل ترى التدفق؟ الأهداف ← الأداء ← القدرات ← المشاريع.</p>
              <p style="margin-top: 0.5rem;">تكشف الاتصالات المكسورة عن نقاط البيانات المفقودة. الأنطولوجيا توضح لك <strong>لماذا</strong> تهم كل نقطة بيانات.</p></div>`
              : `<p>See the flow? Objectives → Performance → Capabilities → Projects.</p>
              <p style="margin-top: 0.5rem;">Broken connections reveal missing data points. The ontology shows you <strong>WHY</strong> each data point matters.</p>`
          }
        },
        {
          element: '#tour-views',
          popover: {
            title: isRTL ? 'ثلاث عدسات: الرسم البياني ثلاثي الأبعاد' : 'Three Lenses: 3D Graph',
            description: isRTL
              ? `<div dir="rtl" style="text-align: right;"><p>أخيراً، عرض <strong>الرسم البياني ثلاثي الأبعاد</strong>...</p>
              <p style="margin-top: 0.5rem;">كنت تعلم دائماً أن البيانات الحكومية معقدة. الآن <em>شاهد مدى تعقيدها</em>.</p></div>`
              : `<p>Finally, the <strong>3D Graph</strong> view...</p>
              <p style="margin-top: 0.5rem;">You always knew government data is complex. Now <em>see how complex</em>.</p>`
          },
          onHighlightStarted: () => {
            setTimeout(() => onViewChange('graph'), 300);
          }
        },
        {
          element: '#onboarding-intro-target',
          popover: {
            side: 'over',
            align: 'center',
            title: isRTL ? 'تصور قاعدة بيانات الرسم البياني' : 'Graph Database Visualization',
            description: isRTL
              ? `<div dir="rtl" style="text-align: right;"><p>هذه هي الأنطولوجيا الخاصة بك — كل عقدة، كل علاقة.</p>
              <p style="margin-top: 0.5rem;">اسحب للتدوير. قم بالتكبير. هذا التعقيد <strong>مُدار</strong> بواسطة قاعدة بيانات الرسم البياني، مما يجعله قابلاً للاستعلام والتحليل.</p></div>`
              : `<p>This is your ontology—every node, every relationship.</p>
              <p style="margin-top: 0.5rem;">Drag to rotate. Zoom in. This complexity is <strong>managed</strong> by the graph database, making it queryable and analyzable.</p>`
          }
        },
        {
          element: '#tour-analyze-btn',
          popover: {
            title: isRTL ? 'التخطيط الاستراتيجي من لوحة المعلومات' : 'Strategic Planning FROM Your Dashboard',
            description: isRTL
              ? `<div dir="rtl" style="text-align: right;"><p><strong>لم تسمع عن التخطيط الاستراتيجي من لوحة معلومات؟</strong> معظم اللوحات تراقب الماضي فقط.</p>
              <p style="margin-top: 0.5rem;">هنا، اختر سنة مستقبلية (2026+)، انقر على <strong>الصحة</strong>، وسيحلل الذكاء الاصطناعي خططك مقابل الأنطولوجيا — محدداً المخاطر من المؤشرات الاستباقية وينصح بالتعديلات.</p>
              <p style="margin-top: 0.5rem;"><em>التخطيط للأمام، وليس النظر للخلف فقط. بديهي.</em></p></div>`
              : `<p><strong>Never heard of strategic planning from a dashboard?</strong> Most dashboards just monitor the past.</p>
              <p style="margin-top: 0.5rem;">Here, select a future year (2026+), click <strong>Health</strong>, and the AI analyzes your plans against the ontology—identifying risks from leading indicators and advising adjustments.</p>
              <p style="margin-top: 0.5rem;"><em>Planning forward, not just looking back. Intuitive.</em></p>`
          },
          onHighlightStarted: () => {
            onViewChange('dashboard');
          }
        }
      ]
    });
  }, [isDark, onClose, onViewChange, isRTL, language]);

  useEffect(() => {
    if (isOpen && driverObj.current) {
      onViewChange('dashboard'); // Ensure we start on dashboard
      setTimeout(() => {
        driverObj.current.drive();
      }, 100);
    }
  }, [isOpen, onViewChange]);

  // Render a centered placeholder for intro steps to target (enables overlay)
  // Must be visible (not opacity:0) for driver.js to render overlay
  return (
    <div 
      id="onboarding-intro-target"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '1px',
        height: '1px',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: isOpen ? 99998 : -1,
        visibility: isOpen ? 'visible' : 'hidden'
      }}
    />
  );
};

export default DashboardOnboarding;
