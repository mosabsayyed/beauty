import { motion } from 'motion/react';
import { Cpu, Shield, GitBranch, Users } from 'lucide-react';
import { Language } from '../types';
import { content } from '../data/content';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SystemsArchitectRoleProps {
  language: Language;
}

export function SystemsArchitectRole({ language }: SystemsArchitectRoleProps) {
  const t = content[language].systemsArchitect;

  const activities = [
    { icon: Cpu, text: t.activities[0], color: 'from-blue-500 to-indigo-500' },
    { icon: Shield, text: t.activities[1], color: 'from-indigo-500 to-purple-500' },
    { icon: GitBranch, text: t.activities[2], color: 'from-purple-500 to-pink-500' },
    { icon: Users, text: t.activities[3], color: 'from-pink-500 to-cyan-500' }
  ];

  return (
    <section 
      className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden"
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
            backgroundImage: 'linear-gradient(45deg, #3b82f6 25%, transparent 25%, transparent 75%, #3b82f6 75%, #3b82f6), linear-gradient(45deg, #3b82f6 25%, transparent 25%, transparent 75%, #3b82f6 75%, #3b82f6)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}
        />
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
            className="inline-block px-4 py-2 bg-purple-500/20 rounded-full mb-6"
          >
            <span className="text-purple-300">Section 3</span>
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Activities List */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group"
              >
                <div className="relative p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-purple-500/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${activity.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <activity.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-gray-200">{activity.text}</p>
                    </div>
                  </div>
                  
                  {/* Hover Glow */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${activity.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1760509684272-4e6636c218bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwdGVjaG5vbG9neSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NjEzNTAzMTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Systems Architecture"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              
              {/* Floating Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 20}%`,
                  }}
                />
              ))}
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
              className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
            />
          </motion.div>
        </div>

        {/* Closing Statement */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="relative p-10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
            <div className="absolute -top-4 -left-4 text-purple-400 opacity-50" style={{fontSize: '4rem'}}>"</div>
            <p className="lead text-white text-center relative z-10">
              {t.closing}
            </p>
            <div className="absolute -bottom-4 -right-4 text-purple-400 opacity-50 rotate-180" style={{fontSize: '4rem'}}>"</div>
            
            {/* Animated Border */}
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 rounded-2xl blur-xl -z-10"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
