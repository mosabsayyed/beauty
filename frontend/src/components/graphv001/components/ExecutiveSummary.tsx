import React, { useState, useEffect, useCallback } from 'react';
import Panel from './Panel';
import type { Dimension } from '../types';

interface ExecutiveSummaryProps {
  dimensions: Dimension[];
  selectedYear?: string;
  selectedQuarter?: string;
  isDark: boolean;
  language: string;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ 
  dimensions, 
  selectedYear,
  selectedQuarter,
  isDark,
  language
}) => {
  console.log('[ExecutiveSummary] Rendering component...');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [isConnected, setIsConnected] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // --- SSE Connection for Summary Updates ---
  useEffect(() => {
    // Connect to Graph Server SSE endpoint
    // Use absolute URL to ensure connection to the correct server (port 3001)
    const eventSource = new EventSource('http://localhost:3001/api/summary-stream');
    
    eventSource.onopen = () => {
       console.log('[ExecutiveSummary] SSE Connected to', eventSource.url);
       setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      console.log('[ExecutiveSummary] SSE Message Received:', event.data.slice(0, 100));
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'summary') {
          console.log('[ExecutiveSummary] Updating summary content...');
          setExecutiveSummary(data.content);
          setIsSummaryLoading(false);
        }
      } catch (e) {
        console.error('[ExecutiveSummary] Error parsing SSE message:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[ExecutiveSummary] SSE Error:', err);
      setIsConnected(false);
      // Don't close immediately, let it retry or handle reconnection manually if needed
      // eventSource.close(); 
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (dimensions.length === 0) return;
    setIsSummaryLoading(true);
    setExecutiveSummary("Requesting AI analysis...");
    
    // Send message to parent window to trigger backend analysis
    // The parent (UniversalCanvas) will handle this, call the backend, 
    // and the backend will push the result to the graph-server, 
    // which we will receive via SSE.
    window.parent.postMessage({
      type: 'REQUEST_ANALYSIS',
      source: 'graphv001',
      selectedYear: selectedYear // Pass selectedYear
    }, '*');
    
  }, [dimensions, selectedYear]);

  return (
    <Panel className="th-summary-panel h-full">
        <div className="th-summary-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ color: isDark ? '#F9FAFB' : '#1F2937', margin: 0 }}>Strategic Planning</h3>
                <div 
                    title={isConnected ? "Connected to Analysis Stream" : "Disconnected from Analysis Stream"}
                    style={{
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: isConnected ? '#10B981' : '#EF4444',
                        boxShadow: isConnected ? '0 0 4px #10B981' : 'none',
                        transition: 'background-color 0.3s ease'
                    }} 
                />
            </div>
            <button onClick={handleAnalyze} disabled={isSummaryLoading || !isConnected}>
            {isSummaryLoading ? 'Analyzing...' : isConnected ? '✨ Analyze' : '⚠ Disconnected'}
            </button>
        </div>
        <div className={`th-summary-text ${isSummaryLoading ? 'loading' : ''}`} style={{ position: 'relative', minHeight: '100px' }}>
            {isSummaryLoading && (
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 10,
                    borderRadius: '0.375rem',
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                            borderTopColor: isDark ? '#FFD700' : '#D97706',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}/>
                        <span style={{ fontSize: '0.75rem', color: isDark ? '#D1D5DB' : '#4B5563' }}>Updating...</span>
                    </div>
                </div>
            )}
            
            {executiveSummary ? (
                <div className="markdown-content">
                  <style>{`
                    .markdown-content table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                    .markdown-content th, .markdown-content td { border: 1px solid ${isDark ? '#374151' : '#D1D5DB'}; padding: 8px; text-align: left; }
                    .markdown-content th { background-color: ${isDark ? '#1F2937' : '#F3F4F6'}; font-weight: bold; }
                    .markdown-content tr:nth-child(even) { background-color: ${isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.5)'}; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: executiveSummary }} />
                </div>
            ) : (
                !isSummaryLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: isDark ? '#6B7280' : '#9CA3AF', padding: '2rem' }}>
                         <p>Click "Analyze" to generate strategic insights.</p>
                    </div>
                )
            )}
        </div>
    </Panel>
  );
};

export default ExecutiveSummary;
