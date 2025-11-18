import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BarChart3, Network, TrendingUp } from 'lucide-react';
import { Language, Message } from '../types';
import { content } from '../data/content';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface TwinStudioProps {
  language: Language;
}

export function TwinStudio({ language }: TwinStudioProps) {
  const t = content[language].twinStudio;
  const [showIntro, setShowIntro] = useState(() => {
    // Check if user has seen intro before
    try {
      return !localStorage.getItem('josoor_intro_seen');
    } catch {
      return true;
    }
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showIntro && messages.length === 0) {
      // Add welcome message when intro is complete
      setMessages([
        {
          role: 'assistant',
          content: t.chat.welcome,
          timestamp: new Date()
        }
      ]);
    }
  }, [showIntro, t.chat.welcome, messages.length]);

  const handleSkipIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem('josoor_intro_seen', 'true');
    } catch {
      // localStorage not available
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate Noor's response
    setTimeout(() => {
      const responses = [
        language === 'en' 
          ? "A digital twin is a virtual representation of a physical system that updates in real-time. In Josoor, we create living models of organizations that understand complexity and enable transformation."
          : "التوأم الرقمي هو تمثيل افتراضي لنظام مادي يتحدث في الوقت الفعلي. في جسور، نقوم بإنشاء نماذج حية للمؤسسات تفهم التعقيد وتمكّن التحول.",
        language === 'en'
          ? "Josoor acts as a bridge between clients (ministries/enterprises), AI vendors, and data systems. We integrate all components into a coherent cognitive ecosystem using Azure DTDL 2.0 and GenAI reasoning."
          : "جسور يعمل كجسر بين العملاء (الوزارات/المؤسسات)، وموردي الذكاء الاصطناعي، وأنظمة البيانات. نحن ندمج جميع المكونات في نظام إدراكي متماسك باستخدام Azure DTDL 2.0 ومنطق GenAI.",
        language === 'en'
          ? "I can help you visualize your transformation data through heatmaps, spider diagrams, and causal relationship maps. What aspect of your organization would you like to explore?"
          : "يمكنني مساعدتك في تصور بيانات التحول الخاصة بك من خلال الخرائط الحرارية ومخططات العنكبوت وخرائط العلاقات السببية. ما الجانب من مؤسستك الذي تود استكشافه؟"
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: Message = {
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section 
      id="twinstudio"
      className="relative min-h-screen py-24 bg-gradient-to-b from-slate-950 to-slate-900"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6"
          >
            <Sparkles className="w-12 h-12 text-white" />
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

        {/* Intro Animation - Rubik's Cube */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 2 }}
                  className="mb-8 mx-auto"
                >
                  <div className="w-32 h-32 mx-auto relative">
                    {/* Simplified Rubik's Cube representation */}
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="absolute w-10 h-10 border-2 border-cyan-500 bg-gradient-to-br from-indigo-500 to-purple-500"
                        style={{
                          left: `${(i % 3) * 36}px`,
                          top: `${Math.floor(i / 3) * 36}px`,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>

                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-3xl text-white mb-4"
                >
                  {t.introAnimation.title}
                </motion.h3>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-cyan-300 mb-8"
                >
                  {t.introAnimation.subtitle}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                >
                  <Button
                    onClick={handleSkipIntro}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                  >
                    {language === 'en' ? 'Enter TwinStudio' : 'ادخل إلى استوديو التوأم'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Studio Interface */}
        {!showIntro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col bg-slate-800/50 border-slate-700/50">
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white">Noor</h3>
                      <p className="text-xs text-gray-400">
                        {language === 'en' ? 'AI Assistant' : 'المساعد الذكي'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                            : 'bg-slate-700/50 text-gray-200'
                        }`}
                      >
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 border-t border-slate-700/50">
                  <div className="flex gap-3">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Suggestions */}
                  {messages.length === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 flex flex-wrap gap-2"
                    >
                      {t.chat.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputValue(suggestion)}
                          className="px-3 py-1 text-sm bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </Card>
            </div>

            {/* Visualization Panel */}
            <div className="space-y-6">
              <Card className="p-6 bg-slate-800/50 border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-white">
                    {language === 'en' ? 'Analytics' : 'التحليلات'}
                  </h4>
                </div>
                <div className="space-y-3">
                  {[
                    { label: language === 'en' ? 'Heatmap' : 'خريطة حرارية', icon: TrendingUp },
                    { label: language === 'en' ? 'Spider Map' : 'خريطة عنكبوتية', icon: Network },
                    { label: language === 'en' ? 'Causal Flow' : 'التدفق السببي', icon: BarChart3 }
                  ].map((item, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-left flex items-center gap-3 transition-colors group"
                    >
                      <item.icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                      <span className="text-gray-300 group-hover:text-white">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
                <p className="text-sm text-gray-300">
                  {language === 'en'
                    ? '💡 Explore your digital twin with 5 years of organizational data. Ask Noor to generate insights and visualizations.'
                    : '💡 استكشف توأمك الرقمي مع 5 سنوات من البيانات التنظيمية. اسأل نور لتوليد الرؤى والتصورات.'}
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
