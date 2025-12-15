
export interface LandingPageData {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: string;
  buttonText: { en: string; ar: string };
}

export const LANDING_PAGES: Record<string, LandingPageData> = {
  knowledge: {
    id: 'knowledge',
    title: {
      en: 'Twin Knowledge',
      ar: 'علوم التوأمة'
    },
    description: {
      en: 'The playbook inside the system. Chapters, episodes, and podcasts that explain the mechanics of transformation.',
      ar: 'دليل التشغيل داخل النظام. فصول وحلقات وبودكاست تشرح آليات التحول.'
    },
    icon: '/icons/twin.svg',
    buttonText: {
      en: 'Open Knowledge Base',
      ar: 'فتح قاعدة المعرفة'
    }
  },
  demo: {
    id: 'demo',
    title: {
      en: 'Strategic Planning',
      ar: 'التخطيط الاستراتيجي'
    },
    description: {
      en: 'Executive health view across engagement, efficiency, risk, and delivery—driven by the same Twin Noor reads. Compare your data against 5 years of historical patterns.',
      ar: 'نظرة تنفيذية شاملة عبر المشاركة والكفاءة والمخاطر والتسليم - مدعومة بنفس التوأم الذي يقرأه نور. قارن بياناتك مع 5 سنوات من الأنماط التاريخية.'
    },
    icon: '/icons/demo.svg',
    buttonText: {
      en: 'Launch Dashboard',
      ar: 'تشغيل لوحة القيادة'
    }
  },
  architecture: {
    id: 'architecture',
    title: {
      en: 'Product Roadmap',
      ar: 'خارطة طريق المنتج'
    },
    description: {
      en: 'View the technical architecture and structure for full transparency. Understand the multi-agent LLM ecosystem and cognitive core.',
      ar: 'عرض الهيكل الفني والبنية لشفافية كاملة. فهم نظام الوكلاء المتعددين والجوهر المعرفي.'
    },
    icon: '/icons/architecture.svg',
    buttonText: {
      en: 'View Architecture',
      ar: 'عرض الهيكلية'
    }
  },
  approach: {
    id: 'approach',
    title: {
      en: 'Plan Your Journey',
      ar: 'خطط رحلتك'
    },
    description: {
      en: 'A proposed, tailorable journey for AI adoption. From 90-day quick wins to long-term business case realization.',
      ar: 'رحلة مقترحة وقابلة للتخصيص لتبني الذكاء الاصطناعي. من المكاسب السريعة في 90 يومًا إلى تحقيق دراسة الجدوى على المدى الطويل.'
    },
    icon: '/icons/approach.svg',
    buttonText: {
      en: 'Start Planning',
      ar: 'ابدأ التخطيط'
    }
  }
};
