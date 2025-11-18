import { Language } from '../types';
import { HeroUnveiling } from '../components/HeroUnveiling';
import { Footer } from '../components/Footer';
import { motion } from 'motion/react';
import { Zap, Network, Brain, Target, ArrowRight, Sparkles, BookOpen, Wrench, BarChart3, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';

interface ConceptLandingPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function ConceptLandingPage({ language, onLanguageChange }: ConceptLandingPageProps) {
  const navigate = useNavigate();
  
  // Noor is now global in App.tsx, triggered via Navigation
  // This helper will trigger the global Noor
  const handleOpenNoor = () => {
    window.dispatchEvent(new CustomEvent('openNoor'));
  };

  return (
    <>
      <HeroUnveiling language={language} onEnterNoor={handleOpenNoor} />
      
      {/* Value Proposition Section */}
      <section 
        className="py-24 bg-white relative overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(30, 64, 175, 0.08) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-6">
              {language === 'en' 
                ? 'Why Organizations Choose Josoor'
                : 'لماذا تختار المؤسسات جسور'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'en'
                ? 'Transform complexity from a burden into your competitive advantage'
                : 'حوّل التعقيد من عبء إلى ميزة تنافسية'}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Network,
                title: language === 'en' ? 'Graph Memory' : 'ذاكرة الرسم البياني',
                description: language === 'en' 
                  ? 'Azure DTDL 2.0 creates living models that understand relationships'
                  : 'Azure DTDL 2.0 ينشئ نماذج حية تفهم العلاقات',
                color: 'bg-blue-600'
              },
              {
                icon: Brain,
                title: language === 'en' ? 'GenAI Reasoning' : 'استدلال GenAI',
                description: language === 'en'
                  ? 'Navigate complexity with intelligent pattern recognition'
                  : 'تنقل في التعقيد مع التعرف الذكي على الأنماط',
                color: 'bg-indigo-600'
              },
              {
                icon: Zap,
                title: language === 'en' ? 'Real-time Sync' : 'مزامنة فورية',
                description: language === 'en'
                  ? 'Your digital twin updates as your organization evolves'
                  : 'توأمك الرقمي يتحدث مع تطور مؤسستك',
                color: 'bg-sky-600'
              },
              {
                icon: Target,
                title: language === 'en' ? 'One-Slide View' : 'عرض شريحة واحدة',
                description: language === 'en'
                  ? 'See everything that matters on a single visualization'
                  : 'اعرض كل ما يهم في تصور واحد',
                color: 'bg-blue-700'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer">
                  <div className={`w-14 h-14 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button
              onClick={handleOpenNoor}
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-white text-lg px-8 shadow-md"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Experience with Noor' : 'اختبر مع نور'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section 
        className="py-24 bg-gray-50 relative overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-6">
              {language === 'en' 
                ? 'The Transformation Impact'
                : 'تأثير التحول'}
            </h2>
            <p className="text-xl text-slate-600">
              {language === 'en'
                ? 'What will your team do with 29 extra hours?'
                : 'ماذا سيفعل فريقك مع 29 ساعة إضافية؟'}
            </p>
          </motion.div>

          {/* Split Screen Comparison */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-xl bg-white border-2 border-red-200 shadow-sm"
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                {language === 'en' ? 'BEFORE' : 'قبل'}
              </div>
              
              <div className="text-5xl text-red-600 mb-6 mt-4">30h</div>
              <h3 className="text-2xl text-slate-900 mb-4">
                {language === 'en' ? 'Traditional Reporting' : 'التقارير التقليدية'}
              </h3>
              
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>{language === 'en' ? 'Manual data collection from 20+ sources' : 'جمع البيانات يدويًا من أكثر من 20 مصدرًا'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>{language === 'en' ? 'Endless spreadsheet updates' : 'تحديثات جداول بيانات لا نهاية لها'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>{language === 'en' ? 'Version control nightmares' : 'كوابيس التحكم في الإصدار'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>{language === 'en' ? 'Information already outdated' : 'معلومات قديمة بالفعل'}</span>
                </li>
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-xl bg-white border-2 border-green-200 shadow-sm"
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                {language === 'en' ? 'AFTER' : 'بعد'}
              </div>
              
              <div className="text-5xl text-green-600 mb-6 mt-4">1h</div>
              <h3 className="text-2xl text-slate-900 mb-4">
                {language === 'en' ? 'With Digital Twin' : 'مع التوأم الرقمي'}
              </h3>
              
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{language === 'en' ? 'Automatic real-time data synthesis' : 'تجميع البيانات التلقائي في الوقت الفعلي'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{language === 'en' ? 'One-click visualization generation' : 'إنشاء التصور بنقرة واحدة'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{language === 'en' ? 'Always current, always accurate' : 'دائمًا محدث، دائمًا دقيق'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{language === 'en' ? 'AI-powered insights included' : 'رؤى مدعومة بالذكاء الاصطناعي مضمنة'}</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* 97% Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <div className="inline-block p-8 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl border-2 border-blue-200 shadow-lg">
              <div className="text-6xl text-blue-700 mb-2">97%</div>
              <div className="text-xl text-slate-700">
                {language === 'en' ? 'Time Saved' : 'توفير الوقت'}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Noor's Four Experiences - Interactive Showcase */}
      <section 
        className="py-24 bg-white relative overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl text-slate-900 mb-6">
              {language === 'en' 
                ? 'Four Ways Noor Can Help You'
                : 'أربع طرق يمكن أن تساعدك نور'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              {language === 'en'
                ? 'One AI assistant. Four powerful experiences. Navigate complexity your way.'
                : 'مساعد ذكاء اصطناعي واحد. أربع تجارب قوية. تنقل في التعقيد بطريقتك.'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Play,
                title: language === 'en' ? 'Experience Transformation' : 'اختبر التحول',
                description: language === 'en'
                  ? 'Watch a live simulation using 5 years of real organizational data. See how complexity becomes navigable in real-time.'
                  : 'شاهد محاكاة مباشرة باستخدام 5 سنوات من البيانات التنظيمية الحقيقية. اعرض كيف يصبح التعقيد قابلاً للتنقل في الوقت الفعلي.',
                color: 'bg-blue-600'
              },
              {
                icon: BarChart3,
                title: language === 'en' ? 'View Smart Dashboards' : 'اعرض لوحات التحكم الذكية',
                description: language === 'en'
                  ? 'Executive dashboards with a difference - these ones think. AI-powered insights that understand your organization.'
                  : 'لوحات تحكم تنفيذية مع فرق - هذه تفكر. رؤى مدعومة بالذكاء الاصطناعي تفهم مؤسستك.',
                color: 'bg-indigo-600'
              },
              {
                icon: BookOpen,
                title: language === 'en' ? 'Learn TwinScience' : 'تعلم TwinScience',
                description: language === 'en'
                  ? 'Explore 4 chapters, 64 content pieces of transformation knowledge. Let Noor guide you through our expertise.'
                  : 'استكشف 4 فصول، 64 محتوى من معرفة التحول. دع نور يرشدك عبر خبرتنا.',
                color: 'bg-sky-600'
              },
              {
                icon: Wrench,
                title: language === 'en' ? 'Build Your Use Case' : 'ابنِ حالة الاستخدام الخاصة بك',
                description: language === 'en'
                  ? 'Create UC001 with Noor as your designer. Generate DTDL code and take home a mini digital twin.'
                  : 'أنشئ UC001 مع نور كمصممك. أنشئ كود DTDL وخذ توأمًا رقميًا صغيرًا معك إلى المنزل.',
                color: 'bg-blue-700'
              }
            ].map((experience, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-8 bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer">
                  <div className={`w-16 h-16 ${experience.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md`}>
                    <experience.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl text-slate-900 mb-3">{experience.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">{experience.description}</p>
                  
                  <Button
                    onClick={handleOpenNoor}
                    variant="ghost"
                    className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 p-0 h-auto group/btn"
                  >
                    {language === 'en' ? 'Try with Noor' : 'جرب مع نور'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button
              onClick={handleOpenNoor}
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-white text-xl px-10 py-7 shadow-lg"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              {language === 'en' ? 'Start Exploring with Noor' : 'ابدأ الاستكشاف مع نور'}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <p className="text-sm text-slate-500 mt-4">
              {language === 'en' 
                ? 'No sign-up required • Instant access • Full experience'
                : 'لا حاجة للتسجيل • وصول فوري • تجربة كاملة'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Learn More About Company */}
      <section 
        className="py-20 bg-gray-50"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl text-slate-900 mb-4">
              {language === 'en' ? 'Want to Know More About AI Twin Tech?' : 'تريد معرفة المزيد عن AI Twin Tech؟'}
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              {language === 'en'
                ? 'Learn about our journey, team, and vision for cognitive government transformation'
                : 'تعرف على رحلتنا وفريقنا ورؤيتنا لتحول الحكومة الإدراكية'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => navigate('/founders')}
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 px-8"
              >
                {language === 'en' ? 'About Us' : 'عنا'}
              </Button>
              <Button
                onClick={() => navigate('/offerings')}
                size="lg"
                variant="outline"
                className="border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 px-8"
              >
                {language === 'en' ? 'Our Offerings' : 'عروضنا'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer language={language} onLanguageChange={onLanguageChange} />
    </>
  );
}
