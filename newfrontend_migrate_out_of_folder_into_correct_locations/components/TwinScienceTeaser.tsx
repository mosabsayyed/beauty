import { motion } from 'motion/react';
import { BookOpen, ArrowRight, Users, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface TwinScienceTeaserProps {
  language: Language;
}

export function TwinScienceTeaser({ language }: TwinScienceTeaserProps) {
  const t = content[language].twinScience;
  const navigate = useNavigate();

  return (
    <section 
      className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="inline-block p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-white mb-6">
              {t.title}
            </h2>
            
            <p className="text-cyan-300 mb-4">
              {t.subtitle}
            </p>
            
            <p className="text-gray-300 mb-8">
              {language === 'en' 
                ? 'A collaborative knowledge environment for learning, sharing, and evolving the science of cognitive transformation. Explore 64 unique content pieces across articles, videos, podcasts, and study guides.'
                : 'بيئة معرفية تعاونية للتعلم والمشاركة وتطوير علم التحول الإدراكي. استكشف 64 محتوى فريد عبر المقالات ومقاطع الفيديو والبودكاست وأدلة الدراسة.'}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: BookOpen, label: language === 'en' ? '4 Chapters' : '4 فصول', value: '16 Episodes' },
                { icon: Users, label: language === 'en' ? 'Community' : 'مجتمع', value: '200+ Contributors' },
                { icon: Sparkles, label: language === 'en' ? 'Content' : 'محتوى', value: '64 Pieces' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                >
                  <stat.icon className="w-6 h-6 text-cyan-400 mb-2" />
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  <div className="text-white">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={() => navigate('/twinscience')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white group"
            >
              {language === 'en' ? 'Explore Knowledge Hub' : 'استكشف مركز المعرفة'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {t.chapters.slice(0, 4).map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ scale: 0, rotate: -10 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">{chapter.id}</span>
                  </div>
                  <h3 className="text-white mb-2 text-sm">{chapter.title}</h3>
                  <p className="text-xs text-gray-400">
                    {chapter.episodes.length} {language === 'en' ? 'episodes' : 'حلقات'}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Decorative Elements */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
