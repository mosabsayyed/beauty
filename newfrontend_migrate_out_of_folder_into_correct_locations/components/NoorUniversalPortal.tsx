import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, Maximize2, Minimize2, User, Bot, Zap, BookOpen, BarChart3, Wrench } from 'lucide-react';
import { Language, Message } from '../types';
import { content } from '../data/content';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import josoorLogo from 'figma:asset/284b2ca903e7b9e7de3e13c56fc19bc7a1f5eda7.png';

type NoorPersona = 'assistant' | 'analyst' | 'designer' | 'educator';
type CanvasMode = 'welcome' | 'transformation' | 'dashboard' | 'knowledge' | 'builder';

interface NoorUniversalPortalProps {
  language: Language;
  onClose?: () => void;
}

export function NoorUniversalPortal({ language, onClose }: NoorUniversalPortalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [persona, setPersona] = useState<NoorPersona>('assistant');
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('welcome');
  const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Welcome message
  useEffect(() => {
    setTimeout(() => {
      setMessages([
        {
          role: 'assistant',
          content: language === 'en' 
            ? "Welcome to JOSOOR. I'm Noor, your guide through the cognitive transformation journey.\n\nYou can explore using the quick menu on the left, or ask me directly about anything you'd like to know.\n\nTake your time."
            : "مرحباً في جسور. أنا نور، دليلك في رحلة التحول الإدراكي.\n\nيمكنك الاستكشاف باستخدام القائمة السريعة على اليمين، أو اسألني مباشرة عن أي شيء تريد معرفته.\n\nخذ وقتك.",
          timestamp: new Date()
        }
      ]);
    }, 500);
  }, [language]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue.toLowerCase();
    setInputValue('');

    // Smart routing based on user input
    setTimeout(() => {
      let response = '';
      let newCanvasMode: CanvasMode = canvasMode;
      let newPersona: NoorPersona = persona;

      // Transformation simulation
      if (userInput.includes('transformation') || userInput.includes('experience') || userInput.includes('simulation') || userInput.includes('تحول')) {
        response = language === 'en'
          ? "Excellent! Let me show you a transformation in action. I'm loading a simulation using 5 years of real organizational data. Watch the canvas as I demonstrate how complexity becomes navigable..."
          : "ممتاز! دعني أريك التحول في العمل. أقوم بتحميل محاكاة باستخدام 5 سنوات من البيانات التنظيمية الحقيقية. راقب اللوحة بينما أوضح كيف يصبح التعقيد قابلاً للتنقل...";
        newCanvasMode = 'transformation';
        newPersona = 'analyst';
      }
      // Executive dashboard
      else if (userInput.includes('dashboard') || userInput.includes('executive') || userInput.includes('view') || userInput.includes('لوحة')) {
        response = language === 'en'
          ? "Great choice! I'm switching to analyst mode. Let me show you an executive dashboard - but not the kind you're used to. This one thinks."
          : "اختيار رائع! أنتقل إلى وضع المحلل. دعني أريك لوحة تحكم تنفيذية - لكن ليست من النوع الذي اعتدت عليه. هذه تفكر.";
        newCanvasMode = 'dashboard';
        newPersona = 'analyst';
      }
      // TwinScience knowledge
      else if (userInput.includes('learn') || userInput.includes('knowledge') || userInput.includes('science') || userInput.includes('تعلم') || userInput.includes('معرفة')) {
        response = language === 'en'
          ? "Perfect! Let me become your educator. I'll open TwinScience in the canvas - 4 chapters, 64 pieces of transformation knowledge. What would you like to explore first?"
          : "مثالي! دعني أصبح معلمك. سأفتح TwinScience في اللوحة - 4 فصول، 64 قطعة من معرفة التحول. ما الذي تريد استكشافه أولاً؟";
        newCanvasMode = 'knowledge';
        newPersona = 'educator';
      }
      // Build use case
      else if (userInput.includes('build') || userInput.includes('create') || userInput.includes('designer') || userInput.includes('ابن') || userInput.includes('أنشئ')) {
        response = language === 'en'
          ? "Exciting! I'm switching to designer mode. Let's build your UC001 together. I'll help you create a skeleton AI, generate DTDL code, and give you a mini digital twin to take home. What's your use case about?"
          : "مثير! أنتقل إلى وضع المصمم. لنبني UC001 الخاص بك معًا. سأساعدك في إنشاء ذكاء اصطناعي هيكلي، وتوليد كود DTDL، وأعطيك توأمًا رقميًا صغيرًا لتأخذه معك. ما هي حالة الاستخدام الخاصة بك؟";
        newCanvasMode = 'builder';
        newPersona = 'designer';
      }
      // Default helpful responses
      else {
        const responses = [
          language === 'en'
            ? "I can help you with that! Would you like me to show you a transformation simulation, an executive dashboard, TwinScience knowledge, or help you build a use case?"
            : "يمكنني مساعدتك في ذلك! هل تريد مني أن أريك محاكاة التحول، أو لوحة تحكم تنفيذية، أو معرفة TwinScience، أو مساعدتك في بناء حالة استخدام؟",
          language === 'en'
            ? "Interesting question! The beauty of digital twins is that they can answer complex queries like this in real-time. Let me show you how - which would you prefer: transformation simulation, dashboard view, or knowledge exploration?"
            : "سؤال مثير! جمال التوائم الرقمية هو أنها يمكن أن تجيب على استفسارات معقدة مثل هذه في الوقت الفعلي. دعني أريك كيف - أيهما تفضل: محاكاة التحول، أو عرض لوحة التحكم، أو استكشاف المعرفة؟"
        ];
        response = responses[Math.floor(Math.random() * responses.length)];
      }

      setCanvasMode(newCanvasMode);
      setPersona(newPersona);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const personaConfig = {
    assistant: { icon: Sparkles, color: 'from-[#1A2435] to-[#2A3545]', bgColor: 'bg-[#1A2435]', label: language === 'en' ? 'Assistant' : 'مساعد' },
    analyst: { icon: BarChart3, color: 'from-sky-600 to-blue-600', bgColor: 'bg-sky-600', label: language === 'en' ? 'Analyst' : 'محلل' },
    designer: { icon: Wrench, color: 'from-[#1A2435] to-[#2A3545]', bgColor: 'bg-[#1A2435]', label: language === 'en' ? 'Designer' : 'مصمم' },
    educator: { icon: BookOpen, color: 'from-[#1A2435] to-[#2A3545]', bgColor: 'bg-[#1A2435]', label: language === 'en' ? 'Educator' : 'معلم' }
  };

  const quickActions = [
    { label: language === 'en' ? '🔮 Experience Transformation' : '🔮 اختبر التحول', value: 'experience transformation' },
    { label: language === 'en' ? '📊 View Dashboard' : '📊 اعرض لوحة التحكم', value: 'view dashboard' },
    { label: language === 'en' ? '📚 Learn TwinScience' : '📚 تعلم TwinScience', value: 'learn knowledge' },
    { label: language === 'en' ? '🛠️ Build Use Case' : '🛠️ ابنِ حالة الاستخدام', value: 'build use case' }
  ];

  const PersonaIcon = personaConfig[persona].icon;

  return (
    <div className="fixed inset-0 z-50 bg-white flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#1A2435] backdrop-blur-lg border-b border-[#2A3545] flex items-center justify-between px-6 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <img src="figma:asset/2c14eebd5b8a5df63fd7bfe674c59ce7b12ed179.png" alt="JOSOOR" className="w-10 h-10 object-contain" />
          <div className="h-8 w-px bg-white/20" />
          <div className={`w-10 h-10 bg-gradient-to-br ${personaConfig[persona].color} rounded-xl flex items-center justify-center shadow-md`}>
            <PersonaIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white">Noor AI</h2>
            <p className="text-gray-300">{personaConfig[persona].label} Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Persona Switcher */}
          <div className="flex gap-2">
            {(Object.keys(personaConfig) as NoorPersona[]).map((p) => {
              const Icon = personaConfig[p].icon;
              return (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={`p-2 rounded-lg transition-all ${
                    persona === p 
                      ? `bg-gradient-to-br ${personaConfig[p].color} text-white shadow-md` 
                      : 'bg-gray-100 text-slate-600 hover:text-slate-900 hover:bg-gray-200'
                  }`}
                  title={personaConfig[p].label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-300 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex pt-16">
        {/* Chat Area */}
        <div className={`flex flex-col bg-gray-50 transition-all duration-300 ${
          isCanvasExpanded ? 'w-0 overflow-hidden' : 'flex-1'
        }`}>
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-3 max-w-[85%]">
                    {message.role === 'assistant' && (
                      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${personaConfig[persona].color} rounded-xl flex items-center justify-center shadow-md`}>
                        <PersonaIcon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-[#1A2435] text-white'
                          : 'bg-white text-slate-800 border border-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-line">{message.content}</div>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6 bg-white/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 mb-4">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={language === 'en' ? 'Ask me anything about transformation...' : 'اسألني أي شيء عن التحول...'}
                  className="flex-1 bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 h-12 text-base shadow-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  className={`bg-gradient-to-r ${personaConfig[persona].color} hover:opacity-90 h-12 px-6 shadow-md`}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              {/* Quick Actions */}
              {messages.length <= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(action.value)}
                      className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-slate-700 rounded-lg transition-colors border border-gray-200 shadow-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Canvas Area */}
        <AnimatePresence>
          {canvasMode !== 'welcome' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: isCanvasExpanded ? '100%' : '600px', 
                opacity: 1 
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-l border-gray-200 flex flex-col relative shadow-lg"
            >
              {/* Canvas Header */}
              <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
                <h3 className="text-slate-900">
                  {canvasMode === 'transformation' && (language === 'en' ? 'Transformation Simulation' : 'محاكاة التحول')}
                  {canvasMode === 'dashboard' && (language === 'en' ? 'Executive Dashboard' : 'لوحة التحكم التنفيذية')}
                  {canvasMode === 'knowledge' && (language === 'en' ? 'TwinScience Knowledge' : 'معرفة TwinScience')}
                  {canvasMode === 'builder' && (language === 'en' ? 'Use Case Builder' : 'منشئ حالة الاستخدام')}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCanvasExpanded(!isCanvasExpanded)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    {isCanvasExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCanvasMode('welcome')}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Canvas Content */}
              <ScrollArea className="flex-1 p-6 bg-gray-50">
                {canvasMode === 'transformation' && <TransformationCanvas language={language} />}
                {canvasMode === 'dashboard' && <DashboardCanvas language={language} />}
                {canvasMode === 'knowledge' && <KnowledgeCanvas language={language} />}
                {canvasMode === 'builder' && <BuilderCanvas language={language} />}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Canvas Components
function TransformationCanvas({ language }: { language: Language }) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-[#1A2435]/20 shadow-sm">
        <h4 className="text-xl text-[#1A2435] mb-4">
          {language === 'en' ? '5-Year Transformation Simulation' : 'محاكاة التحول لمدة 5 سنوات'}
        </h4>
        <p className="text-slate-700 mb-4">
          {language === 'en'
            ? 'Watch how organizational complexity evolves and becomes navigable through digital twin technology.'
            : 'شاهد كيف يتطور التعقيد التنظيمي ويصبح قابلاً للتنقل من خلال تقنية ��لتوأم الرقمي.'}
        </p>
        
        {/* Simulated Heatmap */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="aspect-square rounded bg-gradient-to-br from-[#1A2435] to-[#2A3545] shadow-sm"
              style={{ opacity: 0.3 + (Math.random() * 0.7) }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl text-[#1A2435]">847</div>
            <div className="text-xs text-slate-600">{language === 'en' ? 'Initiatives' : 'مبادرات'}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl text-[#1A2435]">34%</div>
            <div className="text-xs text-slate-600">{language === 'en' ? 'Velocity' : 'سرعة'}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-2xl text-green-600">Real-time</div>
            <div className="text-xs text-slate-600">{language === 'en' ? 'Updates' : 'تحديثات'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCanvas({ language }: { language: Language }) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <Badge className="bg-[#1A2435]/10 text-[#1A2435] border-[#1A2435]/20 mb-4">
          {language === 'en' ? 'AI-Powered Insights' : 'رؤى مدعومة بالذكاء'}
        </Badge>
        <h4 className="text-xl text-[#1A2435] mb-2">
          {language === 'en' ? 'Executive Dashboard' : 'لوحة التحكم التنفيذية'}
        </h4>
        <p className="text-sm text-slate-600 mb-4">
          {language === 'en' ? 'Classic title, revolutionary content' : 'عنوان كلاسيكي، محتوى ثوري'}
        </p>

        <div className="space-y-3">
          {[78, 65, 92, 54].map((value, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700">{language === 'en' ? `Metric ${idx + 1}` : `مقياس ${idx + 1}`}</span>
                <span className="text-[#1A2435]">{value}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ delay: idx * 0.2, duration: 1 }}
                  className="h-full bg-gradient-to-r from-[#1A2435] to-[#2A3545]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnowledgeCanvas({ language }: { language: Language }) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
        <h4 className="text-xl text-slate-900 mb-4">TwinScience</h4>
        <p className="text-slate-700 mb-6">
          {language === 'en' 
            ? '4 Chapters • 16 Episodes • 64 Content Pieces'
            : '4 فصول • 16 حلقة • 64 محتوى'}
        </p>
        
        <div className="space-y-2">
          {['Chapter 1: Foundations', 'Chapter 2: Architecture', 'Chapter 3: Implementation', 'Chapter 4: Evolution'].map((chapter, idx) => (
            <button
              key={idx}
              className="w-full p-4 bg-white hover:bg-green-50 rounded-lg text-left transition-all border border-gray-200 hover:border-green-300 shadow-sm"
            >
              <div className="text-slate-900">{chapter}</div>
              <div className="text-slate-600 mt-1">4 episodes • 16 pieces</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuilderCanvas({ language }: { language: Language }) {
  return (
    <div className="space-y-4">
      <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm">
        <h4 className="text-xl text-slate-900 mb-4">
          {language === 'en' ? 'Build Your UC001' : 'ابن UC001 الخاص بك'}
        </h4>
        
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm text-slate-600 mb-2">{language === 'en' ? 'Step 1: Define Use Case' : 'الخطوة 1: حدد حالة الاستخدام'}</div>
            <Input placeholder={language === 'en' ? 'e.g., Smart City Traffic Management' : 'مثال: إدارة حركة المرور الذكية'} className="bg-white border-gray-300" />
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm text-slate-600 mb-2">{language === 'en' ? 'Step 2: Generate DTDL' : 'الخطوة 2: إنشاء DTDL'}</div>
            <pre className="text-xs text-[#1A2435] bg-slate-50 p-3 rounded overflow-x-auto border border-gray-200">
{`{
  "@id": "dtmi:example:SmartCity;1",
  "@type": "Interface",
  "contents": [...]
}`}
            </pre>
          </div>

          <Button className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md">
            {language === 'en' ? 'Download Mini Digital Twin' : 'تنزيل التوأم ��لرقمي الصغير'}
          </Button>
        </div>
      </div>
    </div>
  );
}
