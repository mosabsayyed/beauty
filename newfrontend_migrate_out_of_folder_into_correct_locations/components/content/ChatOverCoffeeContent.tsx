import { ChatOverCoffeePage } from '../../pages/ChatOverCoffeePage';
import { Language } from '../../types';

interface ChatOverCoffeeContentProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

// Content wrapper for Chat Over Coffee page
// This allows the page to be rendered as content within Noor's canvas
export function ChatOverCoffeeContent({ language, onLanguageChange }: ChatOverCoffeeContentProps) {
  return (
    <div className="p-6">
      <ChatOverCoffeePage language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
