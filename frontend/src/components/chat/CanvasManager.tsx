import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../canvas.css';

import { UniversalCanvas } from './UniversalCanvas';
import { Artifact } from '../../types/api';
import { chatService } from '../../services/chatService';
import { shareArtifact, printArtifact, downloadArtifact } from '../../utils/canvasActions';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  ShareIcon,
  PrinterIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const iconMap: Record<string, string> = {
  'CHART': '📊',
  'TABLE': '📋',
  'REPORT': '📄',
  'DOCUMENT': '📝'
};

interface CanvasManagerProps {
  isOpen?: boolean;
  conversationId?: number | null;
  artifacts?: Artifact[];
  initialArtifact?: Artifact | null;
  onClose?: () => void;
}

export function CanvasManager({ isOpen = false, conversationId = null, artifacts: propArtifacts, initialArtifact, onClose }: CanvasManagerProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setCanvasMode] = useState<'hidden' | 'collapsed' | 'expanded' | 'fullscreen'>('hidden');
  const [isZenMode, setIsZenMode] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [groupCounter, setGroupCounter] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { isRTL, language, setLanguage } = useLanguage();
  const translations = {
    share: language === 'ar' ? 'مشاركة' : 'Share',
    print: language === 'ar' ? 'طباعة' : 'Print',
    save: language === 'ar' ? 'حفظ' : 'Save',
    download: language === 'ar' ? 'تحميل' : 'Download',
    enterZen: language === 'ar' ? 'وضع التركيز' : 'Enter Zen Mode',
    exitZen: language === 'ar' ? 'خروج من وضع التركيز' : 'Exit Zen Mode',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    previous: language === 'ar' ? 'السابق' : 'Previous',
    next: language === 'ar' ? 'التالي' : 'Next',
  };

  // Sync mode with isOpen prop
  useEffect(() => {
    if (isOpen && mode === 'hidden') {
      setMode('collapsed');
    } else if (!isOpen && mode !== 'hidden') {
      setMode('hidden');
    }
  }, [isOpen, mode]);

  // Sync artifacts from props
  // Sync artifacts from props
  useEffect(() => {
    if (propArtifacts && propArtifacts.length > 0) {

      setArtifacts(propArtifacts);
      
      // Always update current artifact if explicit initialArtifact is provided
      if (initialArtifact) {
        console.log('[CanvasManager] Setting initial artifact from props:', initialArtifact.title);
        setCurrentArtifact(initialArtifact);
        const index = propArtifacts.findIndex(a => a.id === initialArtifact.id);
        if (index >= 0) setCurrentIndex(index);
        setMode('expanded');
      } 
      // If we have a single artifact passed (like from Demo action), force it as current
      else if (propArtifacts.length === 1) {
        setCurrentArtifact(propArtifacts[0]);
        setCurrentIndex(0);
      }
      // Fallback: If no current artifact or current is not in new list, set first
      else if (!currentArtifact || !propArtifacts.find(a => a.id === currentArtifact.id)) {
        setCurrentArtifact(propArtifacts[0]);
        setCurrentIndex(0);
      }
    }
  }, [propArtifacts, initialArtifact]);

  // Auto-trigger Zen Mode for Graph artifacts and honor per-artifact forceZen flag
  useEffect(() => {
    // Original behavior: auto-enable Zen for Graph visualizations
    if (currentArtifact?.artifact_type === 'GRAPHV001') {
      console.log('[CanvasManager] Auto-triggering Zen Mode for Graph');
      setIsZenMode(true);
    }

    // New: if an artifact explicitly requests Zen mode (forceZen), honor it.
    // This is intentionally narrow and requires the artifact to set `forceZen: true`.
    if (currentArtifact?.forceZen) {
      console.log('[CanvasManager] Artifact requests Zen mode via forceZen flag');
      setIsZenMode(true);
    }
  }, [currentArtifact]);

  // --- Mode Management ---
  const setMode = useCallback((newMode: typeof mode) => {
    setCanvasMode(newMode);
  }, []);

  const toggleCanvas = useCallback(() => {
    console.log('toggleCanvas called');
    if (onClose) {
      onClose();
    } else {
      // Fallback for legacy behavior
      setMode('hidden');
      setCurrentArtifact(null);
      window.dispatchEvent(new CustomEvent('canvasStateChanged', { detail: { isOpen: false } }));
    }
  }, [onClose]);

  const cycleMode = useCallback(() => {
    console.log('cycleMode called');
    const modes: typeof mode[] = ['collapsed', 'expanded', 'fullscreen'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
    console.log('mode changed to', modes[nextIndex]);
  }, [mode]);

  const loadArtifact = useCallback((artifact: Artifact, index?: number) => {
    setCurrentArtifact(artifact);
    if (index !== undefined) {
      setCurrentIndex(index);
    }
    setMode('expanded');
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < artifacts.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentArtifact(artifacts[nextIndex]);
    }
  }, [currentIndex, artifacts]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentArtifact(artifacts[prevIndex]);
    }
  }, [currentIndex, artifacts]);

  const toggleZenMode = useCallback(() => {
    setIsZenMode(!isZenMode);
  }, [isZenMode]);

  const toggleComments = useCallback(() => {
    setShowComments(!showComments);
  }, [showComments]);

  const handleAction = useCallback((action: 'share' | 'print' | 'save' | 'download') => {
    if (!currentArtifact) return;
    switch (action) {
      case 'share': shareArtifact(currentArtifact); break;
      case 'print': printArtifact(); break;
      case 'download': downloadArtifact(currentArtifact); break;
    }
  }, [currentArtifact]);

  const closeArtifact = useCallback(() => {
    setCurrentArtifact(null);
    setMode('collapsed');
  }, []);

  // --- Artifact Management ---
  const createArtifact = useCallback((type: string, title: string, content: any, autoLoad = true) => {
    const artifact: Artifact = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      artifact_type: type as 'CHART' | 'TABLE' | 'REPORT' | 'DOCUMENT',
      title: title,
      content: content,
      created_at: new Date().toISOString()
    };
    setArtifacts(prev => [artifact, ...prev]);
    if (autoLoad) {
      loadArtifact(artifact);
    }
    if (mode === 'hidden') setMode('collapsed');
  }, [mode, loadArtifact]);

  // Load artifacts when conversation changes
  const loadConversationArtifacts = useCallback(async (convId: number) => {
    try {
      const response = await chatService.getConversationMessages(convId);
      if (response && response.messages) {
        const allArtifacts: Artifact[] = [];
        response.messages.forEach((msg: any) => {
          if (msg.metadata && msg.metadata.artifacts) {
            msg.metadata.artifacts.forEach((artifact: any) => {
              if (!artifact.id) {
                artifact.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              }
              if (!artifact.created_at) {
                artifact.created_at = new Date().toISOString();
              }
              allArtifacts.push(artifact as Artifact);
            });
          }
        });
        if (allArtifacts.length > 0) {
          setArtifacts(allArtifacts);
        }
      }
    } catch (err) {
      console.error('Error loading conversation artifacts:', err);
    }
  }, []);

  // Load artifacts when conversationId changes
  useEffect(() => {
    // Only load from conversation if we don't have explicit props
    if (propArtifacts && propArtifacts.length > 0) {
      return;
    }

    if (conversationId) {
      loadConversationArtifacts(conversationId);
    } else {
      setArtifacts([]);
      setCurrentArtifact(null);
    }
  }, [conversationId, loadConversationArtifacts, propArtifacts]);

  // --- Event Listeners ---
  useEffect(() => {
    const onArtifacts = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && detail.artifacts && Array.isArray(detail.artifacts)) {
        const currentGroupId = groupCounter;
        setGroupCounter(prev => prev + 1);
        
        detail.artifacts.forEach((artifact: any) => {
          let normalizedArtifact: Artifact;
          if (typeof artifact === 'string') {
            normalizedArtifact = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              artifact_type: 'REPORT' as const,
              title: artifact,
              content: { format: 'markdown', body: artifact },
              created_at: new Date().toISOString(),
              groupId: currentGroupId
            };
          } else {
            normalizedArtifact = {
              ...artifact,
              created_at: artifact.created_at || new Date().toISOString(),
              id: artifact.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
              groupId: currentGroupId
            };
          }
          setArtifacts(prev => {
            const exists = prev.some(a => a.id === normalizedArtifact.id);
            if (!exists) {
              return [normalizedArtifact, ...prev];
            }
            return prev;
          });
        });
        if (mode === 'hidden') {
          setMode('collapsed');
          window.dispatchEvent(new CustomEvent('canvasStateChanged', { detail: { isOpen: true } }));
        }
      }
    };
    window.addEventListener('chat:artifacts', onArtifacts as EventListener);
    
    const onStructured = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && detail.canvas && Array.isArray(detail.canvas.shapes)) {
        createArtifact('REPORT', 'Canvas Data', detail.canvas.shapes, false);
      }
    };
    window.addEventListener('chat:structured', onStructured as EventListener);

    const onToggle = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && typeof detail.isOpen === 'boolean') {
        setMode(detail.isOpen ? 'collapsed' : 'hidden');
      }
    };
    window.addEventListener('toggleCanvas', onToggle as EventListener);

    const onNewChat = () => {
      setArtifacts([]);
      setCurrentArtifact(null);
      setMode('hidden');
    };
    window.addEventListener('newChat', onNewChat);

    return () => {
      window.removeEventListener('chat:artifacts', onArtifacts as EventListener);
      window.removeEventListener('chat:structured', onStructured as EventListener);
      window.removeEventListener('toggleCanvas', onToggle as EventListener);
      window.removeEventListener('newChat', onNewChat);
    };
  }, [createArtifact, mode]);

  // --- Render Logic ---
  if (mode === 'hidden') return null;

  const hasMultiple = artifacts.length > 1;
  const effectiveWidth = (isZenMode || mode === 'fullscreen') ? '100%' : (mode === 'expanded' ? '60%' : '384px');

  const anchorStyles: any = isRTL ? {
    left: 0,
    right: 'auto',
    borderLeft: 'none',
    borderRight: '1px solid var(--component-panel-border)'
  } : {
    right: 0,
    left: 'auto',
    borderRight: 'none',
    borderLeft: '1px solid var(--component-panel-border)'
  };

  return (
  <div className="canvas-panel glass-panel" style={{
      position: 'fixed',
      top: isZenMode ? 0 : 0,
      height: '100%',
      width: effectiveWidth,
      /* use frosted (transparent) background in both modes to enable glass effect */
      backgroundColor: 'transparent',
      boxShadow: isZenMode ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      zIndex: isZenMode ? 9999 : 50,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      ...anchorStyles
    }}>
      {/* Enhanced Header */}
      <div className="canvas-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--component-panel-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
          {/* Gradient bar */}
          <div style={{
            height: '32px',
            width: '4px',
            background: 'linear-gradient(to bottom, var(--color-gold), var(--color-gold-hover))',
            flexShrink: 0
          }} />
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, marginLeft: '12px', color: 'var(--component-text-primary)' }}>
              {currentArtifact?.artifact_type === 'TWIN_KNOWLEDGE'
                ? (language === 'ar' ? 'المعرفة التوأمية' : 'Twin Knowledge')
                : (currentArtifact?.title || 'Artifacts')
              }
            </h3>
            {hasMultiple && !currentArtifact?.hideNavigation && (
              <p style={{
                fontSize: '12px',
                      color: 'var(--component-text-secondary)',
                margin: 0
              }}>
                {currentIndex + 1} of {artifacts.length}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <>
              <button
                className="clickable header-button"
                onClick={() => handleAction('share')}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={translations.share}
              
              >
                <ShareIcon style={{ width: '18px', height: '18px', color: 'var(--component-text-secondary)' }} />
              </button>
              <button
                className="clickable header-button"
                onClick={() => handleAction('print')}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={translations.print}
              
              >
                <PrinterIcon style={{ width: '18px', height: '18px', color: 'var(--component-text-secondary)' }} />
              </button>
              <button
                className="clickable header-button"
                onClick={() => handleAction('download')}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={translations.download}
              
              >
                <ArrowDownTrayIcon style={{ width: '18px', height: '18px', color: 'var(--component-text-secondary)' }} />
              </button>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--component-panel-border)', margin: '0 4px' }} />
            </>
          
          {/* Language Toggle - Only for Twin Knowledge */}
          {currentArtifact?.artifact_type === 'TWIN_KNOWLEDGE' && (
            <>
              <button
                className="clickable canvas-nav-button"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                style={{ 
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
                title={language === 'en' ? 'العربية' : 'English'}
                onMouseEnter={(e) => (e.currentTarget.classList.add('hovered'))}
                onMouseLeave={(e) => (e.currentTarget.classList.remove('hovered'))}
              >
                {/* Show TARGET language (what you'd switch TO) */}
                {language === 'en' ? 'AR' : 'EN'}
              </button>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--component-panel-border)', margin: '0 4px' }} />
            </>
          )}
          
          {/* Zen Mode Toggle */}
          <button
            className={`clickable canvas-nav-button ${isZenMode ? 'zen-active' : ''}`}
            onClick={toggleZenMode}
            style={{ padding: '8px' }}
            title={isZenMode ? translations.exitZen : translations.enterZen}
            onMouseEnter={(e) => (e.currentTarget.classList.add('hovered'))}
            onMouseLeave={(e) => (e.currentTarget.classList.remove('hovered'))}
          >
            {isZenMode ? (
              <ArrowsPointingInIcon style={{ width: '18px', height: '18px', color: '#d97706' }} />
            ) : (
              <ArrowsPointingOutIcon style={{ width: '18px', height: '18px', color: 'var(--component-text-secondary)' }} />
            )}
          </button>

          {/* Close Button */}
          <button
            className="clickable canvas-nav-button header-button"
            onClick={toggleCanvas}
            style={{
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={translations.close}
          
          >
            <XMarkIcon style={{ width: '18px', height: '18px', color: '#ef4444' }} />
          </button>
        </div>
      </div>

      {/* Navigation Controls (when viewing artifact and multiple exist) */}
      {hasMultiple && !currentArtifact?.hideNavigation && (
        <div className="canvas-nav-controls">
          <button
            className="clickable canvas-nav-button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{ padding: '6px 12px', gap: '4px', fontSize: '14px' }}
          >
            <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
            {translations.previous}
          </button>
          <span style={{ fontSize: '14px', color: 'var(--component-text-secondary)' }}>
            {currentIndex + 1} / {artifacts.length}
          </span>
          <button
            className="clickable canvas-nav-button"
            onClick={handleNext}
            disabled={currentIndex === artifacts.length - 1}
            style={{ padding: '6px 12px', gap: '4px', fontSize: '14px' }}
          >
            {translations.next}
            <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div id="canvas-content-area" className="canvas-content" style={{ 
        flex: 1, 
        overflow: ['TWIN_KNOWLEDGE', 'GRAPHV001'].includes(currentArtifact?.artifact_type || '') ? 'hidden' : 'auto',
        padding: 0,
        background: 'var(--component-bg-primary)'
      }} ref={containerRef}>
        {/* Single Artifact View - Use UniversalCanvas for broader support */}
        {currentArtifact ? (
          <div className="clickable" style={{ 
            // Zero padding for full-bleed artifacts (Twin Knowledge, Dashboards, React components)
            padding: ['TWIN_KNOWLEDGE', 'GRAPHV001', 'REACT'].includes(currentArtifact.artifact_type) ? '0' : '24px', 
            height: '100%', 
            boxSizing: 'border-box', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <UniversalCanvas 
              content={currentArtifact.content} 
              title={currentArtifact.title}
              type={currentArtifact.artifact_type}
              artifact={currentArtifact}
              onNext={handleNext}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--component-text-muted)', padding: '32px 0' }}>No artifact selected</div>
        )}
      </div>

      {/* Back button when viewing artifact - hide for GRAPHV001 dashboard */}
      {currentArtifact && currentArtifact.artifact_type !== 'GRAPHV001' && (
        <div className="canvas-footer">
          <button 
            onClick={closeArtifact}
            className="canvas-nav-button canvas-full"
            style={{ width: '100%', padding: '10px 16px', fontSize: '14px', fontWeight: 500 }}
          >
            ← Back to List
          </button>
        </div>
      )}
    </div>
  );
}
