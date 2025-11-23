import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Zap, Target, BarChart3 } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TwinStudioTeaserProps {
  language: Language;
}

export function TwinStudioTeaser({ language }: TwinStudioTeaserProps) {
  const t = content[language].twinStudio;
  const navigate = useNavigate();

  return (
    <section 
      className="relative py-24 bg-gradient-to-b from-slate-950 to-slate-900"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(45deg, #6366f1 25%, transparent 25%, transparent 75%, #6366f1 75%, #6366f1), linear-gradient(45deg, #6366f1 25%, transparent 25%, transparent 75%, #6366f1 75%, #6366f1)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Visual */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1710244182004-1c708b3f146d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhdGElMjB2aXN1YWxpemF0aW9ufGVufDF8fHx8MTc2MTI4OTc2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="TwinStudio Interface"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              
              {/* Floating UI Elements */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 left-6 right-6 p-4 bg-slate-900/90 backdrop-blur-lg rounded-xl border border-purple-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm mb-1">Noor AI Assistant</div>
                    <div className="text-xs text-gray-400">
                      {language === 'en' ? 'Ready to help you build' : 'جاهز لمساعدتك في البناء'}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 left-6 right-6 p-4 bg-slate-900/90 backdrop-blur-lg rounded-xl border border-cyan-500/30"
              >
                <div className="text-xs text-gray-400 mb-2">
                  {language === 'en' ? 'Real-time Analysis' : 'تحليل في الوقت الفعلي'}
                </div>
                <div className="space-y-2">
                  {[65, 82, 91].map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.6 + idx * 0.1, duration: 1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                        />
                      </div>
                      <span className="text-xs text-cyan-400">{value}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Decorative Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
            />
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="inline-block p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-white mb-6">
              {t.title}
            </h2>
            
            <p className="text-cyan-300 mb-4">
              {t.subtitle}
            </p>
            
            <p className="text-gray-300 mb-8">
              {language === 'en' 
                ? 'Experience the power of cognitive transformation. Chat with Noor AI, explore 5 years of organizational data, and visualize your digital twin in real-time.'
                : 'اختبر قوة التحول الإدراكي. تحدث مع نور الذكاء، واستكشف 5 سنوات من البيانات التنظيمية، وتصور توأمك الرقمي في الوقت الفعلي.'}
            </p>

            <div className="space-y-4 mb-8">
              {[
                { 
                  icon: Zap, 
                  text: language === 'en' ? 'AI-powered insights from real organizational data' : 'رؤى مدعومة بالذكاء الاصطناعي من البيانات التنظيمية الحقيقية',
                  color: 'from-purple-500 to-pink-500'
                },
                { 
                  icon: Target, 
                  text: language === 'en' ? 'Build your digital twin interactively' : 'قم ببناء توأمك الرقمي بشكل تفاعلي',
                  color: 'from-indigo-500 to-cyan-500'
                },
                { 
                  icon: BarChart3, 
                  text: language === 'en' ? 'Visualize transformation through heatmaps and analytics' : 'تصور التحول من خلال الخرائط الحرارية والتحليلات',
                  color: 'from-cyan-500 to-blue-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-colors"
                >
                  <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-gray-300 pt-1">{feature.text}</p>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={() => navigate('/twinstudio')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group"
            >
              {language === 'en' ? 'Launch TwinStudio' : 'إطلاق استوديو التوأم'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
