import { Info, Coffee, Users, Lightbulb, Wrench, MessageCircle, BookOpen, Video } from 'lucide-react';
import { Language } from '../../types';

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: { en: string; ar: string };
  command: { en: string; ar: string };
  category: 'learn' | 'explore' | 'tools' | 'connect';
}

const quickActions: QuickAction[] = [
  // LEARN
  {
    id: 'josoor',
    icon: Info,
    label: { en: 'What is JOSOOR?', ar: 'ما هو جسور؟' },
    command: { en: 'Explain JOSOOR', ar: 'اشرح جسور' },
    category: 'learn'
  },
  {
    id: 'twinscience',
    icon: BookOpen,
    label: { en: 'TwinScience Methodology', ar: 'منهجية العلم المزدوج' },
    command: { en: 'Show me TwinScience', ar: 'أرني العلم المزدوج' },
    category: 'learn'
  },
  {
    id: 'cognitive-gov',
    icon: Lightbulb,
    label: { en: 'Cognitive Government', ar: 'الحكومة الإدراكية' },
    command: { en: 'Explain cognitive government', ar: 'اشرح الحكومة الإدراكية' },
    category: 'learn'
  },
  
  // EXPLORE
  {
    id: 'coffee',
    icon: Coffee,
    label: { en: 'Chat Over Coffee', ar: 'دردشة على قهوة' },
    command: { en: "Let's chat over coffee", ar: 'لنتحدث على قهوة' },
    category: 'explore'
  },
  {
    id: 'parallel-universe',
    icon: Video,
    label: { en: 'Parallel Universe', ar: 'الكون الموازي' },
    command: { en: 'Show parallel universe video', ar: 'أرني فيديو الكون الموازي' },
    category: 'explore'
  },
  {
    id: 'origins',
    icon: Users,
    label: { en: 'Origins & Founders', ar: 'الأصول والمؤسسون' },
    command: { en: 'Tell me about the founders', ar: 'أخبرني عن المؤسسين' },
    category: 'explore'
  },
  
  // TOOLS
  {
    id: 'twinstudio',
    icon: Wrench,
    label: { en: 'TwinStudio Tools', ar: 'أدوات الاستوديو المزدوج' },
    command: { en: 'Show me TwinStudio', ar: 'أرني الاستوديو المزدوج' },
    category: 'tools'
  },
  {
    id: 'architecture',
    icon: Lightbulb,
    label: { en: 'Systems Architecture', ar: 'هندسة الأنظمة' },
    command: { en: 'Explain our architecture approach', ar: 'اشرح نهج الهندسة' },
    category: 'tools'
  },
  
  // CONNECT
  {
    id: 'team',
    icon: Users,
    label: { en: 'Meet the Team', ar: 'تعرف على الفريق' },
    command: { en: 'Who is the team?', ar: 'من هو الفريق؟' },
    category: 'connect'
  },
  {
    id: 'join',
    icon: MessageCircle,
    label: { en: 'Join TwinLife', ar: 'انضم لحياة التوأم' },
    command: { en: 'How can I join?', ar: 'كيف يمكنني الانضمام؟' },
    category: 'connect'
  }
];

const categoryLabels = {
  learn: { en: 'Learn', ar: 'تعلّم' },
  explore: { en: 'Explore', ar: 'استكشف' },
  tools: { en: 'Tools', ar: 'أدوات' },
  connect: { en: 'Connect', ar: 'تواصل' }
};

interface QuickActionsMenuProps {
  language: Language;
  onActionClick: (command: string) => void;
  isCollapsed?: boolean;
}

export function QuickActionsMenu({ language, onActionClick, isCollapsed = false }: QuickActionsMenuProps) {
  const categories = ['learn', 'explore', 'tools', 'connect'] as const;
  
  return (
    <div 
      className={`flex flex-col gap-6 p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200 ${
        isCollapsed ? 'w-20' : 'w-72'
      } transition-all duration-300`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <h3 className="text-[#1A2435]">
            {language === 'en' ? 'Quick Actions' : 'إجراءات سريعة'}
          </h3>
        )}
      </div>

      {categories.map(category => {
        const categoryActions = quickActions.filter(a => a.category === category);
        
        return (
          <div key={category} className="space-y-2">
            {!isCollapsed && (
              <p className="text-sm text-[#1A2435]/60 mb-2">
                {categoryLabels[category][language]}
              </p>
            )}
            <div className="space-y-1">
              {categoryActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => onActionClick(action.command[language])}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isCollapsed ? 'justify-center' : ''
                  } hover:bg-[#1A2435]/10 text-[#1A2435] group`}
                  title={isCollapsed ? action.label[language] : undefined}
                >
                  <action.icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  {!isCollapsed && (
                    <span className="text-sm text-left">{action.label[language]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
