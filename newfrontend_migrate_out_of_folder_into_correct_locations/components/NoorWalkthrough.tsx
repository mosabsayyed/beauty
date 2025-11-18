import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Language } from '../types';
import { Button } from './ui/button';
import { walkthroughTranslations } from '../data/walkthrough-translations';

interface NoorWalkthroughProps {
  language: Language;
  onClose: () => void;
  onStepChange?: (step: number) => void;
}

type HighlightTarget = 'header' | 'personas' | 'chat' | 'canvas' | 'actions' | 'none';

export function NoorWalkthrough({ language, onClose, onStepChange }: NoorWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' | 'left' | 'right' });

  // Import steps from translations file for easy editing
  const steps = walkthroughTranslations.steps;
  const buttons = walkthroughTranslations.buttons[language];
  
  // Old inline steps array (kept for reference, but replaced by import above)
  const _oldSteps: Array<{
    en: { title: string; description: string; highlight: HighlightTarget };
    ar: { title: string; description: string; highlight: HighlightTarget };
  }> = [
    {
      en: {
        title: 'Welcome to Noor AI',
        description: 'Noor is your AI guide through the TwinLife experience. This quick tutorial will show you how to navigate and make the most of this platform.',
        highlight: 'header'
      },
      ar: {
        title: 'مرحباً بك في نور AI',
        description: 'نور هو دليلك بالذكاء الاصطناعي عبر تجربة التوأمة الحية. سيوضح لك هذا البرنامج التعليمي السريع كيفية التنقل وتحقيق أقصى استفادة من هذه المنصة.',
        highlight: 'header'
      }
    },
    {
      en: {
        title: 'Choose Your Persona',
        description: 'Noor has 4 different modes:\n\n✨ Assistant - General guidance\n📊 Analyst - Data insights\n🛠️ Designer - Build use cases\n📚 Educator - Learn concepts\n\nClick any icon to switch modes!',
        highlight: 'personas'
      },
      ar: {
        title: 'اختر شخصيتك',
        description: 'نور لديها 4 أوضاع مختلفة:\n\n✨ مساعد - توجيه عام\n📊 محلل - رؤى البيانات\n🛠️ مصمم - بناء حالات الاستخدام\n📚 معلم - تعلم المفاهيم\n\nانقر على أي أيقونة للتبديل بين الأوضاع!',
        highlight: 'personas'
      }
    },
    {
      en: {
        title: 'Chat with Noor',
        description: 'Type your questions or requests in the chat area. Noor understands natural language in both English and Arabic.\n\nTry asking about:\n• Transformation simulations\n• Executive dashboards\n• TwinScience knowledge\n• Building your own use case',
        highlight: 'chat'
      },
      ar: {
        title: 'تحدث مع نور',
        description: 'اكتب أسئلتك أو طلباتك في منطقة الدردشة. نور يفهم اللغة الطبيعية باللغتين الإنجليزية والعربية.\n\nجرب السؤال عن:\n• محاكاة التحول\n• لوحات التحكم التنفيذية\n• معرفة TwinScience\n• بناء حالة الاستخدام الخاصة بك',
        highlight: 'chat'
      }
    },
    {
      en: {
        title: 'The Dynamic Canvas',
        description: 'When you request something specific, Noor opens a dynamic canvas on the right side.\n\nThe canvas shows:\n• Live simulations\n• Interactive dashboards\n• Knowledge chapters\n• Use case builders\n\nYou can expand/minimize it anytime!',
        highlight: 'canvas'
      },
      ar: {
        title: 'اللوحة الديناميكية',
        description: 'عندما تطلب شيئًا محددًا، تفتح نور لوحة ديناميكية على الجانب الأيمن.\n\nتعرض اللوحة:\n• محاكاة مباشرة\n• لوحات تحكم تفاعلية\n• فصول المعرفة\n• منشئي حالات الاستخدام\n\nيمكنك توسيعها/تصغيرها في أي وقت!',
        highlight: 'canvas'
      }
    },
    {
      en: {
        title: 'Quick Action Buttons',
        description: 'Use the quick action buttons below the chat input for instant access to key features:\n\n🔮 Experience Transformation\n📊 View Dashboard\n📚 Learn TwinScience\n🛠️ Build Use Case\n\nThese appear when you start a new session.',
        highlight: 'actions'
      },
      ar: {
        title: 'أزرار الإجراءات السريعة',
        description: 'استخدم أزرار الإجراءات السريعة أسفل إدخال الدردشة ل��وصول الفوري إلى الميزات الرئيسية:\n\n🔮 اختبر التحول\n📊 اعرض لوحة التحكم\n📚 تعلم TwinScience\n🛠️ ابنِ حالة الاستخدام\n\nتظهر هذه عند بدء جلسة جديدة.',
        highlight: 'actions'
      }
    },
    {
      en: {
        title: 'Start New Conversations',
        description: 'You can start fresh conversations at any time. Your previous sessions are saved (if you\'re logged in).\n\nTip: Each persona mode remembers context, so your conversation flows naturally as you explore different areas!',
        highlight: 'none'
      },
      ar: {
        title: 'ابدأ محادثات جديدة',
        description: 'يمكنك بدء محادثات جديدة في أي وقت. يتم حفظ جلساتك السابقة (إذا كنت مسجلاً للدخول).\n\nنصيحة: كل وضع شخصية يتذكر السياق، لذا تتدفق محادثتك بشكل طبيعي أثناء استكشافك لمناطق مختلفة!',
        highlight: 'none'
      }
    }
  ];

  const t = steps[currentStep][language];
  const totalSteps = steps.length;
  const currentHighlight = t.highlight;

  // Update highlight position when step changes
  useEffect(() => {
    if (currentHighlight === 'none') {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(`[data-walkthrough="${currentHighlight}"]`);
    if (element) {
      // Scroll element into view smoothly
      // For "actions", scroll to ensure it's near bottom with space above for tooltip
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: 'smooth',
        block: currentHighlight === 'actions' ? 'end' : 'center'
      };
      element.scrollIntoView(scrollOptions);
      
      // Wait for scroll to complete before calculating position
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);

      // Calculate tooltip position
      const padding = 20;
      const tooltipWidth = 600;
      const tooltipHeight = 320;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

      // Special handling for "actions" - always place above
      if (currentHighlight === 'actions') {
        top = rect.top - padding - tooltipHeight;
        // If it goes off top, adjust
        if (top < padding) {
          top = padding;
        }
        left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
        placement = 'top';
      }
      // Try to place below first
      else if (rect.bottom + padding + tooltipHeight < viewportHeight) {
        top = rect.bottom + padding;
        left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
        placement = 'bottom';
      }
      // Try above
      else if (rect.top - padding - tooltipHeight > 0) {
        top = rect.top - padding - tooltipHeight;
        left = Math.max(padding, Math.min(rect.left, viewportWidth - tooltipWidth - padding));
        placement = 'top';
      }
      // Try right
      else if (rect.right + padding + tooltipWidth < viewportWidth) {
        top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
        left = rect.right + padding;
        placement = 'right';
      }
      // Try left
      else if (rect.left - padding - tooltipWidth > 0) {
        top = Math.max(padding, Math.min(rect.top, viewportHeight - tooltipHeight - padding));
        left = rect.left - padding - tooltipWidth;
        placement = 'left';
      }
      // Fallback: center
      else {
        top = (viewportHeight - tooltipHeight) / 2;
        left = (viewportWidth - tooltipWidth) / 2;
        placement = 'bottom';
      }

        setTooltipPosition({ top, left, placement });
      }, 300); // Match scroll animation duration
    }
  }, [currentStep, currentHighlight]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ pointerEvents: 'none' }}>
        {/* Spotlight Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        >
          {/* Dark overlay with cutout for highlighted element */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {highlightRect && (
                  <rect
                    x={highlightRect.left - 8}
                    y={highlightRect.top - 8}
                    width={highlightRect.width + 16}
                    height={highlightRect.height + 16}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.7)" mask="url(#spotlight-mask)" />
          </svg>

          {/* Highlight border with pulse */}
          {highlightRect && (
            <>
              {/* Outer pulse ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: [0.3, 0, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute border-4 border-[#D4AF37] rounded-xl"
                style={{
                  left: highlightRect.left - 12,
                  top: highlightRect.top - 12,
                  width: highlightRect.width + 24,
                  height: highlightRect.height + 24,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Main border */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute border-4 border-[#D4AF37] rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                style={{
                  left: highlightRect.left - 8,
                  top: highlightRect.top - 8,
                  width: highlightRect.width + 16,
                  height: highlightRect.height + 16,
                  pointerEvents: 'none'
                }}
              />
            </>
          )}
        </motion.div>

        {/* Tutorial Card - Positioned Dynamically */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: currentHighlight === 'none' ? '50%' : tooltipPosition.top,
            left: currentHighlight === 'none' ? '50%' : tooltipPosition.left,
            x: currentHighlight === 'none' ? '-50%' : 0,
            y: currentHighlight === 'none' ? '-50%' : 0
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="absolute w-full max-w-2xl"
          style={{ 
            pointerEvents: 'auto',
            ...(currentHighlight === 'none' ? {} : { maxWidth: '600px' })
          }}
        >
          <div className="relative">
            {/* Pointer Arrow */}
            {currentHighlight !== 'none' && (
              <div 
                className="absolute w-4 h-4 bg-white border-2 border-[#D4AF37]/30 rotate-45"
                style={{
                  ...(tooltipPosition.placement === 'bottom' && {
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    borderBottom: 'none',
                    borderRight: 'none'
                  }),
                  ...(tooltipPosition.placement === 'top' && {
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    borderTop: 'none',
                    borderLeft: 'none'
                  }),
                  ...(tooltipPosition.placement === 'right' && {
                    left: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    borderRight: 'none',
                    borderBottom: 'none'
                  }),
                  ...(tooltipPosition.placement === 'left' && {
                    right: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    borderLeft: 'none',
                    borderTop: 'none'
                  })
                }}
              />
            )}
            
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#D4AF37]/30 overflow-hidden relative z-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A2435] to-[#2A3545] p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-sm opacity-75 mb-1">
                    {buttons.stepCounter(currentStep + 1, totalSteps)}
                  </div>
                  <h2 className="text-2xl">{t.title}</h2>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white/70 hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  className="h-full bg-[#D4AF37]"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="text-slate-700 whitespace-pre-line leading-relaxed mb-6">
                {t.description}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3">
                {language === 'en' ? (
                  <>
                    <Button
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      variant="outline"
                      className="flex-1 border-[#1A2435]/20 text-[#1A2435] disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {buttons.previous}
                    </Button>

                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="text-slate-600"
                    >
                      {buttons.skip}
                    </Button>

                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-[#1A2435] to-[#2A3545] text-white"
                    >
                      {currentStep === totalSteps - 1 ? buttons.getStarted : buttons.next}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-[#1A2435] to-[#2A3545] text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {currentStep === totalSteps - 1 ? buttons.getStarted : buttons.next}
                    </Button>

                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="text-slate-600"
                    >
                      {buttons.skip}
                    </Button>

                    <Button
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      variant="outline"
                      className="flex-1 border-[#1A2435]/20 text-[#1A2435] disabled:opacity-50"
                    >
                      {buttons.previous}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
