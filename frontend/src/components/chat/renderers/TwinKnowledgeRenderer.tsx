import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TwinKnowledgeArtifact } from '../../../types/api';
import { TwinKnowledgeCommentsSection } from './TwinKnowledgeCommentsSection';
import { XMarkIcon } from '@heroicons/react/24/outline';
import './TwinKnowledgeRenderer.css';

interface TwinKnowledgeRendererProps {
  artifact: TwinKnowledgeArtifact;
  onBack?: () => void;
}

interface Episode {
  id: string;
  title: { en: string; ar: string };
  articleUrl: string;
  videoUrl: string;
  audioUrl: string;
  guideUrl: string;
}

interface Chapter {
  id: string;
  title: { en: string; ar: string };
  episodes: Episode[];
}

interface KnowledgeData {
  chapters: Chapter[];
}

export function TwinKnowledgeRenderer({ artifact, onBack }: TwinKnowledgeRendererProps) {
  const { language, isRTL } = useLanguage();
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('1');
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('1.1');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/knowledge/knowledge.json')
      .then(res => res.json())
      .then(data => {
        setKnowledgeData(data);
        // Initialize active IDs if not set
        if (!activeChapterId && data.chapters.length > 0) {
          setActiveChapterId(data.chapters[0].id);
          if (data.chapters[0].episodes.length > 0) {
            setActiveEpisodeId(data.chapters[0].episodes[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load knowledge.json:', err));
  }, []);

  // Language-aware URL generation
  const getArticleUrl = (episodeId: string) => {
    const basePath = language === 'ar' ? '/knowledge/ar' : '/knowledge';
    // Ensure ID is in dot format for filenames (e.g. 1-1 -> 1.1)
    const filenameId = episodeId.replace('-', '.');
    return `${basePath}/${filenameId}.html`;
  };

  const getMediaUrls = (episodeId: string) => {
    const basePath = language === 'ar' ? '/knowledge/ar' : '/knowledge';
    const filenameId = episodeId.replace('-', '.');
    return {
      video: `${basePath}/video/${filenameId}.mp4`,
      audio: `${basePath}/audio/${filenameId}.m4a`
    };
  };

  const rawChapters = knowledgeData?.chapters || [];
  // Filter out non-chapter items (like the media config object)
  const chapters = rawChapters.filter(c => c.title && c.episodes);
  
  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
  const activeEpisode = activeChapter?.episodes.find(e => e.id === activeEpisodeId) || activeChapter?.episodes[0];

  useEffect(() => {
    if (artifact.content?.chapterId) setActiveChapterId(artifact.content.chapterId);
    if (artifact.content?.episodeId) setActiveEpisodeId(artifact.content.episodeId);
  }, [artifact]);

  const handleVideoClick = () => setShowVideoModal(true);
  const handleAudioClick = () => setShowAudioPlayer(!showAudioPlayer);

  // Keyboard navigation
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVideoModal(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Reset loading state on episode change
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
  }, [activeEpisode?.id, language]);

  if (!knowledgeData) return <div>Loading knowledge base...</div>;
  if (!activeChapter || !activeEpisode) return <div>Episode not found</div>;

  return (
    <div className="twin-knowledge-container" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <div className="twin-knowledge-nav">
        {/* Wiki Icon */}
        <button
          onClick={() => window.open('https://wiki.example.com', '_blank')}
          className="twin-knowledge-wiki-btn clickable"
          title={language === 'ar' ? 'ويكي' : 'Wiki'}
        >
          <img src="/icons/icon-article.png" alt="Wiki" style={{ width: '32px', height: '32px' }} />
        </button>

        {/* Back Button (if provided) */}
        {onBack && (
          <button 
            onClick={onBack}
            className="twin-knowledge-back-btn clickable"
            style={{
              background: 'transparent',
              border: '1px solid var(--component-panel-border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--component-text-secondary)',
              cursor: 'pointer',
              marginRight: '12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {language === 'ar' ? '← العودة' : '← Back'}
          </button>
        )}
        
        {/* Chapter Selector */}
        <select
          value={activeChapterId}
          onChange={(e) => {
            setActiveChapterId(e.target.value);
            const newChapter = chapters.find(c => c.id === e.target.value);
            if (newChapter) setActiveEpisodeId(newChapter.episodes[0].id);
          }}
          className="twin-knowledge-select"
        >
          {chapters.map(chapter => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.title[language]}
            </option>
          ))}
        </select>

        {/* Episode Selector */}
        <select
          value={activeEpisodeId}
          onChange={(e) => setActiveEpisodeId(e.target.value)}
          className="twin-knowledge-select"
        >
          {activeChapter.episodes.map(episode => (
            <option key={episode.id} value={episode.id}>
              {language === 'ar' 
                ? `الحلقة ${episode.id.replace('-', '.')}: ${episode.title[language]}`
                : `Episode ${episode.id.replace('-', '.')}: ${episode.title[language]}`
              }
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Video Icon */}
        <button 
          onClick={handleVideoClick}
          className="twin-knowledge-media-icon-btn clickable"
          title={language === 'ar' ? 'الفيديو التوضيحي' : 'Illustrative Video'}
        >
          <img src="/icons/icon-video.png" alt="Video" style={{ width: '34px', height: '34px' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            {language === 'ar' ? 'الفيديو التوضيحي' : 'Illustrative Video'}
          </span>
        </button>

        {/* Audio Icon */}
        <button 
          onClick={handleAudioClick}
          className="twin-knowledge-media-icon-btn clickable"
          title={language === 'ar' ? 'بودكاست في العمق' : 'The Deep Podcast'}
        >
          <img src="/icons/icon-audio.png" alt="Audio" style={{ width: '34px', height: '34px' }} />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>
            {language === 'ar' ? 'بودكاست في العمق' : 'The Deep Podcast'}
          </span>
        </button>
      </div>

      {/* Main Content: Article and Comments */}
      <div className="twin-knowledge-main">
        {/* Article */}
        <div className="twin-knowledge-article">
          {isLoading && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--component-text-secondary)'
            }}>
              Loading article...
            </div>
          )}
          {loadError && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--component-text-error)'
            }}>
              Failed to load article. Please try again.
            </div>
          )}
          <iframe
            src={getArticleUrl(activeEpisode.id)}
            className="twin-knowledge-iframe"
            title={`${activeEpisode.title[language]} - Article Content`}
            aria-label={`Episode ${activeEpisode.id} content`}
            onLoad={(e) => {
              setIsLoading(false);
              
              // Inject theme CSS variables into iframe immediately
              const iframe = e.currentTarget;
              const iframeDoc = iframe.contentDocument;
              if (iframeDoc) {
                const styles = getComputedStyle(document.documentElement);
                
                // Create style element with CSS variables
                const styleEl = iframeDoc.createElement('style');
                styleEl.textContent = `
                  :root {
                    --component-bg-primary: ${styles.getPropertyValue('--component-bg-primary')};
                    --component-panel-bg: ${styles.getPropertyValue('--component-panel-bg')};
                    --component-panel-border: ${styles.getPropertyValue('--component-panel-border')};
                    --component-text-primary: ${styles.getPropertyValue('--component-text-primary')};
                    --component-text-secondary: ${styles.getPropertyValue('--component-text-secondary')};
                    --component-text-accent: ${styles.getPropertyValue('--component-text-accent')};
                    --component-font-family: ${styles.getPropertyValue('--component-font-family')};
                    --component-font-heading: ${styles.getPropertyValue('--component-font-heading')};
                  }
                  /* Global constraints for article content */
                  body {
                    padding: 2rem !important;
                    box-sizing: border-box;
                    max-width: 100%;
                    overflow-x: hidden;
                    font-family: var(--component-font-family);
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px; /* Optional polish */
                    display: block;
                    margin: 1rem auto;
                  }
                  figure {
                    margin: 1rem 0;
                    text-align: center;
                  }
                `;
                
                // Insert at the beginning of head so external CSS can use them
                iframeDoc.head.insertBefore(styleEl, iframeDoc.head.firstChild);
              }
            }}
            onError={() => { setLoadError(true); setIsLoading(false); }}
            style={{ display: isLoading || loadError ? 'none' : 'block' }}
          />
        </div>

        {/* Sidebar - Audio Player + Comments */}
        <div className="twin-knowledge-sidebar">
          {/* Audio Player */}
          {showAudioPlayer && (
            <div className="twin-knowledge-audio-player">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                  {language === 'ar' ? 'بودكاست في العمق' : 'The Deep Podcast'}
                </h4>
                <button 
                  onClick={() => setShowAudioPlayer(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--component-text-secondary)'
                  }}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
              <audio controls style={{ width: '100%' }} src={getMediaUrls(activeEpisode.id).audio} autoPlay>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          
          {/* Comments */}
          <TwinKnowledgeCommentsSection articleId={activeEpisode.id} />
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="twin-knowledge-video-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowVideoModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10000,
                background: 'rgba(0, 0, 0, 0.75)',
                border: '2px solid #fff',
                padding: '8px',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <XMarkIcon style={{ width: '24px', height: '24px', strokeWidth: 3 }} />
            </button>
            <video controls className="twin-knowledge-video" src={getMediaUrls(activeEpisode.id).video} autoPlay>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}


    </div>
  );
}
