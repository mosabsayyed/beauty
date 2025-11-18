import { motion } from 'motion/react';
import { ArrowDown, Building2, Layers, Boxes } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';

interface JosoorArchitectureProps {
  language: Language;
}

export function JosoorArchitecture({ language }: JosoorArchitectureProps) {
  const t = content[language].architecture;

  const tiers = [
    {
      icon: Building2,
      label: t.tiers.clients,
      color: 'from-purple-500 to-pink-500',
      description: 'Government ministries, sectors, and enterprises'
    },
    {
      icon: Layers,
      label: t.tiers.josoor,
      color: 'from-indigo-500 to-cyan-500',
      description: 'Cognitive integration platform',
      isCenter: true
    },
    {
      icon: Boxes,
      label: t.tiers.vendors,
      color: 'from-green-500 to-emerald-500',
      description: 'AI models, data platforms, visualization tools'
    }
  ];

  return (
    <section 
      className="relative py-24 bg-slate-900"
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
        {/* Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-2 bg-cyan-500/20 rounded-full mb-6"
          >
            <span className="text-cyan-300">Section 2</span>
          </motion.div>

          <h2 className="text-white mb-6">
            {t.title}
          </h2>
          
          <p className="text-cyan-300 mb-4 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
          
          <p className="text-gray-300 max-w-3xl mx-auto">
            {t.description}
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="max-w-4xl mx-auto">
          {tiers.map((tier, index) => (
            <div key={index}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="mb-8"
              >
                <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${tier.color} shadow-2xl ${
                  tier.isCenter ? 'border-4 border-white/20' : ''
                }`}>
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <tier.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white mb-2">
                        {tier.label}
                      </h3>
                      <p className="text-white/80">{tier.description}</p>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <motion.div
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-50 rounded-2xl blur-xl -z-10`}
                  />
                </div>
              </motion.div>

              {/* Arrow Between Tiers */}
              {index < tiers.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.3 }}
                  className="flex justify-center mb-8"
                >
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <ArrowDown className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
        >
          {t.features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <p className="text-gray-300">{feature}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
