import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface FoundersLetterProps {
  language: Language;
}

export function FoundersLetter({ language }: FoundersLetterProps) {
  const t = content[language].founders;

  return (
    <section 
      id="founders"
      className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-6"
          >
            <Quote className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-white mb-4">
            {t.title}
          </h2>
          
          <p className="text-cyan-300">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Letter Content */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Decorative Quote Mark */}
          <div className="absolute -top-8 -left-4 md:-left-8 text-8xl text-indigo-500/20 pointer-events-none">
            "
          </div>

          {/* Letter Body */}
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-700/50">
            <div className="prose prose-invert prose-lg max-w-none">
              {t.letter.split('\n\n').map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-gray-300 leading-relaxed mb-6 last:mb-0"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            {/* Signature */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="mt-12 pt-8 border-t border-slate-700/50"
            >
              <p className="text-cyan-300 text-lg">{t.signature}</p>
            </motion.div>

            {/* Animated Border Glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"
            />
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-8 -right-4 md:-right-8 text-8xl text-purple-500/20 pointer-events-none rotate-180">
            "
          </div>
        </motion.div>

        {/* Visual Element */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1631286434951-caa3dcab4d1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFuc2Zvcm1hdGlvbiUyMGJ1c2luZXNzfGVufDF8fHx8MTc2MTM1MDMxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Cognitive Government Transformation"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="absolute bottom-0 left-0 right-0 p-8 text-center"
            >
              <h3 className="text-2xl md:text-3xl text-white mb-2">
                {language === 'en' 
                  ? 'From Digital Government to Cognitive Government' 
                  : 'من الحكومة الرقمية إلى الحكومة الإدراكية'}
              </h3>
              <p className="text-cyan-300">
                {language === 'en'
                  ? 'Josoor is how we get there.'
                  : 'جسور هو كيف نصل إلى هناك.'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
