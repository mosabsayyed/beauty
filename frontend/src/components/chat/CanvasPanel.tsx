/**
 * CanvasPanel Component - PREMIUM UPGRADE
 * 
 * Slide-out panel for viewing artifacts with:
 * - Glassmorphism effects
 * - Framer Motion animations
 * - Action buttons (Share, Print, Save, Download)
 * - Responsive inline/overlay modes
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalCanvas } from './UniversalCanvas';
import { CanvasHeader } from './CanvasHeader';
import { CommentsSection } from './CommentsSection';
import { Artifact } from '../../types/api';
import { shareArtifact, printArtifact, saveArtifact, downloadArtifact } from '../../utils/canvasActions';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CanvasPanelProps {
  artifacts: Artifact[];
  onClose?: () => void;
  mode?: 'inline' | 'overlay';
  isOpen?: boolean;
  initialIndex?: number;
}

export function CanvasPanel({ 
  artifacts = [], 
  onClose, 
  mode = 'overlay',
  isOpen = true,
  initialIndex = 0
}: CanvasPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Update current index when initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < artifacts.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, artifacts.length]);

  const currentArtifact = artifacts[currentIndex];
  const hasMultiple = artifacts.length > 1;

  const handleNext = () => {
    if (currentIndex < artifacts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleZenMode = () => setIsZenMode(!isZenMode);
  const toggleComments = () => setShowComments(!showComments);

  const handleAction = (action: 'share' | 'print' | 'save' | 'download') => {
    if (!currentArtifact) return;
    
    switch (action) {
      case 'share': shareArtifact(currentArtifact); break;
      case 'print': printArtifact(); break;
      case 'save': saveArtifact(currentArtifact); break;
      case 'download': downloadArtifact(currentArtifact); break;
    }
  };

  const NavigationControls = () => (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className={`p-1 rounded-full ${currentIndex === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="text-xs text-gray-500 font-medium">
        {currentIndex + 1} / {artifacts.length}
      </span>
      <button
        onClick={handleNext}
        disabled={currentIndex === artifacts.length - 1}
        className={`p-1 rounded-full ${currentIndex === artifacts.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );

  // Inline Mode
  if (mode === 'inline') {
    return (
      <div className={`border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col max-w-5xl ${isZenMode ? 'fixed inset-0 z-50 m-0 rounded-none h-full w-full' : 'h-full w-[45%] min-w-[600px]'}`}>
        <CanvasHeader 
          title={currentArtifact?.title || 'Canvas'} 
          onClose={onClose}
          onZenToggle={toggleZenMode}
          isZenMode={isZenMode}
          onAction={handleAction}
          hideClose={!onClose}
          onToggleComments={toggleComments}
          showComments={showComments}
        />
        {hasMultiple && <NavigationControls />}
        <div className="flex-1 flex overflow-hidden relative">
          <div className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${showComments ? 'w-2/3' : 'w-full'}`}>
            {currentArtifact ? (
              <div className="h-full w-full p-6">
                <UniversalCanvas 
                  content={currentArtifact.content} 
                  title={currentArtifact.title}
                  type={currentArtifact.artifact_type?.toLowerCase()}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select an item to view details
              </div>
            )}
          </div>
          {showComments && (
            <div className="w-1/3 border-l border-gray-200 bg-white h-full overflow-hidden transition-all duration-300">
               <CommentsSection artifactId={currentArtifact?.title || 'demo'} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Overlay Mode
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              width: isZenMode ? '100vw' : (showComments ? '60%' : '45%'),
              maxWidth: isZenMode ? '100vw' : '1200px'
            }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 ${
              isZenMode ? 'glass-panel' : ''
            }`}
            style={{
               // Width handled by motion.div animate prop
            }}
          >
            {/* Header */}
            <CanvasHeader 
              title={currentArtifact?.title || 'Canvas'} 
              onClose={onClose}
              onZenToggle={toggleZenMode}
              isZenMode={isZenMode}
              onAction={handleAction}
              onToggleComments={toggleComments}
              showComments={showComments}
            />
            {hasMultiple && <NavigationControls />}

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {currentArtifact ? (
                  <div className="h-full w-full p-6">
                    <UniversalCanvas 
                      content={currentArtifact.content} 
                      title={currentArtifact.title}
                      type={currentArtifact.artifact_type?.toLowerCase()}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No content to display
                  </div>
                )}
              </div>
              {showComments && (
                <div className="w-80 border-l border-gray-200 bg-gray-50 h-full overflow-hidden flex-shrink-0">
                   <CommentsSection artifactId={currentArtifact?.title || 'demo'} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
