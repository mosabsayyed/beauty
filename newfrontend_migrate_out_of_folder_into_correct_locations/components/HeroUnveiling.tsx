import { motion } from 'motion/react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface HeroUnveilingProps {
  language: Language;
  onEnterNoor?: () => void;
}

export function HeroUnveiling({ language, onEnterNoor }: HeroUnveilingProps) {
  return (
    <section 
      className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white overflow-hidden flex items-center"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Subtle Tech Grid Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(30, 64, 175, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 64, 175, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Gradient Orbs - lighter and more subtle */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/40 to-sky-200/40 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left Content - 60% */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Digital Twin Platform' : 'منصة التوأم الرقمي'}
                </Badge>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-900 mb-6"
              >
                {language === 'en' ? (
                  <>
                    See Your Entire
                    <br />
                    <span className="text-blue-700">
                      Organization
                    </span>
                    <br />
                    on One Slide
                  </>
                ) : (
                  <>
                    اعرض مؤسستك
                    <br />
                    <span className="text-blue-700">
                      بالكامل
                    </span>
                    <br />
                    في شريحة واحدة
                  </>
                )}
              </motion.h1>

              {/* Subheadline - Flips conventional wisdom */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xl md:text-2xl text-blue-900 mb-4"
              >
                {language === 'en' 
                  ? "Don't simplify complexity. Navigate it with AI."
                  : "لا تبسط التعقيد. تنقل فيه بالذكاء الاصطناعي."}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-lg text-slate-600 mb-8 max-w-2xl"
              >
                {language === 'en'
                  ? 'Transform 30-hour reporting cycles into real-time organizational intelligence. Built on Azure DTDL 2.0 + GenAI reasoning.'
                  : 'حوّل دورات التقارير التي تستغرق 30 ساعة إلى ذكاء تنظيمي فوري. مبني على Azure DTDL 2.0 + استدلال GenAI.'}
              </motion.p>

              {/* Quantified Proof Point */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className="inline-flex items-center gap-6 mb-8 p-6 bg-white rounded-2xl border-2 border-blue-200 shadow-md"
              >
                <div className="text-center">
                  <div className="text-4xl text-red-500 mb-1 line-through opacity-70">30h</div>
                  <div className="text-sm text-slate-500">{language === 'en' ? 'Before' : 'قبل'}</div>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-700" />
                <div className="text-center">
                  <div className="text-5xl text-blue-700">1h</div>
                  <div className="text-sm text-slate-500">{language === 'en' ? 'After' : 'بعد'}</div>
                </div>
                <div className="ml-4 border-l border-slate-300 pl-4">
                  <div className="text-3xl text-green-600">97%</div>
                  <div className="text-sm text-slate-500">{language === 'en' ? 'Time Saved' : 'توفير الوقت'}</div>
                </div>
              </motion.div>

              {/* Single Powerful CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="flex flex-col gap-4"
              >
                <Button
                  onClick={onEnterNoor}
                  size="lg"
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xl px-10 py-7 group shadow-lg"
                >
                  <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                  {language === 'en' ? 'Meet Noor - Your AI Guide' : 'تعرف على نور - دليلك بالذكاء الاصطناعي'}
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
                
                <p className="text-center text-sm text-slate-500">
                  {language === 'en' 
                    ? '🎯 One assistant • Four experiences • Infinite possibilities'
                    : '🎯 مساعد واحد • أربع تجارب • إمكانيات لا نهائية'}
                </p>
              </motion.div>

              {/* Trust Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-12 flex flex-wrap items-center gap-6 text-sm text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
                  <span>{language === 'en' ? '30 Years of Expertise' : '30 عامًا من الخبرة'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
                  <span>{language === 'en' ? '4 Chapters of Knowledge' : '4 فصول من المعرفة'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
                  <span>{language === 'en' ? 'Live Interactive Demo' : 'عرض تفاعلي مباشر'}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Visual - 40% */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="relative"
            >
              {/* Rubik's Cube Transformation Animation */}
              <div className="relative aspect-square">
                {/* Glowing Background */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-sky-200/50 rounded-3xl blur-3xl"
                />

                {/* Main Visual Container */}
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-blue-200 p-8 overflow-hidden shadow-xl">
                  {/* Rubik's Cube dissolving into network */}
                  <div className="relative h-full flex flex-col items-center justify-center">
                    {/* Top: Rubik's Cube */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotateX: [0, 360],
                        rotateY: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="mb-8"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {[...Array(9)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + i * 0.05 }}
                            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg shadow-lg"
                          />
                        ))}
                      </div>
                    </motion.div>

                    {/* Dissolve Effect Lines */}
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 1.5, duration: 0.8 }}
                      className="h-12 w-0.5 bg-gradient-to-b from-blue-600 to-transparent mb-6"
                    />

                    {/* Bottom: Interconnected Circles (Network) */}
                    <div className="relative w-full h-32">
                      {/* Central Node */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-blue-600 to-sky-500 rounded-full shadow-lg flex items-center justify-center"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>

                      {/* Surrounding Nodes */}
                      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                        const radius = 60;
                        const x = Math.cos((angle * Math.PI) / 180) * radius;
                        const y = Math.sin((angle * Math.PI) / 180) * radius;
                        
                        return (
                          <motion.div
                            key={angle}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 2.2 + i * 0.1 }}
                            className="absolute w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-full shadow-lg"
                            style={{
                              left: `calc(50% + ${x}px)`,
                              top: `calc(50% + ${y}px)`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        );
                      })}

                      {/* Connecting Lines */}
                      <svg className="absolute inset-0 w-full h-full">
                        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                          const radius = 60;
                          const x = Math.cos((angle * Math.PI) / 180) * radius;
                          const y = Math.sin((angle * Math.PI) / 180) * radius;
                          
                          return (
                            <motion.line
                              key={angle}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 0.4 }}
                              transition={{ delay: 2.2 + i * 0.1, duration: 0.5 }}
                              x1="50%"
                              y1="50%"
                              x2={`calc(50% + ${x}px)`}
                              y2={`calc(50% + ${y}px)`}
                              stroke="url(#gradient)"
                              strokeWidth="2"
                            />
                          );
                        })}
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Glowing AI Sphere at bottom */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 3 }}
                      className="mt-8"
                    >
                      <motion.div
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(30, 64, 175, 0.3)',
                            '0 0 40px rgba(30, 64, 175, 0.5)',
                            '0 0 20px rgba(30, 64, 175, 0.3)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="w-20 h-20 bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 rounded-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          className="w-16 h-16 bg-gradient-to-br from-white/30 to-transparent rounded-full"
                        />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Floating Particles */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: [0, -100],
                        x: [0, (i % 2 === 0 ? 1 : -1) * 50],
                      }}
                      transition={{
                        duration: 3 + i * 0.2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                      className="absolute w-1 h-1 bg-blue-600 rounded-full"
                      style={{
                        left: `${10 + (i * 7)}%`,
                        bottom: '10%',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.5 }}
                className="absolute -left-4 top-1/4 bg-white/95 backdrop-blur-xl border-2 border-blue-200 rounded-2xl p-4 shadow-lg"
              >
                <div className="text-2xl text-blue-700 mb-1">200+</div>
                <div className="text-xs text-slate-600">{language === 'en' ? 'Data Points' : 'نقطة بيانات'}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.7 }}
                className="absolute -right-4 bottom-1/4 bg-white/95 backdrop-blur-xl border-2 border-indigo-200 rounded-2xl p-4 shadow-lg"
              >
                <div className="text-2xl text-indigo-700 mb-1">Real-time</div>
                <div className="text-xs text-slate-600">{language === 'en' ? 'Sync' : 'مزامنة'}</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
