export type Language = 'en' | 'ar';

export interface Episode {
  type: string;
  title: string;
  description: string;
  duration: string;
}

export interface Chapter {
  id: number;
  title: string;
  episodes: Episode[];
}

export const content: Record<Language, any> = {
  en: {
    nav: {
      home: 'Home',
      twinLife: 'TwinLife',
      twinScience: 'TwinScience',
      twinStudio: 'TwinStudio',
      founders: 'Founders Letter'
    },
    hero: {
      headline: 'Complex Transformation? Good. Let\'s show you how to make it your most valuable asset.',
      subtext: 'Josoor — The Digital Twin Platform powering the next era of Cognitive Government.',
      cta: 'Explore the Solution'
    },
    digitalTwin: {
      title: 'The Digital Twin Solution',
      subtitle: 'Complexity isn\'t chaos; it\'s structure waiting for coherence.',
      description: 'Digital twins bridge strategy and execution through live models. Josoor uses Azure DTDL 2.0 and GenAI reasoning for adaptive simulation.',
      quote: 'The future of transformation is not in better reporting—it\'s in systems that understand themselves.',
      points: [
        'Complexity isn\'t chaos; it\'s structure waiting for coherence',
        'Digital twins bridge strategy and execution through live models',
        'Real-time synchronization between vision and implementation',
        'Self-learning systems that evolve with your organization'
      ]
    },
    architecture: {
      title: 'The Josoor Architecture',
      subtitle: 'Designed for government-scale complexity. Built for interoperability.',
      description: 'Josoor enables coherence at national scale by bridging clients, systems, and AI vendors into one cognitive ecosystem.',
      tiers: {
        clients: 'Clients / Ministries / Enterprises',
        josoor: 'Josoor Platform (Bridge)',
        vendors: 'AI Vendors | Data Systems | Visualization Tools'
      },
      features: [
        'Government-scale complexity management',
        'Vendor-neutral integration layer',
        'Real-time coherence across ecosystems',
        'Standards-based interoperability'
      ]
    },
    systemsArchitect: {
      title: 'The Systems Architect Role',
      subtitle: 'We design the bridges that let intelligence flow.',
      description: 'AI Twin Tech is not another AI startup — we are the Systems Architect of Cognitive Government.',
      activities: [
        'Architect transformation ecosystems',
        'Supervise vendors (LLMs, Agents, Data Platforms)',
        'Maintain neutrality — integrator, not vendor',
        'Build human-AI collaboration frameworks'
      ],
      closing: 'Complexity is not your enemy. It\'s your most powerful resource — if you know how to architect it.'
    },
    twinScience: {
      title: 'TwinScience',
      subtitle: 'Knowledge Path',
      description: 'A collaborative knowledge environment for learning, sharing, and evolving the science of transformation.',
      chapters: [
        {
          id: 1,
          title: 'Foundations of Digital Twins',
          episodes: [
            {
              type: 'article',
              title: 'What is a Digital Twin?',
              description: 'Understanding the core concepts behind digital twin technology',
              duration: '8 min read'
            },
            {
              type: 'video',
              title: 'Digital Twins in Action',
              description: 'Visual guide to digital twin implementations',
              duration: '15 min'
            },
            {
              type: 'podcast',
              title: 'The Twin Revolution',
              description: 'Expert conversations on transformation',
              duration: '42 min'
            },
            {
              type: 'guide',
              title: 'Study Guide: Twin Fundamentals',
              description: 'Comprehensive learning resource',
              duration: '30 min'
            }
          ]
        },
        {
          id: 2,
          title: 'Cognitive Government',
          episodes: [
            {
              type: 'article',
              title: 'From Digital to Cognitive',
              description: 'The evolution of government transformation',
              duration: '10 min read'
            },
            {
              type: 'video',
              title: 'Cognitive Systems at Scale',
              description: 'How nations manage complexity',
              duration: '18 min'
            },
            {
              type: 'podcast',
              title: 'Vision 2030 and Beyond',
              description: 'Strategic alignment in practice',
              duration: '38 min'
            },
            {
              type: 'guide',
              title: 'Implementation Framework',
              description: 'Step-by-step transformation guide',
              duration: '45 min'
            }
          ]
        },
        {
          id: 3,
          title: 'Systems Architecture',
          episodes: [
            {
              type: 'article',
              title: 'The Integration Challenge',
              description: 'Building coherent ecosystems',
              duration: '12 min read'
            },
            {
              type: 'video',
              title: 'Architecture Principles',
              description: 'Designing for complexity',
              duration: '20 min'
            },
            {
              type: 'podcast',
              title: 'The Architect\'s Mindset',
              description: 'Thinking in systems',
              duration: '35 min'
            },
            {
              type: 'guide',
              title: 'Architecture Playbook',
              description: 'Patterns and practices',
              duration: '50 min'
            }
          ]
        },
        {
          id: 4,
          title: 'Agentic Ecosystems',
          episodes: [
            {
              type: 'article',
              title: 'Human-AI Collaboration',
              description: 'Designing agentic workflows',
              duration: '9 min read'
            },
            {
              type: 'video',
              title: 'AI Agents in Practice',
              description: 'Real-world implementations',
              duration: '16 min'
            },
            {
              type: 'podcast',
              title: 'The Agentic Future',
              description: 'Where are we heading?',
              duration: '40 min'
            },
            {
              type: 'guide',
              title: 'Building Your First Agent',
              description: 'Practical tutorial',
              duration: '60 min'
            }
          ]
        }
      ] as Chapter[]
    },
    twinStudio: {
      title: 'TwinStudio',
      subtitle: 'Builders Path',
      description: 'Experience a real digital twin powered by Noor, your AI assistant.',
      introAnimation: {
        title: 'Mastering Complexity',
        subtitle: 'Watch as order emerges from chaos'
      },
      chat: {
        placeholder: 'Ask Noor about your digital twin...',
        welcome: 'Hello! I\'m Noor, your AI assistant. I\'m here to help you explore digital twins and build your first transformation model. What would you like to know?',
        suggestions: [
          'What is a digital twin?',
          'How does Josoor work?',
          'Show me an example dataset',
          'Generate a transformation heatmap'
        ]
      }
    },
    founders: {
      title: 'Founders Letter',
      subtitle: 'Origins',
      letter: `The idea for Josoor didn't start with technology — it started with frustration.

We watched brilliant transformation initiatives crumble under their own complexity. Vision 2030 programs with thousands of interdependent initiatives, national strategies executed through fragmented systems, and talented teams drowning in spreadsheets instead of driving change.

The problem wasn't ambition. It was coherence.

Traditional tools — dashboards, Excel reports, manual PMOs — were built for a simpler era. They couldn't keep up with the scale, speed, and interconnectedness of modern transformation. We needed something fundamentally different.

That's when we discovered digital twins. Not as a metaphor, but as an architectural principle. What if we could mirror entire organizations into living, breathing digital models? Systems that understand themselves, that connect strategy to execution, that learn and adapt in real-time?

Josoor is that bridge. The cognitive transformation platform that turns complexity from a liability into an asset.

We're not an AI vendor. We're Systems Architects. We design the ecosystems that let intelligence flow — connecting ministries to AI models, strategies to data, humans to autonomous agents. We maintain neutrality, ensuring all components work together under one coherent design.

This is the era of Cognitive Government. Where nations don't just digitize — they think, adapt, and evolve.

Josoor is how we get there.

Welcome to the bridge.`,
      signature: 'The Founding Team, AI Twin Tech'
    },
    footer: {
      tagline: 'Turning complexity into your most valuable asset',
      copyright: '© 2025 AI Twin Tech. All rights reserved.',
      mission: 'Systems Architect of Cognitive Government'
    }
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      twinLife: 'التوأمة الحية',
      twinScience: 'علم التوأم',
      twinStudio: 'استوديو التوأم',
      founders: 'رسالة المؤسسين'
    },
    hero: {
      headline: 'تحول معقد؟ جيد. دعنا نريك كيف تجعله أقوى أصولك.',
      subtext: 'جسور — منصة التوأم الرقمي التي تقود عصر الحكومة الإدراكية الجديد.',
      cta: 'استكشف الحل'
    },
    digitalTwin: {
      title: 'حل التوأم الرقمي',
      subtitle: 'التعقيد ليس فوضى؛ إنه بنية تنتظر التماسك.',
      description: 'التوائم الرقمية تربط الاستراتيجية والتنفيذ من خلال نماذج حية. جسور يستخدم Azure DTDL 2.0 والذكاء الاصطناعي التوليدي للمحاكاة التكيفية.',
      quote: 'مستقبل التحول ليس في تقارير أفضل — بل في أنظمة تفهم نفسها.',
      points: [
        'التعقيد ليس فوضى؛ إنه بنية تنتظر التماسك',
        'التوائم الرقمية تربط الاستراتيجية والتنفيذ من خلال نماذج حية',
        'مزامنة في الوقت الفعلي بين الرؤية والتنفيذ',
        'أنظمة ذاتية التعلم تتطور مع مؤسستك'
      ]
    },
    architecture: {
      title: 'بنية جسور',
      subtitle: 'مصمم لتعقيد على نطاق حكومي. مبني للتشغيل البيني.',
      description: 'جسور يمكّن التماسك على نطاق وطني من خلال ربط العملاء والأنظمة وموردي الذكاء الاصطناعي في نظام إدراكي واحد.',
      tiers: {
        clients: 'العملاء / الوزارات / المؤسسات',
        josoor: 'منصة جسور (الجسر)',
        vendors: 'موردو الذكاء الاصطناعي | أنظمة البيانات | أدوات التصور'
      },
      features: [
        'إدارة التعقيد على نطاق حكومي',
        'طبقة تكامل محايدة للموردين',
        'تماسك في الوقت الفعلي عبر الأنظمة البيئية',
        'التشغيل البيني القائم على المعايير'
      ]
    },
    systemsArchitect: {
      title: 'دور مهندس الأنظمة',
      subtitle: 'نحن نصمم الجسور التي تسمح للذكاء بالتدفق.',
      description: 'AI Twin Tech ليست مجرد شركة ذكاء اصطناعي ناشئة — نحن مهندس أنظمة الحكومة الإدراكية.',
      activities: [
        'هندسة الأنظمة البيئية للتحول',
        'الإشراف على الموردين (نماذج اللغة، الوكلاء، منصات البيانات)',
        'الحفاظ على الحياد — مُدمج، وليس مورد',
        'بناء أطر عمل التعاون بين الإنسان والذكاء الاصطناعي'
      ],
      closing: 'التعقيد ليس عدوك. إنه أقوى مواردك — إذا كنت تعرف كيف تهندسه.'
    },
    twinScience: {
      title: 'علم التوأم',
      subtitle: 'مسار المعرفة',
      description: 'بيئة معرفية تعاونية للتعلم والمشاركة وتطوير علم التحول.',
      chapters: [
        {
          id: 1,
          title: 'أسس التوائم الرقمية',
          episodes: [
            {
              type: 'article',
              title: 'ما هو التوأم الرقمي؟',
              description: 'فهم المفاهيم الأساسية وراء تقنية التوأم الرقمي',
              duration: '8 دقائق قراءة'
            },
            {
              type: 'video',
              title: 'التوائم الرقمية في العمل',
              description: 'دليل مرئي لتطبيقات التوأم الرقمي',
              duration: '15 دقيقة'
            },
            {
              type: 'podcast',
              title: 'ثورة التوأم',
              description: 'محادثات الخبراء حول التحول',
              duration: '42 دقيقة'
            },
            {
              type: 'guide',
              title: 'دليل الدراسة: أساسيات التوأم',
              description: 'مورد تعليمي شامل',
              duration: '30 دقيقة'
            }
          ]
        },
        {
          id: 2,
          title: 'الحكومة الإدراكية',
          episodes: [
            {
              type: 'article',
              title: 'من الرقمي إلى الإدراكي',
              description: 'تطور تحول الحكومة',
              duration: '10 دقائق قراءة'
            },
            {
              type: 'video',
              title: 'الأنظمة الإدراكية على نطاق واسع',
              description: 'كيف تدير الدول التعقيد',
              duration: '18 دقيقة'
            },
            {
              type: 'podcast',
              title: 'رؤية 2030 وما بعدها',
              description: 'التوافق الاستراتيجي في الممارسة',
              duration: '38 دقيقة'
            },
            {
              type: 'guide',
              title: 'إطار التنفيذ',
              description: 'دليل التحول خطوة بخطوة',
              duration: '45 دقيقة'
            }
          ]
        },
        {
          id: 3,
          title: 'هندسة الأنظمة',
          episodes: [
            {
              type: 'article',
              title: 'تحدي التكامل',
              description: 'بناء أنظمة بيئية متماسكة',
              duration: '12 دقيقة قراءة'
            },
            {
              type: 'video',
              title: 'مبادئ الهندسة المعمارية',
              description: 'التصميم للتعقيد',
              duration: '20 دقيقة'
            },
            {
              type: 'podcast',
              title: 'عقلية المهندس المعماري',
              description: 'التفكير في الأنظمة',
              duration: '35 دقيقة'
            },
            {
              type: 'guide',
              title: 'دليل الهندسة المعمارية',
              description: 'الأنماط والممارسات',
              duration: '50 دقيقة'
            }
          ]
        },
        {
          id: 4,
          title: 'الأنظمة البيئية الوكيلة',
          episodes: [
            {
              type: 'article',
              title: 'التعاون بين الإنسان والذكاء الاصطناعي',
              description: 'تصميم تدفقات العمل الوكيلة',
              duration: '9 دقائق قراءة'
            },
            {
              type: 'video',
              title: 'وكلاء الذكاء الاصطناعي في الممارسة',
              description: 'التطبيقات في العالم الحقيقي',
              duration: '16 دقيقة'
            },
            {
              type: 'podcast',
              title: 'المستقبل الوكيل',
              description: 'إلى أين نتجه؟',
              duration: '40 دقيقة'
            },
            {
              type: 'guide',
              title: 'بناء وكيلك الأول',
              description: 'برنامج تعليمي عملي',
              duration: '60 دقيقة'
            }
          ]
        }
      ] as Chapter[]
    },
    twinStudio: {
      title: 'استوديو التوأم',
      subtitle: 'مسار البناة',
      description: 'جرب توأمًا رقميًا حقيقيًا مدعومًا بنور، مساعدك الذكي.',
      introAnimation: {
        title: 'إتقان التعقيد',
        subtitle: 'شاهد كيف ينبثق النظام من الفوضى'
      },
      chat: {
        placeholder: 'اسأل نور عن توأمك الرقمي...',
        welcome: 'مرحبًا! أنا نور، مساعدك الذكي. أنا هنا لمساعدتك في استكشاف التوائم الرقمية وبناء نموذج التحول الأول الخاص بك. ماذا تريد أن تعرف؟',
        suggestions: [
          'ما هو التوأم الرقمي؟',
          'كيف يعمل جسور؟',
          'أرني مثالاً على مجموعة بيانات',
          'أنشئ خريطة حرارية للتحول'
        ]
      }
    },
    founders: {
      title: 'رسالة المؤسسين',
      subtitle: 'الأصول',
      letter: `فكرة جسور لم تبدأ بالتكنولوجيا — بدأت بالإحباط.

شاهدنا مبادرات تحول رائعة تنهار تحت ثقل تعقيدها. برامج رؤية 2030 مع آلاف المبادرات المترابطة، واستراتيجيات وطنية تُنفذ من خلال أنظمة مجزأة، وفرق موهوبة تغرق في جداول البيانات بدلاً من قيادة التغيير.

المشكلة لم تكن في الطموح. كانت في التماسك.

الأدوات التقليدية — لوحات المعلومات، تقارير Excel، مكاتب إدارة المشاريع اليدوية — بُنيت لعصر أبسط. لم تستطع مواكبة حجم وسرعة وترابط التحول الحديث. احتجنا إلى شيء مختلف جوهريًا.

هنا اكتشفنا التوائم الرقمية. ليس كاستعارة، بل كمبدأ معماري. ماذا لو استطعنا أن نعكس مؤسسات كاملة في نماذج رقمية حية ومتنفسة؟ أنظمة تفهم نفسها، تربط الاستراتيجية بالتنفيذ، تتعلم وتتكيف في الوقت الفعلي؟

جسور هو ذلك الجسر. منصة التحول الإدراكي التي تحول التعقيد من التزام إلى أصل.

نحن لسنا مورد ذكاء اصطناعي. نحن مهندسو أنظمة. نحن نصمم الأنظمة البيئية التي تسمح للذكاء بالتدفق — نربط الوزارات بنماذج الذكاء الاصطناعي، والاستراتيجيات بالبيانات، والبشر بالوكلاء المستقلين. نحافظ على الحياد، ونضمن عمل جميع المكونات معًا تحت تصميم متماسك واحد.

هذا هو عصر الحكومة الإدراكية. حيث الدول لا تقوم فقط بالرقمنة — بل تفكر وتتكيف وتتطور.

جسور هو كيف نصل إلى هناك.

مرحبًا بك على الجسر.`,
      signature: 'فريق التأسيس، AI Twin Tech'
    },
    footer: {
      tagline: 'تحويل التعقيد إلى أقوى أصولك',
      copyright: '© 2025 AI Twin Tech. جميع الحقوق محفوظة.',
      mission: 'مهندس أنظمة الحكومة الإدراكية'
    }
  }
};
