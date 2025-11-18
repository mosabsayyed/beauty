import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Language } from '../types';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Sparkles, Coffee, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import josoorLogo from 'figma:asset/284b2ca903e7b9e7de3e13c56fc19bc7a1f5eda7.png';

interface HomePageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function HomePage({ language, onLanguageChange }: HomePageProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Animation stages based on scroll
  const cubeOpacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 0.5, 0]);
  const cubeRotateX = useTransform(scrollYProgress, [0, 0.5], [0, 360]);
  const cubeRotateY = useTransform(scrollYProgress, [0, 0.5], [0, 360]);
  const cubeScale = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 0.8, 0.3]);
  
  const networkOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 1]);
  const networkScale = useTransform(scrollYProgress, [0.3, 0.7], [0.5, 1]);
  
  const ctaOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.6, 0.8], [50, 0]);

  const handleOpenNoor = () => {
    navigate('/experience');
  };

  return (
    <>
      {/* Hero with Rubik's Cube Animation */}
      <div ref={containerRef} className="relative h-[250vh]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden page-bg-pattern">

          {/* Rubik's Cube - Dissolves into Network */}
          <motion.div
            style={{
              opacity: cubeOpacity,
              rotateX: cubeRotateX,
              rotateY: cubeRotateY,
              scale: cubeScale
            }}
            className="absolute"
          >
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-lg shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, #1A2435, #2A3545)`,
                  }}
                  animate={{
                    rotateZ: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Network Visualization - Emerges from Cube */}
          <motion.div
            style={{
              opacity: networkOpacity,
              scale: networkScale
            }}
            className="absolute"
          >
            <div className="relative w-96 h-96 md:w-[500px] md:h-[500px]">
              {/* Central Node - JOSOOR Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center border-2 border-[#1A2435]">
                  <img src={josoorLogo} alt="JOSOOR" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
                </div>
              </motion.div>

              {/* Surrounding Nodes */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const radius = 140;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                    }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1A2435] to-[#2A3545] rounded-lg shadow-lg" />
                    {/* Connection Line */}
                    <svg
                      className="absolute top-1/2 left-1/2 -z-10"
                      style={{
                        width: Math.abs(x * 2),
                        height: Math.abs(y * 2),
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <line
                        x1="50%"
                        y1="50%"
                        x2="0"
                        y2="50%"
                        stroke="#1A2435"
                        strokeWidth="2"
                        opacity="0.3"
                      />
                    </svg>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            style={{
              opacity: ctaOpacity,
              y: ctaY
            }}
            className="absolute bottom-32 left-0 right-0 text-center px-4"
          >
            <h1 className="text-primary-dark mb-4">
              {language === 'en' 
                ? 'JOSOOR – The Cognitive Transformation Bridge'
                : 'جسور - جسر التحول الإدراكي'}
            </h1>
            <p className="lead text-slate-600 mb-8 max-w-3xl mx-auto">
              {language === 'en'
                ? 'From complexity to clarity. From chaos to capability.'
                : 'من التعقيد إلى الوضوح. من الفوضى إلى القدرة.'}
            </p>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <small className="text-slate-400">
              {language === 'en' ? 'Scroll to explore' : 'قم بالتمرير للاستكشاف'}
            </small>
          </motion.div>
        </div>
      </div>

      {/* Three CTAs Section */}
      <section className="py-24 page-bg-pattern" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-primary-dark mb-4">
              {language === 'en' ? 'Choose Your Journey' : 'اختر رحلتك'}
            </h2>
            <p className="lead text-slate-600">
              {language === 'en' 
                ? 'Three ways to understand the future of government transformation'
                : 'ثلاث طرق لفهم مستقبل التحول الحكومي'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* CTA 1: Experience with Noor */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#1A2435] hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 bg-[#1A2435] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <h3 className={`text-primary-dark mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Experience the Solution' : 'اختبر الحل'}
              </h3>
              
              <p className={`text-slate-600 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en'
                  ? 'Let Noor show you transformation dashboards, TwinScience knowledge, digital twin architecture, and interactive use case builders.'
                  : 'دع نور يريك لوحات التحول والمعرفة والهندسة المعمارية ومنشئي حالات الاستخدام التفاعلية.'}
              </p>
              
              <Button
                onClick={handleOpenNoor}
                className={`w-full bg-[#1A2435] hover:bg-[#0f1825] text-white group/btn flex items-center justify-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              >
                <Sparkles className="w-5 h-5" />
                <span>{language === 'en' ? 'Meet Noor' : 'قابل نور'}</span>
                <ArrowRight className={`w-5 h-5 group-hover/btn:translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
              </Button>
            </motion.div>

            {/* CTA 2: Chat over Coffee */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              
              <h3 className={`text-primary-dark mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'Chat Over Coffee' : 'دردشة على قهوة'}
              </h3>
              
              <p className={`text-slate-600 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en'
                  ? 'The perfect agenda: Gov Agency of the Future in 3 phases. Plus, see how Saudi Arabia cracked this in a parallel universe.'
                  : 'الأجندة المثالية: وكالة حكومة المستقبل في 3 مراحل. بالإضافة إلى ذلك، انظر كيف حلت المملكة هذا في عالم موازٍ.'}
              </p>
              
              <Button
                onClick={() => navigate('/coffee')}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#B8941F] hover:to-[#9A7A19] text-white group/btn"
              >
                <Coffee className="w-5 h-5 mr-2" />
                {language === 'en' ? 'View Our Agenda' : 'عرض أجندتنا'}
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* CTA 3: Read the Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border-2 border-gray-200 hover:border-[#1A2435] hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 bg-[#1A2435] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              
              <h3 className={`text-primary-dark mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en' ? 'The Origins' : 'الأصول'}
              </h3>
              
              <p className={`text-slate-600 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {language === 'en'
                  ? 'Read the founder\'s letter on the human side: where this vision came from and why it matters now more than ever.'
                  : 'اقرأ رسالة المؤسس عن الجانب الإنساني: من أين جاءت هذه الرؤية ولماذا هي مهمة الآن أكثر من أي وقت مضى.'}
              </p>
              
              <Button
                onClick={() => navigate('/origins')}
                variant="outline"
                className="w-full border-2 border-[#1A2435] text-[#1A2435] hover:bg-[#1A2435] hover:text-white group/btn"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                {language === 'en' ? 'Read the Letter' : 'اقرأ الرسالة'}
                <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </>
  );
}
