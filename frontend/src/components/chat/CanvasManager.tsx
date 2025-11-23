import React, { useEffect, useRef, useState, useCallback } from 'react';

import { UniversalCanvas } from './UniversalCanvas';
import { Artifact } from '../../types/api';
import { chatService } from '../../services/chatService';
import { shareArtifact, printArtifact, saveArtifact, downloadArtifact } from '../../utils/canvasActions';
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

  // Sync mode with isOpen prop
  useEffect(() => {
    if (isOpen && mode === 'hidden') {
      setMode('collapsed');
    } else if (!isOpen && mode !== 'hidden') {
      setMode('hidden');
    }
  }, [isOpen, mode]);

  // Sync artifacts from props
  useEffect(() => {
    if (propArtifacts && propArtifacts.length > 0) {
      console.log('[CanvasManager] Received artifacts from props:', propArtifacts.length);
      setArtifacts(propArtifacts);
      
      if (initialArtifact) {
        console.log('[CanvasManager] Setting initial artifact from props:', initialArtifact.title);
        setCurrentArtifact(initialArtifact);
        const index = propArtifacts.findIndex(a => a.id === initialArtifact.id);
        if (index >= 0) setCurrentIndex(index);
        setMode('expanded');
      } else if (!currentArtifact) {
        // If no current artifact, set the first one
        setCurrentArtifact(propArtifacts[0]);
        setCurrentIndex(0);
      }
    }
  }, [propArtifacts, initialArtifact]);

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
      case 'save': saveArtifact(currentArtifact); break;
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
    if (conversationId) {
      loadConversationArtifacts(conversationId);
    } else {
      setArtifacts([]);
      setCurrentArtifact(null);
    }
  }, [conversationId, loadConversationArtifacts]);

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

  return (
    <div style={{
      position: 'fixed',
      top: isZenMode ? 0 : 0,
      right: 0,
      height: '100%',
      width: effectiveWidth,
      backgroundColor: '#fff',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      zIndex: isZenMode ? 9999 : 50,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #e5e7eb',
      transition: 'all 0.3s ease'
    }}>
      {/* Enhanced Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
          {/* Gradient bar */}
          <div style={{
            height: '32px',
            width: '4px',
            background: 'linear-gradient(to bottom, #F59E0B, #D97706)',
            borderRadius: '4px',
            flexShrink: 0
          }} />
          <div style={{ overflow: 'hidden' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {currentArtifact?.title || 'Artifacts'}
            </h2>
            {hasMultiple && (
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
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
                onClick={() => handleAction('share')}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Share"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ShareIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </button>
              <button
                onClick={() => handleAction('print')}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Print"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <PrinterIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </button>
              <button
                onClick={() => handleAction('save')}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Save"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <BookmarkIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </button>
              <button
                onClick={() => handleAction('download')}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Download"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowDownTrayIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </button>
              <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
            </>
          
          {/* Zen Mode Toggle */}
          <button
            onClick={toggleZenMode}
            style={{
              padding: '8px',
              backgroundColor: isZenMode ? '#fef3c7' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
            onMouseEnter={(e) => !isZenMode && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => !isZenMode && (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {isZenMode ? (
              <ArrowsPointingInIcon style={{ width: '18px', height: '18px', color: '#d97706' }} />
            ) : (
              <ArrowsPointingOutIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={toggleCanvas}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <XMarkIcon style={{ width: '18px', height: '18px', color: '#ef4444' }} />
          </button>
        </div>
      </div>

      {/* Navigation Controls (when viewing artifact and multiple exist) */}
      {hasMultiple && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              padding: '6px 12px',
              backgroundColor: currentIndex === 0 ? '#f3f4f6' : '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {currentIndex + 1} / {artifacts.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === artifacts.length - 1}
            style={{
              padding: '6px 12px',
              backgroundColor: currentIndex === artifacts.length - 1 ? '#f3f4f6' : '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: currentIndex === artifacts.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === artifacts.length - 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            Next
            <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto' }} ref={containerRef}>
        {/* Single Artifact View - Use UniversalCanvas for broader support */}
        {currentArtifact ? (
          <div style={{ padding: '24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <UniversalCanvas 
              content={currentArtifact.content} 
              artifact={currentArtifact}
              title={currentArtifact.title}
              type={currentArtifact.artifact_type?.toLowerCase()}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>No artifact selected</div>
        )}
      </div>
      
      {/* Back button when viewing artifact */}
      {currentArtifact && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button 
            onClick={closeArtifact}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            ← Back to List
          </button>
        </div>
      )}
    </div>
  );
}
