import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BarChart3, Network, TrendingUp, Lightbulb, Zap, Target, Layers, Settings } from 'lucide-react';
import { Language, Message } from '../types';
import { content } from '../data/content';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';

interface TwinStudioPageProps {
  language: Language;
}

export function TwinStudioPage({ language }: TwinStudioPageProps) {
  const t = content[language].twinStudio;
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !localStorage.getItem('josoor_intro_seen');
    } catch {
      return true;
    }
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    if (!showIntro && messages.length === 0) {
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
          : "يمكنني مساعدتك في تصور بيانات التحول الخاصة بك من خلال الخرائط الحرارية ومخططات العنكبوت وخرائط العلاقات السببية. ما الجانب من مؤسستك الذي تود استكشافه؟",
        language === 'en'
          ? "Based on your 5-year organizational data, I'm detecting 3 major transformation patterns. Would you like me to create a visual analysis?"
          : "بناءً على بيانات مؤسستك لمدة 5 سنوات، أكتشف 3 أنماط تحول رئيسية. هل تريد مني إنشاء تحليل مرئي؟"
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
    <div className="min-h-screen bg-slate-950" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
        <div className="h-screen flex flex-col pt-20">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
            <div className="max-w-[2000px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl text-white">{t.title}</h1>
                  <p className="text-sm text-gray-400">{t.subtitle}</p>
                </div>
              </div>
              <Button variant="outline" className="border-slate-700 text-gray-300">
                <Settings className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Settings' : 'الإعدادات'}
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950">
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-start gap-3 max-w-[80%]">
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                              : 'bg-slate-800/70 text-gray-200 border border-slate-700/50'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t border-slate-800 p-6 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3 mb-4">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 h-12 text-base"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 h-12 px-6"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>

                  {messages.length === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap gap-2"
                    >
                      {t.chat.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputValue(suggestion)}
                          className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors border border-slate-700"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Glorious Side Canvas */}
            <div className="w-[500px] bg-slate-900 border-l border-slate-800 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full bg-slate-800 p-1 m-4 mb-0">
                  <TabsTrigger value="insights" className="flex-1">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Insights' : 'رؤى'}
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex-1">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'Analytics' : 'تحليلات'}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 p-4">
                  <TabsContent value="insights" className="mt-0 space-y-4">
                    {/* Key Insights */}
                    <Card className="p-5 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
                      <div className="flex items-start gap-3 mb-4">
                        <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="text-white mb-2">
                            {language === 'en' ? 'Key Insight' : 'رؤية رئيسية'}
                          </h4>
                          <p className="text-sm text-gray-300">
                            {language === 'en' 
                              ? 'Your transformation velocity increased 34% in Q3. This correlates with new digital twin deployment.'
                              : 'زادت سرعة التحول لديك بنسبة 34٪ في الربع الثالث. يرتبط هذا بنشر التوأم الرقمي الجديد.'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Strategic Patterns */}
                    <Card className="p-5 bg-slate-800/50 border-slate-700/50">
                      <div className="flex items-start gap-3 mb-4">
                        <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="text-white mb-2">
                            {language === 'en' ? 'Strategic Patterns' : 'أنماط استراتيجية'}
                          </h4>
                          <p className="text-sm text-gray-300 mb-3">
                            {language === 'en' 
                              ? 'Detected 3 major transformation patterns across your organization:'
                              : 'تم الكشف عن 3 أنماط تحول رئيسية عبر مؤسستك:'}
                          </p>
                          <div className="space-y-2">
                            {[
                              { label: language === 'en' ? 'Digital Integration' : 'التكامل الرقمي', value: 78 },
                              { label: language === 'en' ? 'Process Automation' : 'أتمتة العمليات', value: 65 },
                              { label: language === 'en' ? 'Cultural Shift' : 'التحول الثقافي', value: 52 }
                            ].map((pattern, idx) => (
                              <div key={idx}>
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>{pattern.label}</span>
                                  <span>{pattern.value}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pattern.value}%` }}
                                    transition={{ delay: idx * 0.2, duration: 1 }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Network Health */}
                    <Card className="p-5 bg-slate-800/50 border-slate-700/50">
                      <div className="flex items-start gap-3">
                        <Network className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h4 className="text-white mb-2">
                            {language === 'en' ? 'System Health' : 'صحة النظام'}
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: language === 'en' ? 'Twin Sync' : 'مزامنة التوأم', status: 'Healthy', color: 'text-green-400' },
                              { label: language === 'en' ? 'Data Flow' : 'تدفق البيانات', status: 'Optimal', color: 'text-cyan-400' },
                              { label: language === 'en' ? 'AI Agents' : 'وكلاء الذكاء', status: 'Active', color: 'text-purple-400' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">{item.label}</span>
                                <span className={`text-xs ${item.color}`}>● {item.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-0 space-y-4">
                    {/* Visualization Options */}
                    <div className="space-y-3">
                      {[
                        { label: language === 'en' ? 'Transformation Heatmap' : 'خريطة حرارية للتحول', icon: TrendingUp, color: 'from-red-500 to-orange-500' },
                        { label: language === 'en' ? 'Spider Diagram' : 'مخطط عنكبوتي', icon: Network, color: 'from-purple-500 to-pink-500' },
                        { label: language === 'en' ? 'Causal Flow Map' : 'خريطة التدفق السببي', icon: Layers, color: 'from-blue-500 to-cyan-500' },
                        { label: language === 'en' ? 'KPI Dashboard' : 'لوحة مؤشرات الأداء', icon: BarChart3, color: 'from-green-500 to-emerald-500' }
                      ].map((viz, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-left flex items-center gap-3 transition-all border border-slate-700/50 hover:border-cyan-500/50 group"
                        >
                          <div className={`w-10 h-10 bg-gradient-to-br ${viz.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <viz.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-gray-300 group-hover:text-white transition-colors">{viz.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Quick Stats */}
                    <Card className="p-5 bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-700/50 mt-6">
                      <h4 className="text-white mb-4 text-sm">
                        {language === 'en' ? 'Real-time Metrics' : 'مقاييس الوقت الفعلي'}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: language === 'en' ? 'Active Twins' : 'توائم نشطة', value: '42' },
                          { label: language === 'en' ? 'Data Streams' : 'تدفقات البيانات', value: '156' },
                          { label: language === 'en' ? 'AI Queries' : 'استعلامات ذكاء', value: '2.4K' },
                          { label: language === 'en' ? 'Insights' : 'رؤى', value: '89' }
                        ].map((stat, idx) => (
                          <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                            <div className="text-2xl text-cyan-400 mb-1">{stat.value}</div>
                            <div className="text-xs text-gray-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
