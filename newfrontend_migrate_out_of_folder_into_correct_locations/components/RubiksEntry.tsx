import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Language } from '../types';

interface RubiksEntryProps {
  language: Language;
}

export function RubiksEntry({ language }: RubiksEntryProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Check if animation has been seen before
    const hasSeenAnimation = localStorage.getItem('josoor_seen_rubiks');
    
    if (hasSeenAnimation) {
      // Skip directly to login for returning visitors
      navigate('/experience/login');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Mark animation as seen
          localStorage.setItem('josoor_seen_rubiks', 'true');
          // Navigate to login
          setTimeout(() => navigate('/experience/login'), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleSkip = () => {
    localStorage.setItem('josoor_seen_rubiks', 'true');
    navigate('/experience/login');
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-4xl px-8">
        {/* Animated cube placeholder */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 border-4 border-blue-400 animate-spin" style={{ animationDuration: '8s' }}></div>
            <div className="absolute inset-4 border-4 border-purple-400 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-8 border-4 border-cyan-400 animate-spin" style={{ animationDuration: '4s' }}></div>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="mb-6 text-shadow-glow"
          style={{
            fontFamily: '"Allerta Stencil", sans-serif',
            fontSize: '5rem',
            lineHeight: '1.1',
            textShadow: '0 0 3px rgba(255,255,255,0.544), 0 0 18px rgba(76,201,255,0.544), 0 0 40px rgba(76,201,255,0.52), 0 0 84px rgba(30,144,255,0.488)'
          }}
        >
          JOSOOR
        </h1>

        <h2 className="text-blue-400 uppercase tracking-wider mb-6 text-2xl">
          The Cognitive Transformation Bridge
        </h2>

        <p className="text-xl mb-12 leading-relaxed max-w-2xl mx-auto text-gray-300">
          {countdown > 0 ? (
            <>Transforming complexity into clarity. Beginning your journey in {countdown}...</>
          ) : (
            <>Entering the AI-first experience...</>
          )}
        </p>

        {/* Skip button */}
        {countdown > 0 && (
          <button
            onClick={handleSkip}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50"
          >
            Skip to Experience
          </button>
        )}

        {/* Note about full animation */}
        <p className="mt-12 text-sm text-gray-500 italic">
          Note: Full Rubik's cube animation available at deployment
        </p>
      </div>
    </div>
  );
}
