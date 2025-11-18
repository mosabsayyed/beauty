/**
 * CanvasPanel Component
 * 
 * Slide-out panel for viewing artifacts:
 * - Slides in from right (LTR) or left (RTL)
 * - Width: 50% of viewport (min 480px)
 * - Black header with controls
 * - White content area
 * - Minimize/Maximize/Close controls
 */

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { ArtifactRenderer } from './ArtifactRenderer';
import { ScrollArea } from '../ui/scroll-area';
import type { Artifact } from '../../types/api';

interface CanvasPanelProps {
  artifacts: Artifact[];
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ar';
  /**
   * If true, render the panel inline as a right-side flex child (squeezes the chat area).
   * Otherwise render as overlay (backdrop + fixed panel).
   */
  inline?: boolean;
  /**
   * Whether the canvas is expanded to full page
   */
  isExpanded?: boolean;
  /**
   * Toggle the expanded state
   */
  onToggleExpand?: (value: boolean) => void;
}

export function CanvasPanel({
  artifacts,
  isOpen,
  onClose,
  language = 'en',
  inline = false,
  isExpanded = false,
  onToggleExpand,
}: CanvasPanelProps) {
  const [selectedArtifactIndex, setSelectedArtifactIndex] = useState(0);
  const [isNarrow, setIsNarrow] = useState(typeof window !== 'undefined' ? window.innerWidth <= 991 : false);
  const [contentHeight, setContentHeight] = useState<number>(() => (typeof window !== 'undefined' ? Math.max(360, window.innerHeight - 104) : 360));

  const isRTL = language === 'ar';

  // Track viewport width to apply responsive styles similar to @media (max-width: 991px)
  useEffect(() => {
    function onResize() {
      setIsNarrow(window.innerWidth <= 991);
      setContentHeight(Math.max(400, window.innerHeight - 120));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset selected artifact when list changes (must be called before any early return to satisfy Hooks rules)
  useEffect(() => {
    setSelectedArtifactIndex(0);
  }, [artifacts]);

  if (!isOpen) return null;

  const hasArtifacts = artifacts && artifacts.length > 0;
  const currentArtifact = hasArtifacts ? artifacts[selectedArtifactIndex] : null;

  const translations = {
    close: language === 'ar' ? 'إغلاق' : 'Close',
    maximize: language === 'ar' ? 'تكبير' : 'Maximize',
    download: language === 'ar' ? 'تحميل' : 'Download',
    artifactsCount: (current: number, total: number) =>
      language === 'ar' ? `${current} من ${total}` : `${current} of ${total}`,
    emptyTitle: language === 'ar' ? 'لوحة' : 'Canvas',
    emptyMessage: language === 'ar' ? 'لا توجد عناصر للعرض' : 'No artifacts to display',
  };

  // Always black header with white font
  const headerBaseStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', color: '#fff' };
  const headerMobileOverrides: React.CSSProperties = isNarrow ? { maxWidth: '100%', borderRadius: '5px', overflow: 'hidden', backgroundColor: '#000', color: '#fff', border: '1px solid rgba(0,0,0,1)' } : {};

  const controlButtonBase: React.CSSProperties = { width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#fff' };
  const controlButtonMobile: React.CSSProperties = isNarrow ? { backgroundColor: '#000', fontWeight: 500, padding: '4px 6px', border: '1px solid rgba(74,74,74,1)', color: '#fff' } : {};

  // Inline mode: render as a non-fixed flex child so the main layout can shrink.
  if (inline) {
    const baseWidth = 420;
    const expandedWidth = 840;
    const widthValue = isExpanded ? expandedWidth : baseWidth;
    const style: React.CSSProperties = {
      width: `${widthValue}px`,
      minWidth: `${widthValue}px`,
      height: '100vh',
      backgroundColor: 'rgb(255, 255, 255)',
      borderLeft: isRTL ? undefined : '1px solid rgb(229, 231, 235)',
      borderRight: isRTL ? '1px solid rgb(229, 231, 235)' : undefined,
      boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      zIndex: 30,
      overflowY: 'auto',
    };

    return (
      <div style={style} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div style={{...headerBaseStyle, ...headerMobileOverrides}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <h2 style={{fontSize:16, fontWeight:600, color:'#fff'}}>{currentArtifact ? currentArtifact.title : translations.emptyTitle}</h2>
            {hasArtifacts && artifacts.length > 1 && (
              <span style={{fontSize:13, color:'#fff'}}>
                {translations.artifactsCount(selectedArtifactIndex + 1, artifacts.length)}
              </span>
            )}
          </div>

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            {/* Expand / Collapse */}
            {typeof onToggleExpand === 'function' && (
              <button
                onClick={() => { onToggleExpand(!isExpanded); setTimeout(() => window.dispatchEvent(new Event('resize')), 300); }}
                title={translations.maximize}
                style={{...controlButtonBase, ...(isNarrow ? controlButtonMobile : {})}}
              >
                <span style={{fontSize:14, lineHeight:0}}>⇔</span>
              </button>
            )}

            <button onClick={onClose} title={translations.close} style={{...controlButtonBase, ...(isNarrow ? controlButtonMobile : {})}}>
              <X style={{ width: 16, height: 16, color: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {hasArtifacts && artifacts.length > 1 && (
          <div style={{display:'flex', gap:8, padding:'12px 16px', borderBottom:'1px solid rgba(0,0,0,0.04)', overflowX:'auto', backgroundColor: '#000'}}>
            {artifacts.map((artifact, index) => (
              <button key={index} onClick={() => setSelectedArtifactIndex(index)} style={{padding:'8px 12px', fontSize:13, borderBottom: index === selectedArtifactIndex ? '2px solid rgb(212,175,55)' : '2px solid transparent', background:'transparent', cursor:'pointer', color:'#fff'}}>
                {artifact.title}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{flex:1, overflowY:'auto', padding:16}}>
          {hasArtifacts ? (
            <div>
              {currentArtifact?.description && (
                <p style={{fontSize:13, color:'rgb(107,114,128)', marginBottom:16}}>{currentArtifact.description}</p>
              )}
              <div style={{height: isExpanded ? `calc(100vh - 96px)` : '400px'}}>
                <ArtifactRenderer artifact={currentArtifact as Artifact} language={language} fullHeight={isExpanded ? contentHeight : 400} />
              </div>
            </div>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}>
              <div style={{textAlign:'center', color:'rgb(107,114,128)'}}>
                <p style={{fontSize:16, marginBottom:8}}>{translations.emptyMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const HEADER_HEIGHT = 48;
  const TABS_HEIGHT = artifacts.length > 1 ? 40 : 0;

  // Default overlay mode (existing behavior)
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isRTL ? 0 : undefined,
          right: isRTL ? undefined : 0,
          height: '100vh',
          display: 'block',
          transition: 'all 0.3s ease',
          width: isExpanded ? '70vw' : '50vw',
          minWidth: isExpanded ? '360px' : '480px',
          zIndex: isExpanded ? 60 : 50,
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header (fixed) */}
        <div style={{...headerBaseStyle, ...headerMobileOverrides, position: 'fixed', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 80}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <h2 style={{fontSize:18, fontWeight:700, color:'#fff'}}>{currentArtifact ? currentArtifact.title : translations.emptyTitle}</h2>
            {artifacts.length > 1 && (
              <span style={{fontSize:13, color:'#fff'}}>
                {translations.artifactsCount(selectedArtifactIndex + 1, artifacts.length)}
              </span>
            )}
          </div>

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button title={translations.download} style={{...controlButtonBase, ...(isNarrow ? controlButtonMobile : {})}}>
              <Download style={{ width: 16, height: 16, color: '#fff' }} />
            </button>

            {typeof onToggleExpand === 'function' && (
              <button onClick={() => { onToggleExpand(!isExpanded); setTimeout(() => window.dispatchEvent(new Event('resize')), 300); }} title={translations.maximize} style={{...controlButtonBase, ...(isNarrow ? controlButtonMobile : {})}}>
                <span style={{fontSize:14, lineHeight:0}}>⇔</span>
              </button>
            )}

            <button onClick={onClose} title={translations.close} style={{...controlButtonBase, ...(isNarrow ? controlButtonMobile : {})}}>
              <X style={{ width: 16, height: 16, color: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Tabs (fixed under header) */}
        {artifacts.length > 1 && (
          <div style={{position:'fixed', left:0, right:0, top: HEADER_HEIGHT, height: TABS_HEIGHT, display:'flex', gap:8, padding:'8px 16px', background:'#000', alignItems:'center', borderBottom:'1px solid rgba(0,0,0,0.04)', zIndex:79, overflowX:'auto'}}>
            {artifacts.map((artifact, index) => (
              <button key={index} onClick={() => setSelectedArtifactIndex(index)} style={{padding:'8px 12px', fontSize:13, borderBottom: index === selectedArtifactIndex ? '2px solid rgb(212,175,55)' : '2px solid transparent', background:'transparent', cursor:'pointer', color:'#fff'}}>
                {artifact.title}
              </button>
            ))}
          </div>
        )}

        {/* Content area positioned below header+tabs */}
        <div style={{position:'absolute', top: HEADER_HEIGHT + TABS_HEIGHT, left:0, right:0, bottom:0, overflow:'auto', padding: isExpanded ? 20 : 12}}>
          {currentArtifact?.description && (
            <p style={{fontSize:14, color:'rgb(107,114,128)', marginBottom:16}}>
              {currentArtifact.description}
            </p>
          )}

          {hasArtifacts ? (
            <div style={{height:'100%'}}>
              <ArtifactRenderer artifact={currentArtifact as Artifact} language={language} fullHeight={isExpanded ? contentHeight : 400} />
            </div>
          ) : (
            <div style={{textAlign:'center', color:'rgb(107,114,128)'}}>
              <p style={{fontSize:16, marginBottom:8}}>{translations.emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
