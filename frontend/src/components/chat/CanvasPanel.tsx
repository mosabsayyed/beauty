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
import '../../canvas.css';
import { useLanguage } from '../../contexts/LanguageContext';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';
import { UniversalCanvas } from './UniversalCanvas';
import { CanvasHeader } from './CanvasHeader';
import { CommentsSection } from './CommentsSection';
import { Artifact } from '../../types/api';
import { shareArtifact, printArtifact, downloadArtifact } from '../../utils/canvasActions';
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

  // Debug: when canvas opens, scan for elements with non-transparent backgrounds
  useEffect(() => {
    if (!panelRef.current) return;
    const scan = () => {
      try {
        const els = Array.from(panelRef.current!.querySelectorAll('*')) as HTMLElement[];
        const offenders: Array<{ el: HTMLElement; bg: string; node: string }> = [];
        els.forEach(el => {
          const cs = window.getComputedStyle(el);
          const bg = cs.getPropertyValue('background-color') || cs.getPropertyValue('background');
          const img = cs.getPropertyValue('background-image');
          if (img && img !== 'none') {
            offenders.push({ el, bg: 'image', node: el.outerHTML.slice(0,200) });
          } else if (bg && bg !== 'transparent' && !/^rgba\(0,\s*0,\s*0,\s*0\)/.test(bg) && bg !== 'rgba(0, 0, 0, 0)') {
            // check alpha channel if rgba
            const match = bg.match(/rgba?\(([^)]+)\)/);
            if (match) {
              const parts = match[1].split(',').map(p => p.trim());
              const alpha = parts.length === 4 ? parseFloat(parts[3]) : 1;
              if (alpha > 0) offenders.push({ el, bg, node: el.outerHTML.slice(0,200) });
            } else {
              // non-rgba opaque color
              offenders.push({ el, bg, node: el.outerHTML.slice(0,200) });
            }
          }
        });
        if (offenders.length) {
          console.warn('[CanvasPanel DEBUG] Found elements with non-transparent backgrounds inside canvas:', offenders);
        } else {

        }
      } catch (e) {
        console.error('[CanvasPanel DEBUG] Scan failed', e);
      }
    };

    // Run scan shortly after open to allow children to render
    const t = setTimeout(scan, 500);
    return () => clearTimeout(t);
  }, [panelRef, isZenMode]);

  // Update current index when initialIndex changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < artifacts.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, artifacts.length]);

  // Auto-trigger Zen mode for Graphv001
  useEffect(() => {
    if (artifacts[currentIndex]?.artifact_type === 'GRAPHV001') {
      setIsZenMode(true);
    }
  }, [currentIndex, artifacts]);

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
      case 'download': downloadArtifact(currentArtifact); break;
    }
  };

  const { isRTL, language } = useLanguage();
  const translations = language === 'ar' ? ar : en;

  const NavigationControls = () => (
    <div className="canvas-nav-controls">
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        style={{ padding: '0.25rem', cursor: currentIndex === 0 ? 'default' : 'pointer', color: currentIndex === 0 ? '#D1D5DB' : '#4B5563' }} className={currentIndex === 0 ? 'clickable' : 'clickable header-button'}
      >
        {isRTL ? <ChevronRightIcon style={{ width: '1.25rem', height: '1.25rem' }} /> : <ChevronLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />}
      </button>
      <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>
        {currentIndex + 1} / {artifacts.length}
      </span>
      <button
        onClick={handleNext}
        disabled={currentIndex === artifacts.length - 1}
        style={{ padding: '0.25rem', cursor: currentIndex === artifacts.length - 1 ? 'default' : 'pointer', color: currentIndex === artifacts.length - 1 ? '#D1D5DB' : '#4B5563' }} className={currentIndex === artifacts.length - 1 ? 'clickable' : 'clickable header-button'}
      >
        {isRTL ? <ChevronLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} /> : <ChevronRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />}
      </button>
    </div>
  );

  // Inline Mode
    if (mode === 'inline') {
    return (
      <div className="canvas-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', maxWidth: isZenMode ? 'none' : '80rem', overflow: 'visible', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', position: isZenMode ? 'fixed' : 'relative', inset: isZenMode ? 0 : 'auto', zIndex: isZenMode ? 50 : 'auto', margin: isZenMode ? 0 : 'auto', height: isZenMode ? '100%' : '100%', width: isZenMode ? '100%' : '45%', minWidth: isZenMode ? 'auto' : '600px' }}>
          <CanvasHeader 
            title={currentArtifact?.title || translations.canvas} 
            onClose={onClose}
            onZenToggle={toggleZenMode}
            isZenMode={isZenMode}
            onAction={handleAction}
            hideClose={!onClose}
            onToggleComments={toggleComments}
            showComments={showComments}
            showLanguageToggle={currentArtifact?.artifact_type === 'TWIN_KNOWLEDGE'}
          />
        {hasMultiple && <NavigationControls />}
        <div style={{ flex: 1, display: 'flex', overflow: 'visible', position: 'relative' }}>
          <div className={currentArtifact?.artifact_type === 'GRAPHV001' ? 'glass' : 'canvas-content glass'} style={{ flex: 1, overflowY: 'auto', transition: 'all 0.3s', width: showComments ? '66.666%' : '100%', padding: currentArtifact?.artifact_type === 'GRAPHV001' ? 0 : undefined }}>
            {currentArtifact ? (
              <div style={{ height: '100%', width: '100%', padding: currentArtifact?.artifact_type === 'GRAPHV001' ? 0 : '1.5rem' }}>
                <UniversalCanvas 
                  content={currentArtifact.content} 
                  title={currentArtifact.title}
                  type={currentArtifact.artifact_type?.toLowerCase()}
                />
              </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
                {translations.select_item_to_view}
              </div>
            )}
          </div>
          {showComments && (
            <div className="canvas-sidebar" style={{ width: '33.333%', height: '100%', overflow: 'hidden', transition: 'all 0.3s' }}>
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
            className="canvas-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          
          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: isRTL ? '-100%' : '100%', opacity: 0.5 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              width: isZenMode ? '100vw' : (showComments ? '60%' : '45%'),
              maxWidth: isZenMode ? '100vw' : '1200px'
            }}
            exit={{ x: isRTL ? '-100%' : '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="canvas-panel glass-panel clickable" 
            style={{ 
              position: 'fixed', 
              top: 0, 
              height: '100%', 
              zIndex: 50, 
              display: 'flex', 
              flexDirection: 'column',
              right: isRTL ? 'auto' : 0,
              left: isRTL ? 0 : 'auto'
            }}
          >
            {/* Header */}
            <CanvasHeader 
              title={currentArtifact?.title || translations.canvas} 
              onClose={onClose}
              onZenToggle={toggleZenMode}
              isZenMode={isZenMode}
              onAction={handleAction}
              hideClose={isZenMode}
              showLanguageToggle={currentArtifact?.artifact_type === 'TWIN_KNOWLEDGE'}
              onToggleComments={toggleComments}
              showComments={showComments}
            />
            {hasMultiple && <NavigationControls />}

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div className={currentArtifact?.artifact_type === 'GRAPHV001' ? 'glass' : 'canvas-content glass'} style={{ flex: 1, overflowY: 'auto', padding: currentArtifact?.artifact_type === 'GRAPHV001' ? 0 : undefined }}>
                {currentArtifact ? (
                  <div style={{ height: '100%', width: '100%', padding: currentArtifact?.artifact_type === 'GRAPHV001' ? 0 : '1.5rem' }}>
                    <UniversalCanvas 
                      content={currentArtifact.content} 
                      title={currentArtifact.title}
                      type={currentArtifact.artifact_type?.toLowerCase()}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF' }}>
                    {translations.no_content_to_display}
                  </div>
                  )}
              </div>
              {showComments && (
                <div className="canvas-sidebar" style={{ width: '20rem', borderLeft: '1px solid #E5E7EB', height: '100%', overflow: 'hidden', flexShrink: 0 }}>
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
