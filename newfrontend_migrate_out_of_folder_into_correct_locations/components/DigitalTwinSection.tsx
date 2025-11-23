import { motion } from 'motion/react';
import { Network, Zap, RefreshCw, Target } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DigitalTwinSectionProps {
  language: Language;
}

export function DigitalTwinSection({ language }: DigitalTwinSectionProps) {
  const t = content[language].digitalTwin;

  const features = [
    { icon: Network, text: t.points[0] },
    { icon: Zap, text: t.points[1] },
    { icon: RefreshCw, text: t.points[2] },
    { icon: Target, text: t.points[3] }
  ];

  return (
    <section 
      className="relative py-24 bg-gradient-to-b from-slate-800 to-slate-900"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 bg-indigo-500/20 rounded-full mb-6"
            >
              <span className="text-indigo-300">Section 1</span>
            </motion.div>

            <h2 className="text-white mb-6">
              {t.title}
            </h2>
            
            <p className="text-cyan-300 mb-6">
              {t.subtitle}
            </p>
            
            <p className="text-gray-300 mb-8">
              {t.description}
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-gray-300 pt-1">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1664526937033-fe2c11f1be25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbmV0d29yayUyMGNvbm5lY3Rpb25zfGVufDF8fHx8MTc2MTMxMDc1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Digital Twin Network"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              
              {/* Floating Quote */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-8 right-8 bg-slate-900/90 backdrop-blur-lg p-6 rounded-xl border border-cyan-500/30"
              >
                <p className="text-cyan-300 italic">"{t.quote}"</p>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
