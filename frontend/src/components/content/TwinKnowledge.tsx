import React, { useState } from 'react';
import knowledgeData from '../../data/knowledge.json';
import { useLanguage } from '../../contexts/LanguageContext';

interface TwinKnowledgeProps {
  onNavigate?: (chapterId: string, episodeId: string) => void;
}

export default function TwinKnowledge({ onNavigate }: TwinKnowledgeProps) {
  const { language, isRTL } = useLanguage();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: 'var(--component-text-primary)',
    fontFamily: 'var(--component-font-family)',
  };





  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px',
    background: 'transparent',
    // backdropFilter: 'blur(10px)', // Removed blur to match system design
    border: '1px solid var(--component-panel-border)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  };

  const chapterHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const chapterTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
    color: 'var(--component-text-primary, #F9FAFB)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const chapterMetaStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--color-primary)', // Use theme primary color
    letterSpacing: '1px'
  };

  const paragraphStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--component-text-secondary)',
    marginBottom: '0',
    marginTop: '8px'
  };

  const episodeListStyle: React.CSSProperties = {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid var(--component-panel-border, rgba(255, 255, 255, 0.1))',
    display: 'grid',
    gap: '12px',
    animation: 'fadeIn 0.3s ease-out'
  };

  const episodeCardStyle: React.CSSProperties = {
    padding: '12px 16px',
    background: 'var(--component-bg-secondary)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    border: '1px solid transparent'
  };

  // Chapter descriptions map (could also be in JSON but keeping here for now as they are rich text)
  const descriptions: Record<string, any> = {
    "chapter-1": {
      en: "Semantics is everything. Before we build, we must agree on what we are building. This chapter defines the core vocabulary of the transformation.",
      ar: "المفاهيم هي كل شيء. قبل أن نبني، يجب أن نتفق على ما نبنيه. يحدد هذا الفصل المفردات الأساسية للتحول."
    },
    "chapter-2": {
      en: "A deep dive into the inner workings of the ontology. We explore the primary node types that drive the system: Objectives, Capabilities, Projects, and Risks.",
      ar: "غوص عميق في آليات العمل الداخلية للأنطولوجيا. نستكشف أنواع العقد الأساسية التي تقود النظام: الأهداف، والقدرات، والمشاريع، والمخاطر."
    },
    "chapter-3": {
      en: "How nodes talk to each other. Transformation is not static; it is a flow of influence via REALIZED_VIA, GOVERNED_BY, and IMPACTS relationships.",
      ar: "كيف تتحدث العقد مع بعضها البعض. التحول ليس ثابتًا؛ إنه تدفق للتأثير عبر علاقات التحقيق والحوكمة والتأثير."
    },
    "chapter-4": {
      en: "Concluding with the Manifesto. Why are we doing this? How does this Digital Twin approach revolutionize public sector governance?",
      ar: "نختتم بالميثاق. لماذا نفعل هذا؟ وكيف يثور نهج التوأم الرقمي هذا حوكمة القطاع العام؟"
    }
  };

  return (
    <div style={{ ...containerStyle, display: 'flex', gap: '40px', alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* LEFT COLUMN: ONTOLOGY SIDEBAR (Expanded Width, Reduced Padding) - MOVED TO LEFT */}
      <div style={{ flex: 1, minWidth: '400px', position: 'sticky', top: '20px' }}>
        <div style={{
          background: 'var(--component-bg-secondary)',
          border: '1px solid var(--component-panel-border)',
          borderRadius: '16px',
          padding: '16px', // Reduced padding
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ 
            color: 'var(--color-primary)', 
            marginTop: 0, 
            fontSize: '18px', 
            borderBottom: '1px solid var(--component-panel-border)',
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            {language === 'ar' ? 'أنطولوجيا القطاع العام' : 'Public Sector Ontology'}
          </h3>
          
          <p style={{ 
            fontSize: '15px', // Slightly larger for readability
            lineHeight: '1.6', 
            color: 'var(--component-text-secondary)',
            marginBottom: '12px' // Added margin bottom for spacing before image
          }}>
            {language === 'ar' 
              ? 'تعمل المنظمات، وخاصة في القطاع العام، كأنظمة متكاملة تتكون من مكونات مترابطة تولد القيمة بشكل جماعي عبر سلسلة قيمة القطاع. يتم تمثيل ذلك في هذه الأنطولوجيا التي تلتقط العناصر الأساسية وعلاقاتها عبر عمليات القطاع وعمليات الكيان.'
              : 'In the public sector, organizations function as integrated systems composed of interdependent components that collectively generate value across a Sector’s value chain as represented in the above Ontology of the essential elements and their relationships. This Ontology is the core of the Digital Twin. To be able to utilize JOSOOR properly, it is critical to understand the Ontology and the logic the AI applies to provide answers.'
            }
          </p>

          <img 
            src={language === 'ar' ? "knowledge/images/1.1_1_ar.png" : "knowledge/images/1.1_1.png"}
            alt={language === 'ar' ? "أنطولوجيا القطاع العام" : "Public Sector Ontology"}
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: '8px',
              border: '1px solid var(--component-panel-border)',
              marginBottom: 0
            }} 
          />
        </div>
      </div>

      {/* RIGHT COLUMN: CHAPTERS TOC (Reduced Width) - MOVED TO RIGHT */}
      <div style={{ width: '40%', minWidth: '350px' }}>
        {knowledgeData.chapters.map((chapter) => {
          const isExpanded = expandedChapter === chapter.id;
          if (!chapter.episodes || chapter.episodes.length === 0) return null;

          return (
            <div 
              key={chapter.id} 
              style={{
                ...sectionStyle,
                border: '1px solid var(--component-text-accent)', // GOLD BORDER (Fixed: usage of correct variable)
                background: isExpanded ? 'var(--component-panel-bg)' : 'transparent'
              }}
              onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
              className="clickable"
            >
              <div style={chapterHeaderStyle}>
                <div style={chapterMetaStyle}>
                  {language === 'ar' ? chapter.id.replace('chapter-', 'الفصل ') : chapter.id.replace('chapter-', 'Chapter ')}
                </div>
                <h2 style={chapterTitleStyle}>
                  {/* Robust regex to strip "Chapter 1 - " or "Chapter 1: " or "Chapter 1 — " */}
                  {((chapter.title as any)[language] || '').replace(/^(Chapter|الفصل) \d+\s*[-—:]\s*/, '')}
                </h2>
                <p style={paragraphStyle}>
                  {descriptions[chapter.id]?.[language] || ''}
                </p>
              </div>

              {isExpanded && (
                <div style={episodeListStyle} onClick={(e) => e.stopPropagation()}>
                  {chapter.episodes.map((episode) => (
                    <div 
                      key={episode.id}
                      className="episode-card clickable"
                      onClick={() => onNavigate?.(chapter.id, episode.id)}
                      style={{
                         ...episodeCardStyle,
                         border: '1px solid var(--component-panel-border)',
                         background: 'var(--component-bg-secondary, rgba(255,255,255,0.05))'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--component-panel-border)';
                      }}
                    >
                      <span style={{ 
                        fontWeight: 600, 
                        color: 'var(--component-text-primary, #F9FAFB)',
                        fontSize: '15px' 
                      }}>
                        <span style={{ opacity: 0.7, marginRight: '8px', color: 'var(--color-primary)' }}>{episode.id.replace('-', '.')}</span>
                        {(episode.title as any)[language]}
                      </span>
                      <span style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                        {language === 'ar' ? 'بدء القراءة ←' : 'Read →'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
