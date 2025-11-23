import { Language } from '../types';
import { HeroSection } from '../components/HeroSection';
import { DigitalTwinSection } from '../components/DigitalTwinSection';
import { JosoorArchitecture } from '../components/JosoorArchitecture';
import { SystemsArchitectRole } from '../components/SystemsArchitectRole';
import { TwinScienceTeaser } from '../components/TwinScienceTeaser';
import { TwinStudioTeaser } from '../components/TwinStudioTeaser';
import { FoundersLetter } from '../components/FoundersLetter';
import { Footer } from '../components/Footer';

interface LandingPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LandingPage({ language, onLanguageChange }: LandingPageProps) {
  const handleExplore = () => {
    const digitalTwinSection = document.querySelector('section');
    if (digitalTwinSection) {
      const offset = 80;
      const elementPosition = digitalTwinSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset + window.innerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <HeroSection language={language} onExplore={handleExplore} />
      <DigitalTwinSection language={language} />
      <JosoorArchitecture language={language} />
      <SystemsArchitectRole language={language} />
      <TwinScienceTeaser language={language} />
      <TwinStudioTeaser language={language} />
      <FoundersLetter language={language} />
      <Footer language={language} onLanguageChange={onLanguageChange} />
    </>
  );
}
