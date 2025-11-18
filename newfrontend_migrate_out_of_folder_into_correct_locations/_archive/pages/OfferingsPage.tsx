import { Language } from '../types';
import { Footer } from '../components/Footer';
import { motion } from 'motion/react';
import { Network, Brain, Zap, Building2, Lightbulb, Shield, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface OfferingsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenNoor?: () => void;
}

export function OfferingsPage({ language, onLanguageChange, onOpenNoor }: OfferingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-white"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(30, 64, 175, 0.08) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-6 px-4 py-2">
              <Lightbulb className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Our Solutions' : 'حلولنا'}
            </Badge>

            <h1 className="text-5xl md:text-6xl text-slate-900 mb-6">
              {language === 'en' ? (
                <>
                  Systems Architecture for
                  <br />
                  <span className="text-blue-700">
                    Cognitive Government
                  </span>
                </>
              ) : (
                <>
                  بنية الأنظمة من أجل
                  <br />
                  <span className="text-blue-700">
                    الحكومة الإدراكية
                  </span>
                </>
              )}
            </h1>

            <p className="text-xl text-slate-600 mb-8">
              {language === 'en'
                ? 'AI Twin Tech positions as a Systems Architect and Integrator, not just another AI vendor. We bridge complexity with Josoor, our flagship digital twin platform.'
                : 'تتموضع AI Twin Tech كمهندس ومدمج للأنظمة، وليس مجرد بائع آخر للذكاء الاصطناعي. نربط التعقيد بجسور، منصتنا الرائدة للتوائم الرقمية.'}
            </p>

            <Button
              onClick={onOpenNoor}
              size="lg"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 shadow-md"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Explore with Noor AI' : 'استكشف مع نور AI'}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Main Offering: Josoor Platform */}
      <section 
        className="py-20 bg-white"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl text-slate-900 mb-4 text-center">
              {language === 'en' ? 'Josoor — The Cognitive Transformation Bridge' : 'جسور — جسر التحول الإدراكي'}
            </h2>
            <p className="text-xl text-blue-700 text-center max-w-3xl mx-auto">
              {language === 'en'
                ? 'Our flagship digital twin platform that transforms organizational complexity into navigable intelligence'
                : 'منصتنا الرائدة للتوائم الرقمية التي تحول التعقيد التنظيمي إلى ذكاء قابل للتنقل'}
            </p>
          </motion.div>

          {/* Core Capabilities */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Network,
                title: language === 'en' ? 'Digital Twin Platform' : 'منصة التوأم الرقمي',
                description: language === 'en'
                  ? 'Built on Azure DTDL 2.0, creating living models of your organization that understand relationships and context'
                  : 'مبنية على Azure DTDL 2.0، إنشاء نماذج حية لمؤسستك تفهم العلاقات والسياق',
                color: 'bg-blue-600'
              },
              {
                icon: Brain,
                title: language === 'en' ? 'GenAI Integration' : 'تكامل GenAI',
                description: language === 'en'
                  ? 'Navigate complexity with intelligent reasoning. Transform 30-hour reporting cycles into 1-hour insights'
                  : 'تنقل في التعقيد مع الاستدلال الذكي. حول دورات التقارير لمدة 30 ساعة إلى رؤى لمدة ساعة واحدة',
                color: 'bg-indigo-600'
              },
              {
                icon: Zap,
                title: language === 'en' ? '3-Tier Architecture' : 'بنية من 3 طبقات',
                description: language === 'en'
                  ? 'Master Twin (organizational memory), Sector Twins (domain intelligence), Functional Twins (operational reality)'
                  : 'التوأم الرئيسي (الذاكرة التنظيمية)، توائم القطاع (ذكاء المجال)، التوائم الوظيفية (الواقع التشغيلي)',
                color: 'bg-sky-600'
              }
            ].map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                  <div className={`w-14 h-14 ${capability.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                    <capability.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-slate-900 mb-3">{capability.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{capability.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl border-2 border-blue-200 p-8 md:p-12"
          >
            <h3 className="text-3xl text-slate-900 mb-8 text-center">
              {language === 'en' ? 'What Josoor Delivers' : 'ما يقدمه جسور'}
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                language === 'en' ? 'See your entire organization on one slide' : 'اعرض مؤسستك بالكامل في شريحة واحدة',
                language === 'en' ? 'Real-time organizational intelligence' : 'ذكاء تنظيمي في الوقت الفعلي',
                language === 'en' ? '97% reduction in reporting time' : 'تخفيض 97٪ في وقت التقارير',
                language === 'en' ? 'AI-powered pattern recognition' : 'التعرف على الأنماط بالذكاء الاصطناعي',
                language === 'en' ? 'Cross-functional dependency mapping' : 'رسم خريطة التبعيات عبر الوظائف',
                language === 'en' ? 'Automated compliance tracking' : 'تتبع الامتثال الآلي'
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-blue-700 flex-shrink-0 mt-1" />
                  <span className="text-slate-700 text-lg">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Service Model */}
      <section 
        className="py-20 bg-gray-50"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl text-slate-900 mb-4">
              {language === 'en' ? 'Systems Architect & Integrator' : 'مهندس ومدمج الأنظمة'}
            </h2>
            <p className="text-xl text-blue-700 max-w-3xl mx-auto">
              {language === 'en'
                ? 'We don\'t just provide software. We architect and integrate complete transformation ecosystems.'
                : 'نحن لا نقدم البرمجيات فقط. نحن نهندس وندمج أنظمة التحول الكاملة.'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Building2,
                title: language === 'en' ? 'Strategic Architecture' : 'البنية الاستراتيجية',
                items: language === 'en' 
                  ? ['Digital transformation roadmapping', 'Enterprise architecture design', 'Technology stack selection', 'Integration strategy planning']
                  : ['خريطة طريق التحول الرقمي', 'تصميم بنية المؤسسة', 'اختيار مجموعة التقنيات', 'تخطيط استراتيجية التكامل']
              },
              {
                icon: Shield,
                title: language === 'en' ? 'Implementation & Integration' : 'التنفيذ والتكامل',
                items: language === 'en'
                  ? ['Platform deployment & configuration', 'Legacy system integration', 'Data migration & harmonization', 'Change management support']
                  : ['نشر وتكوين المنصة', 'تكامل الأنظمة القديمة', 'ترحيل البيانات والمواءمة', 'دعم إدارة التغيير']
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full p-8 bg-white border-gray-200 shadow-sm">
                  <div className={`w-16 h-16 bg-blue-700 rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl text-slate-900 mb-6">{service.title}</h3>
                  <ul className="space-y-3">
                    {service.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <ArrowRight className="w-5 h-5 text-blue-700 flex-shrink-0 mt-1" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 bg-white"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl text-slate-900 mb-6">
              {language === 'en' ? 'Ready to Transform Your Organization?' : 'هل أنت مستعد لتحويل مؤسستك؟'}
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              {language === 'en'
                ? 'Let Noor show you how Josoor can bridge your complexity'
                : 'دع نور يوضح لك كيف يمكن لجسور أن يربط تعقيدك'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={onOpenNoor}
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-white text-lg px-8 shadow-md"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {language === 'en' ? 'Experience with Noor' : 'اختبر مع نور'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-700 text-blue-700 hover:bg-blue-50 text-lg px-8"
              >
                {language === 'en' ? 'Schedule Consultation' : 'حدد موعد استشارة'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
