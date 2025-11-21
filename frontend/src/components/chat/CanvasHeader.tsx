import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  ShareIcon,
  PrinterIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

interface CanvasHeaderProps {
  title: string;
  onClose?: () => void;
  onZenToggle?: () => void;
  isZenMode?: boolean;
  onAction?: (action: 'share' | 'print' | 'save' | 'download') => void;
  hideClose?: boolean;
  onToggleComments?: () => void;
  showComments?: boolean;
}

export function CanvasHeader({ 
  title, 
  onClose, 
  onZenToggle, 
  isZenMode = false, 
  onAction,
  hideClose = false,
  onToggleComments,
  showComments = false
}: CanvasHeaderProps) {
  const { language } = useLanguage();

  const translations = {
    share: language === 'ar' ? 'مشاركة' : 'Share',
    print: language === 'ar' ? 'طباعة' : 'Print',
    save: language === 'ar' ? 'حفظ' : 'Save',
    download: language === 'ar' ? 'تحميل' : 'Download',
    enterZenMode: language === 'ar' ? 'وضع التركيز' : 'Enter Zen Mode',
    exitZenMode: language === 'ar' ? 'خروج من وضع التركيز' : 'Exit Zen Mode',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    comments: language === 'ar' ? 'التعليقات' : 'Comments',
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-8 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full shrink-0" />
        <h2 className="text-lg font-semibold text-gray-900 truncate" title={title}>
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        {onAction && (
          <>
            <button 
              onClick={() => onAction('share')}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title={translations.share}
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onAction('print')}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title={translations.print}
            >
              <PrinterIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onAction('save')}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title={translations.save}
            >
              <BookmarkIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onAction('download')}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title={translations.download}
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
          </>

        )}

        {onToggleComments && (
          <button
            onClick={onToggleComments}
            className={`p-2 rounded-lg transition-colors ${
              showComments 
                ? 'text-amber-600 bg-amber-50' 
                : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
            }`}
            title={translations.comments}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </button>
        )}

        {onZenToggle && (
          <button 
            onClick={onZenToggle}
            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={isZenMode ? translations.exitZenMode : translations.enterZenMode}
          >
            {isZenMode ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
        )}

        {!hideClose && onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={translations.close}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
