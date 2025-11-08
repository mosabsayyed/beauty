import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './Canvas.module.css';
import ArtifactRenderer from '../ArtifactRenderer';
import { Artifact } from '../../types/chat';
import { chatService } from '../../services/chatService';

interface CanvasRebuildProps {
  isOpen?: boolean;
  conversationId?: number | null;
}

export function CanvasRebuild({ isOpen = false, conversationId = null }: CanvasRebuildProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [mode, setCanvasMode] = useState<'hidden' | 'collapsed' | 'expanded' | 'fullscreen'>('hidden');
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

  // --- Mode Management (Matching Legacy Logic) ---
  const setMode = useCallback((newMode: typeof mode) => {
    setCanvasMode(newMode);
  }, []);

  const toggleCanvas = useCallback(() => {
    console.log('toggleCanvas called');
    // Close canvas completely
    setMode('hidden');
    console.log('mode changed to hidden');
    setCurrentArtifact(null);
    // Notify App.tsx to update its state
    window.dispatchEvent(new CustomEvent('canvasStateChanged', { detail: { isOpen: false } }));
  }, []);

  const cycleMode = useCallback(() => {
    console.log('cycleMode called');
    const modes: typeof mode[] = ['collapsed', 'expanded', 'fullscreen'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
    console.log('mode changed to', modes[nextIndex]);
  }, [mode]);

  const loadArtifact = useCallback((artifact: Artifact) => {
    setCurrentArtifact(artifact);
    // Auto-expand when loading an artifact from the list
    setMode('expanded');
  }, []);

  const closeArtifact = useCallback(() => {
    setCurrentArtifact(null);
    // Return to collapsed mode (list view)
    setMode('collapsed');
  }, []);

  // --- Artifact Management (Matching Legacy Logic) ---
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
    // Ensure canvas is visible
    if (mode === 'hidden') setMode('collapsed');
  }, [mode, loadArtifact]);

  // Load artifacts when conversation changes
  const loadConversationArtifacts = useCallback(async (convId: number) => {
    try {
      // Try to get artifacts from the conversation messages
      const response = await chatService.getConversationMessages(convId);
      if (response && response.messages) {
        const allArtifacts: Artifact[] = [];
        response.messages.forEach(msg => {
          if (msg.metadata && msg.metadata.artifacts) {
            msg.metadata.artifacts.forEach((artifact: any) => {
              // Ensure artifact has an id
              if (!artifact.id) {
                artifact.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              }
              // Ensure artifact has created_at
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
      // New conversation - clear artifacts
      setArtifacts([]);
      setCurrentArtifact(null);
    }
  }, [conversationId, loadConversationArtifacts]);

  // --- Event Listeners (Matching Legacy Logic) ---
  useEffect(() => {
    // Listen for artifacts from Chat responses
    const onArtifacts = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && detail.artifacts && Array.isArray(detail.artifacts)) {
        const currentGroupId = groupCounter;
        setGroupCounter(prev => prev + 1);
        
        detail.artifacts.forEach((artifact: any) => {
          let normalizedArtifact: Artifact;
          if (typeof artifact === 'string') {
            // Convert string artifact to Artifact object
            normalizedArtifact = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              artifact_type: 'REPORT' as const,
              title: artifact,
              content: artifact,
              created_at: new Date().toISOString(),
              groupId: currentGroupId
            };
          } else {
            // Assume it's already an Artifact object
            normalizedArtifact = {
              ...artifact,
              created_at: artifact.created_at || new Date().toISOString(),
              id: artifact.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
              groupId: currentGroupId
            };
          }
          setArtifacts(prev => {
            // Check if artifact already exists
            const exists = prev.some(a => a.id === normalizedArtifact.id);
            if (!exists) {
              return [normalizedArtifact, ...prev];
            }
            return prev;
          });
        });
        // Auto-open canvas if hidden
        if (mode === 'hidden') {
          setMode('collapsed');
          // Notify App to update its state
          window.dispatchEvent(new CustomEvent('canvasStateChanged', { detail: { isOpen: true } }));
        }
      }
    };
    window.addEventListener('chat:artifacts', onArtifacts as EventListener);
    
    // Listen for structured canvas payloads from Chat
    const onStructured = (ev: Event) => {
      // @ts-ignore
      const detail = (ev as CustomEvent).detail;
      if (detail && detail.canvas && Array.isArray(detail.canvas.shapes)) {
        // NOTE: Legacy code drew shapes directly. New code should convert shapes to an artifact.
        // For now, we'll create a generic artifact to display the raw data.
        createArtifact('REPORT', 'Canvas Data', detail.canvas.shapes, false);
      }
    };
    window.addEventListener('chat:structured', onStructured as EventListener);

    // Listen for explicit toggleCanvas event from header button (via App.tsx)
    const onToggle = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && typeof detail.isOpen === 'boolean') {
        setMode(detail.isOpen ? 'collapsed' : 'hidden');
      }
    };
    window.addEventListener('toggleCanvas', onToggle as EventListener);

    // Listen for newChat event to clear artifacts
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

  const isListMode = mode === 'collapsed' || !currentArtifact;
  const isExpanded = mode === 'expanded' || mode === 'fullscreen';

  // Render thumbnail for artifact
  const renderThumbnail = (artifact: Artifact) => {
    const iconMap: { [key: string]: string } = {
      'CHART': '📊',
      'TABLE': '📋',
      'REPORT': '📄',
      'DOCUMENT': '📝'
    };

    return (
      <div className={styles.artifactThumbnail}>
        <div className={styles.thumbnailIcon}>
          {iconMap[artifact.artifact_type] || '📦'}
        </div>
        <div className={styles.thumbnailLabel}>
          {artifact.artifact_type}
        </div>
      </div>
    );
  };

  // Safe date formatter
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return date.toLocaleDateString();
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className={`${styles.wrapper} ${isExpanded ? styles.expanded : ''} ${mode === 'collapsed' ? styles.collapsed : ''}`}>
      <div className={styles.toolbar}>
        <div className={styles.modeLabel} onClick={cycleMode}>
          {mode === 'collapsed' ? 'List View' : mode === 'expanded' ? 'Expanded View' : 'Fullscreen View'}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={cycleMode} title="Cycle Mode">
          {mode === 'collapsed' ? 'Expand' : mode === 'expanded' ? 'Fullscreen' : 'Restore'}
        </button>
        <button onClick={toggleCanvas} title="Close Canvas">✕</button>
      </div>

      <div className={styles.contentArea} ref={containerRef}>
        {isListMode ? (
          // Artifact List View (Collapsed Mode)
          <div className={styles.artifactList}>
            {artifacts.length === 0 ? (
              <div className={styles.emptyState}>No artifacts yet.</div>
            ) : (
              artifacts.map((artifact, index) => (
                <div
                  key={artifact.id}
                  className={`${styles.artifactCard} ${(artifact.groupId ?? index) % 2 === 0 ? styles.artifactCardEven : styles.artifactCardOdd}`}
                  onClick={() => loadArtifact(artifact)}
                >
                  {renderThumbnail(artifact)}
                  <div className={styles.artifactInfo}>
                    <div className={styles.artifactTitle}>{artifact.title}</div>
                    <div className={styles.artifactMeta}>
                      {formatDate(artifact.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Single Artifact View (Expanded/Fullscreen Mode)
          <ArtifactRenderer artifact={currentArtifact} onClose={closeArtifact} onCloseCanvas={closeArtifact} />
        )}
      </div>
    </div>
  );
}
