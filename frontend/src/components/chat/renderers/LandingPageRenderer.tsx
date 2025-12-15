
import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LandingPageData } from '../../../data/landingPages';

interface LandingPageRendererProps {
  data: LandingPageData;
  onStart: () => void;
}

export const LandingPageRenderer: React.FC<LandingPageRendererProps> = ({ data, onStart }) => {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-[#111827] text-[#F9FAFB]">
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* Icon Circle */}
        <div className="w-32 h-32 rounded-full bg-[#1F2937] border-2 border-[#374151] flex items-center justify-center shadow-lg mb-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src={data.icon} 
            alt={data.title[language]} 
            className="w-16 h-16 object-contain opacity-90 group-hover:scale-110 transition-transform duration-500" 
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          {data.title[language]}
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-lg">
          {data.description[language]}
        </p>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#111827] mt-8 overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
          <span className="relative flex items-center gap-2">
            {data.buttonText[language]}
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

      </div>
    </div>
  );
};
