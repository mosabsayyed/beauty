import { motion } from 'motion/react';
import { BookOpen, Video, Mic, FileText, ChevronRight } from 'lucide-react';
import { Language, Episode } from '../types';
import { content } from '../data/content';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface TwinScienceProps {
  language: Language;
}

const episodeIcons = {
  article: BookOpen,
  video: Video,
  podcast: Mic,
  guide: FileText
};

const episodeColors = {
  article: 'from-blue-500 to-cyan-500',
  video: 'from-purple-500 to-pink-500',
  podcast: 'from-orange-500 to-red-500',
  guide: 'from-green-500 to-emerald-500'
};

export function TwinScience({ language }: TwinScienceProps) {
  const t = content[language].twinScience;

  return (
    <section 
      id="twinscience"
      className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
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
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-white mb-4">
            {t.title}
          </h2>
          
          <p className="text-cyan-300 mb-4">
            {t.subtitle}
          </p>
          
          <p className="text-gray-300 max-w-3xl mx-auto">
            {t.description}
          </p>
        </motion.div>

        {/* Chapters */}
        <div className="space-y-12">
          {t.chapters.map((chapter, chapterIndex) => (
            <motion.div
              key={chapter.id}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: chapterIndex * 0.1 }}
            >
              {/* Chapter Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg">
                    <span className="text-white">{chapter.id}</span>
                  </div>
                  <h3 className="text-white">
                    {chapter.title}
                  </h3>
                </div>
              </div>

              {/* Episodes Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {chapter.episodes.map((episode: Episode, episodeIndex) => {
                  const Icon = episodeIcons[episode.type];
                  const colorClass = episodeColors[episode.type];

                  return (
                    <motion.div
                      key={episodeIndex}
                      initial={{ scale: 0.9, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: episodeIndex * 0.1 }}
                      whileHover={{ y: -8 }}
                    >
                      <Card className="h-full p-6 bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group">
                        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <Badge className="mb-3 bg-slate-700/50 text-cyan-300 border-slate-600">
                          {episode.type}
                        </Badge>

                        <h4 className="text-white mb-2">
                          {episode.title}
                        </h4>

                        <p className="text-gray-400 text-sm mb-4">
                          {episode.description}
                        </p>

                        {episode.duration && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{episode.duration}</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}

                        {/* Hover Glow Effect */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-5 rounded-lg transition-opacity`}
                        />
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Collaborative Note */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30 text-center"
        >
          <p className="text-cyan-300 text-lg">
            {language === 'en' 
              ? '💡 TwinScience is a collaborative space. Join the conversation and help build the knowledge base.' 
              : '💡 علم التوأم مساحة تعاونية. انضم إلى المحادثة وساعد في بناء قاعدة المعرفة.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
