import { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Video, Mic, FileText, ChevronRight, MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import { Language, Episode } from '../types';
import { content } from '../data/content';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Footer } from '../components/Footer';

interface TwinSciencePageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
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

// Generate 4 content pieces for each episode type
const generateContentPieces = (episode: Episode, episodeIndex: number) => {
  const contentTypes = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return contentTypes.map((level, idx) => ({
    ...episode,
    title: `${episode.title} - ${level}`,
    id: `${episodeIndex}-${idx}`
  }));
};

export function TwinSciencePage({ language, onLanguageChange }: TwinSciencePageProps) {
  const t = content[language].twinScience;
  const [selectedChapter, setSelectedChapter] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Header */}
      <section 
        className="relative pt-32 pb-16 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
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
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="inline-block p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6"
            >
              <BookOpen className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-6xl text-white mb-4">
              {t.title}
            </h1>
            
            <p className="text-xl text-cyan-300 mb-4">
              {t.subtitle}
            </p>
            
            <p className="text-gray-300 max-w-3xl mx-auto text-lg">
              {t.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
              {[
                { label: language === 'en' ? 'Chapters' : 'فصول', value: '4' },
                { label: language === 'en' ? 'Episodes' : 'حلقات', value: '16' },
                { label: language === 'en' ? 'Content Pieces' : 'محتوى', value: '64' },
                { label: language === 'en' ? 'Contributors' : 'مساهمون', value: '200+' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50"
                >
                  <div className="text-3xl text-cyan-400 mb-2">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter Navigation */}
      <section className="py-12 bg-slate-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={selectedChapter.toString()} onValueChange={(v) => setSelectedChapter(parseInt(v))}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-800 p-1">
              {t.chapters.map((chapter, index) => (
                <TabsTrigger 
                  key={chapter.id} 
                  value={index.toString()}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600"
                >
                  <span className="hidden md:inline">{chapter.title}</span>
                  <span className="md:hidden">{language === 'en' ? 'Ch' : 'فصل'} {chapter.id}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {t.chapters.map((chapter, chapterIndex) => (
              <TabsContent key={chapter.id} value={chapterIndex.toString()} className="mt-8">
                <div className="mb-8">
                  <h2 className="text-3xl text-white mb-2">{chapter.title}</h2>
                  <p className="text-gray-400">
                    {language === 'en' 
                      ? `${chapter.episodes.length} episodes × 4 content pieces each = ${chapter.episodes.length * 4} total pieces`
                      : `${chapter.episodes.length} حلقات × 4 محتويات لكل = ${chapter.episodes.length * 4} محتوى إجمالي`}
                  </p>
                </div>

                {/* Episodes */}
                {chapter.episodes.map((episode: Episode, episodeIndex) => {
                  const Icon = episodeIcons[episode.type];
                  const colorClass = episodeColors[episode.type];
                  const contentPieces = generateContentPieces(episode, episodeIndex);

                  return (
                    <div key={episodeIndex} className="mb-12">
                      {/* Episode Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl text-white">{episode.title}</h3>
                          <p className="text-sm text-gray-400">{episode.description}</p>
                        </div>
                        <Badge className={`ml-auto bg-gradient-to-r ${colorClass} text-white border-0`}>
                          {episode.type}
                        </Badge>
                      </div>

                      {/* Content Pieces Grid */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {contentPieces.map((piece, pieceIndex) => (
                          <motion.div
                            key={piece.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: pieceIndex * 0.05 }}
                            whileHover={{ y: -4 }}
                          >
                            <Card className="h-full p-5 bg-slate-800/30 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group">
                              <h4 className="text-white mb-2 text-sm">
                                {piece.title}
                              </h4>

                              <p className="text-gray-400 text-xs mb-4 line-clamp-2">
                                {piece.description}
                              </p>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{piece.duration}</span>
                                <div className="flex items-center gap-3 text-gray-500">
                                  <button className="hover:text-cyan-400 transition-colors">
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button className="hover:text-cyan-400 transition-colors">
                                    <MessageSquare className="w-3 h-3" />
                                  </button>
                                  <button className="hover:text-cyan-400 transition-colors">
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <Button 
                                className="w-full mt-4 bg-slate-700/50 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-cyan-600 text-white border-0 text-xs"
                                size="sm"
                              >
                                {language === 'en' ? 'Start Learning' : 'ابدأ التعلم'}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Collaborative Note */}
      <section className="py-16 bg-slate-950" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="p-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30 text-center"
          >
            <h3 className="text-2xl text-white mb-4">
              {language === 'en' ? 'Join the Community' : 'انضم إلى المجتمع'}
            </h3>
            <p className="text-cyan-300 text-lg mb-6">
              {language === 'en' 
                ? 'TwinScience is a collaborative space. Contribute your knowledge and help build the transformation science library.' 
                : 'علم التوأم مساحة تعاونية. ساهم بمعرفتك وساعد في بناء مكتبة علوم التحول.'}
            </p>
            <Button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white">
              {language === 'en' ? 'Become a Contributor' : 'كن مساهمًا'}
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
