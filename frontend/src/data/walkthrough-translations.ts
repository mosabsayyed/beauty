/**
 * Walkthrough Tutorial Translations
 * 
 * IMPORTANT: This file contains all the translations for the Noor walkthrough tutorial.
 * The Arabic translations here are AI-generated and may need refinement.
 * Please review and update the Arabic text as needed for accuracy and naturalness.
 */

export const walkthroughTranslations = {
  steps: [
    {
      en: {
        title: 'Welcome to Noor AI',
        description: 'Noor is your AI guide through the TwinLife experience. This quick tutorial will show you how to navigate and make the most of this platform.',
        highlight: 'header' as const
      },
      ar: {
        title: 'مرحباً بك في نور AI',
        description: 'نور هو دليلك بالذكاء الاصطناعي عبر تجربة التوأمة الحية. سيوضح لك هذا البرنامج التعليمي السريع كيفية التنقل وتحقيق أقصى استفادة من هذه المنصة.',
        highlight: 'header' as const
      }
    },
    {
      en: {
        title: 'Choose Your Persona',
        description: 'Noor has 4 different modes:\n\n✨ Assistant - General guidance\n📊 Analyst - Data insights\n🛠️ Designer - Build use cases\n📚 Educator - Learn concepts\n\nClick any icon to switch modes!',
        highlight: 'personas' as const
      },
      ar: {
        title: 'اختر شخصيتك',
        description: 'نور لديها 4 أوضاع مختلفة:\n\n✨ مساعد - توجيه عام\n📊 محلل - رؤى البيانات\n🛠️ مصمم - بناء حالات الاستخدام\n📚 معلم - تعلم المفاهيم\n\nانقر على أي أيقونة للتبديل بين الأوضاع!',
        highlight: 'personas' as const
      }
    },
    {
      en: {
        title: 'Chat with Noor',
        description: 'Type your questions or requests in the chat area. Noor understands natural language in both English and Arabic.\n\nTry asking about:\n• Transformation simulations\n• Executive dashboards\n• TwinScience knowledge\n• Building your own use case',
        highlight: 'chat' as const
      },
      ar: {
        title: 'تحدث مع نور',
        description: 'اكتب أسئلتك أو طلباتك في منطقة الدردشة. نور يفهم اللغة الطبيعية باللغتين الإنجليزية والعربية.\n\nجرب السؤال عن:\n• محاكاة التحول\n• لوحات التحكم التنفيذية\n• معرفة TwinScience\n• بناء حالة الاستخدام الخاصة بك',
        highlight: 'chat' as const
      }
    },
    {
      en: {
        title: 'The Dynamic Canvas',
        description: 'When you request something specific, Noor opens a dynamic canvas on the right side.\n\nThe canvas shows:\n• Live simulations\n• Interactive dashboards\n• Knowledge chapters\n• Use case builders\n\nYou can expand/minimize it anytime!',
        highlight: 'canvas' as const
      },
      ar: {
        title: 'اللوحة الديناميكية',
        description: 'عندما تطلب شيئًا محددًا، تفتح نور لوحة ديناميكية على الجانب الأيمن.\n\nتعرض اللوحة:\n• محاكاة مباشرة\n• لوحات تحكم تفاعلية\n• فصول المعرفة\n• منشئي حالات الاستخدام\n\nيمكنك توسيعها/تصغيرها في أي وقت!',
        highlight: 'canvas' as const
      }
    },
    {
      en: {
        title: 'Quick Action Buttons',
        description: 'Use the quick action buttons below the chat input for instant access to key features:\n\n🔮 Experience Transformation\n📊 View Dashboard\n📚 Learn TwinScience\n🛠️ Build Use Case\n\nThese appear when you start a new session.',
        highlight: 'actions' as const
      },
      ar: {
        title: 'أزرار الإجراءات السريعة',
        description: 'استخدم أزرار الإجراءات السريعة أسفل إدخال الدردشة للوصول الفوري إلى الميزات الرئيسية:\n\n🔮 اختبر التحول\n📊 اعرض لوحة التحكم\n📚 تعلم TwinScience\n🛠️ ابنِ حالة الاستخدام\n\nتظهر هذه عند بدء جلسة جديدة.',
        highlight: 'actions' as const
      }
    },
    {
      en: {
        title: 'Start New Conversations',
        description: 'You can start fresh conversations at any time. Your previous sessions are saved (if you\'re logged in).\n\nTip: Each persona mode remembers context, so your conversation flows naturally as you explore different areas!',
        highlight: 'none' as const
      },
      ar: {
        title: 'ابدأ محادثات جديدة',
        description: 'يمكنك بدء محادثات جديدة في أي وقت. يتم حفظ جلساتك السابقة (إذا كنت مسجلاً للدخول).\n\nنصيحة: كل وضع شخصية يتذكر السياق، لذا تتدفق محادثتك بشكل طبيعي أثناء استكشافك لمناطق مختلفة!',
        highlight: 'none' as const
      }
    }
  ],
  buttons: {
    en: {
      previous: 'Previous',
      next: 'Next',
      skip: 'Skip Tutorial',
      getStarted: 'Get Started',
      stepCounter: (current: number, total: number) => `Step ${current} of ${total}`
    },
    ar: {
      previous: 'السابق',
      next: 'التالي',
      skip: 'تخطي البرنامج التعليمي',
      getStarted: 'ابدأ',
      stepCounter: (current: number, total: number) => `الخطوة ${current} من ${total}`
    }
  }
};
