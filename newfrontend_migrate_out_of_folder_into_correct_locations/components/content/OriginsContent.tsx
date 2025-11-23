import { OriginsPage } from '../../pages/OriginsPage';
import { Language } from '../../types';

interface OriginsContentProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

// Content wrapper for Origins page (Founder's Letter)
// This allows the page to be rendered as content within Noor's canvas
export function OriginsContent({ language, onLanguageChange }: OriginsContentProps) {
  return (
    <div className="p-6">
      <OriginsPage language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
