import React from 'react';
import { RefreshCw } from 'lucide-react';
import DimensionModule from './DimensionModule';
import type { Dimension } from '../types';

interface InternalOutputsProps {
  dimensions: Dimension[];
  isDark: boolean;
  language: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const InternalOutputs: React.FC<InternalOutputsProps> = ({ 
  dimensions, 
  isDark, 
  language,
  isLoading = false,
  error = null,
  onRetry
}) => {
  const accent = isDark ? '#FFD700' : '#D97706';
  const muted = isDark ? '#9CA3AF' : '#6B7280';
  const danger = '#EF4444';
  const borderColor = isDark ? '#374151' : '#D1D5DB';

  const content = {
    title: { en: 'Internal Transformation Outputs', ar: 'المخرجات الداخلية للتحول' },
    loading: { en: 'Loading indicators...', ar: 'جار تحميل المؤشرات...' },
    failed: { en: 'Failed to load indicators', ar: 'فشل تحميل المؤشرات' },
    retry: { en: 'Retry', ar: 'إعادة المحاولة' }
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  // Spinner component
  const Spinner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '1rem' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: `3px solid ${borderColor}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: muted, fontSize: '0.875rem' }}>{t('loading')}</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Error component with retry
  const ErrorState = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '0.75rem', padding: '1rem' }}>
      <p style={{ color: danger, fontSize: '0.875rem', textAlign: 'center' }}>{t('failed')}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: `1px solid ${accent}`,
            color: accent,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'background-color 0.2s'
          }}
        >
          <RefreshCw size={14} />
          {t('retry')}
        </button>
      )}
    </div>
  );

  return (
    <section>
      <h2 className="section-title">{t('title')}</h2>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState />
      ) : (
        <div className="grid-container internal-outputs-grid">
          {dimensions.map(dim => (
            <DimensionModule key={dim.id} dimension={dim} isDark={isDark} language={language} />
          ))}
        </div>
      )}
    </section>
  );
};

export default InternalOutputs;