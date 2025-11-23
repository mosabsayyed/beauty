import { TwinStudioPage } from '../../pages/TwinStudioPage';
import { Language } from '../../types';

interface TwinStudioContentProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

// Content wrapper for TwinStudio page
// This allows the page to be rendered as content within Noor's canvas
export function TwinStudioContent({ language, onLanguageChange }: TwinStudioContentProps) {
  return (
    <div className="p-6">
      <TwinStudioPage language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
