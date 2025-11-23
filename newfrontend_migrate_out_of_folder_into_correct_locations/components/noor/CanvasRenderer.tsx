import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Language } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

type CanvasMode = 'partial' | 'full' | 'closed';

interface CanvasRendererProps {
  language: Language;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  children: React.ReactNode;
  title?: string;
}

export function CanvasRenderer({ language, mode, onModeChange, children, title }: CanvasRendererProps) {
  if (mode === 'closed') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: language === 'ar' ? -100 : 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: language === 'ar' ? -100 : 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed ${language === 'ar' ? 'left-0' : 'right-0'} top-20 bottom-0 bg-white shadow-2xl ${
          mode === 'full' ? 'w-full' : 'w-[60%]'
        } z-40 overflow-hidden flex flex-col`}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#1A2435] text-white">
          <h2 className="text-xl">
            {title || (language === 'en' ? 'Content' : 'المحتوى')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onModeChange(mode === 'full' ? 'partial' : 'full')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={mode === 'full' 
                ? (language === 'en' ? 'Minimize' : 'تصغير')
                : (language === 'en' ? 'Maximize' : 'تكبير')
              }
            >
              {mode === 'full' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onModeChange('closed')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={language === 'en' ? 'Close' : 'إغلاق'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Return to Noor Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onModeChange('closed')}
            className="w-full py-3 px-6 bg-[#1A2435] text-white rounded-lg hover:bg-[#1A2435]/90 transition-all hover:scale-105"
          >
            {language === 'en' ? '← Return to Noor' : 'العودة إلى نور ←'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
