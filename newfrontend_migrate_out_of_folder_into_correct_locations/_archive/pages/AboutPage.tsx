import { Language } from '../types';
import { FoundersLetter } from '../components/FoundersLetter';
import { Footer } from '../components/Footer';
import { motion } from 'motion/react';
import { Target, Users, Lightbulb, Globe2 } from 'lucide-react';

interface AboutPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function AboutPage({ language, onLanguageChange }: AboutPageProps) {
  const values = [
    {
      icon: Target,
      title: language === 'en' ? 'Systems First' : 'الأنظمة أولاً',
      description: language === 'en' 
        ? 'We architect coherent ecosystems, not isolated solutions.'
        : 'نحن نصمم أنظمة بيئية متماسكة، وليس حلولًا معزولة.'
    },
    {
      icon: Users,
      title: language === 'en' ? 'Neutral Integration' : 'التكامل المحايد',
      description: language === 'en'
        ? 'We integrate best-of-breed vendors without bias.'
        : 'نحن ندمج أفضل الموردين دون تحيز.'
    },
    {
      icon: Lightbulb,
      title: language === 'en' ? 'Cognitive by Design' : 'إدراكي بالتصميم',
      description: language === 'en'
        ? 'Our platforms learn, adapt, and evolve with your needs.'
        : 'منصاتنا تتعلم وتتكيف وتتطور مع احتياجاتك.'
    },
    {
      icon: Globe2,
      title: language === 'en' ? 'Government Scale' : 'نطاق حكومي',
      description: language === 'en'
        ? 'Built for national transformation complexity.'
        : 'مصمم لتعقيد التحول الوطني.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl text-white mb-6">
              {language === 'en' ? 'About AI Twin Tech' : 'عن AI Twin Tech'}
            </h1>
            
            <p className="text-xl text-cyan-300 mb-4 max-w-3xl mx-auto">
              {language === 'en' 
                ? 'Systems Architect of Cognitive Government'
                : 'مهندس أنظمة الحكومة الإدراكية'}
            </p>
            
            <p className="text-gray-300 max-w-3xl mx-auto text-lg">
              {language === 'en'
                ? 'We design the bridges that let intelligence flow across transformation ecosystems.'
                : 'نحن نصمم الجسور التي تسمح للذكاء بالتدفق عبر الأنظمة البيئية للتحول.'}
            </p>
          </motion.div>

          {/* Core Values */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-slate-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="p-10 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30"
          >
            <h2 className="text-3xl text-white mb-6 text-center">
              {language === 'en' ? 'Our Mission' : 'مهمتنا'}
            </h2>
            <p className="text-lg text-gray-300 text-center leading-relaxed">
              {language === 'en'
                ? 'To empower the Cognitive Government era by turning complexity into a strategic asset through digital twins, agentic ecosystems, and intelligent system integration.'
                : 'تمكين عصر الحكومة الإدراكية من خلال تحويل التعقيد إلى أصل استراتيجي من خلال التوائم الرقمية والأنظمة البيئية الوكيلة والتكامل الذكي للأنظمة.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 bg-slate-950" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl text-white mb-4">
              {language === 'en' ? 'Our Products' : 'منتجاتنا'}
            </h2>
            <p className="text-gray-400">
              {language === 'en' 
                ? 'Flagship solutions for cognitive transformation'
                : 'الحلول الرائدة للتحول الإدراكي'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-indigo-500/50 transition-all"
            >
              <div className="inline-block px-4 py-2 bg-indigo-500/20 rounded-full mb-4">
                <span className="text-indigo-300">Flagship</span>
              </div>
              <h3 className="text-2xl text-white mb-4">Josoor</h3>
              <p className="text-gray-300 mb-4">
                {language === 'en'
                  ? 'The Digital Twin Platform powering the next era of Cognitive Government. Bridges strategy, execution, and intelligence at national scale.'
                  : 'منصة التوأم الرقمي التي تدعم العصر القادم من الحكومة الإدراكية. تربط الاستراتيجية والتنفيذ والذكاء على نطاق وطني.'}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• {language === 'en' ? 'Azure DTDL 2.0 Integration' : 'تكامل Azure DTDL 2.0'}</li>
                <li>• {language === 'en' ? 'GenAI Reasoning Engine' : 'محرك استدلال GenAI'}</li>
                <li>• {language === 'en' ? 'Real-time Synchronization' : 'مزامنة في الوقت الفعلي'}</li>
                <li>• {language === 'en' ? 'Vendor-Neutral Architecture' : 'هندسة محايدة للموردين'}</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="p-8 bg-slate-800/30 rounded-2xl border border-slate-700/30"
            >
              <div className="inline-block px-4 py-2 bg-cyan-500/20 rounded-full mb-4">
                <span className="text-cyan-300">{language === 'en' ? 'Coming Soon' : 'قريبًا'}</span>
              </div>
              <h3 className="text-2xl text-white mb-4">
                {language === 'en' ? 'Future Products' : 'منتجات مستقبلية'}
              </h3>
              <p className="text-gray-300">
                {language === 'en'
                  ? 'We are continuously innovating to bring new cognitive solutions to government transformation challenges.'
                  : 'نحن نبتكر باستمرار لتقديم حلول إدراكية جديدة لتحديات التحول الحكومي.'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founders Letter */}
      <FoundersLetter language={language} />

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
