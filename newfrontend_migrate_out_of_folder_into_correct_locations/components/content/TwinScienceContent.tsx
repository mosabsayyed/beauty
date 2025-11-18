import { TwinSciencePage } from '../../pages/TwinSciencePage';
import { Language } from '../../types';

interface TwinScienceContentProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

// Content wrapper for TwinScience page
// This allows the page to be rendered as content within Noor's canvas
export function TwinScienceContent({ language, onLanguageChange }: TwinScienceContentProps) {
  return (
    <div className="p-6">
      <TwinSciencePage language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
