import React, { useState, useEffect } from 'react';
import './canvas.css';

type Artifact = {
  id: string;
  artifact_type: string;
  title: string;
  content: any;
  created_at: string;
  description?: string;
};

type Mode = 'hidden' | 'collapsed' | 'expanded' | 'fullscreen';

const CanvasManager: React.FC = () => {
  const [mode, setMode] = useState<Mode>('hidden');
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    setArtifacts([]);
  }, []);

  useEffect(() => {
    const handler = () => {
      setMode(prev => (prev === 'hidden' ? 'collapsed' : 'hidden'));
    };
    window.addEventListener('toggleCanvas', handler as EventListener);
    return () => window.removeEventListener('toggleCanvas', handler as EventListener);
  }, []);

  const toggleCanvas = () => {
    setMode(mode === 'hidden' ? 'collapsed' : 'hidden');
  };

  const cycleMode = () => {
    const modes: Mode[] = ['collapsed', 'expanded', 'fullscreen'];
    const currentIndex = modes.indexOf(mode);
    setMode(modes[(currentIndex + 1) % modes.length]);
  };

  const closeCanvas = () => {
    setMode('hidden');
  };

  const closeArtifact = () => {
    setCurrentArtifact(null);
    setMode('collapsed');
  };

  const loadArtifact = (artifactId: string) => {
    const artifact = artifacts.find(a => a.id === artifactId);
    if (artifact) {
      setCurrentArtifact(artifact);
      setMode('expanded');
    }
  };

  const createArtifact = (type: string, title: string, content: any, autoLoad = true) => {
    const artifact: Artifact = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      artifact_type: type,
      title,
      content,
      created_at: new Date().toISOString()
    };
    setArtifacts(prev => [artifact, ...prev]);
    if (autoLoad) {
      setCurrentArtifact(artifact);
      setMode('expanded');
    }
    return artifact;
  };

  useEffect(() => {
    if (artifacts.length === 0) {
      createArtifact('CHART', 'Capability Maturity Assessment', {
        type: 'radar',
        chart_title: 'Capability Maturity Assessment',
        subtitle: 'Current vs Target State',
        categories: ['Digital Twin', 'Process Mining', 'AI Orchestration', 'Analytics', 'Data Quality'],
        max_value: 5,
        series: [
          { name: 'Current State', data: [2, 3, 1, 4, 3], pointPlacement: 'on', color: '#ff6b6b' },
          { name: 'Target State', data: [5, 5, 4, 5, 5], pointPlacement: 'on', color: '#667eea' }
        ],
        description: 'This spider chart shows the current maturity level versus target state across five key transformation capabilities.'
      }, false);
    }
  }, [artifacts]);

  return (
    <div className={`canvas-container mode-${mode}`}>
      <div className="canvas-controls">
        <button onClick={toggleCanvas} className="canvas-toggle">{mode === 'hidden' ? '📊 Canvas' : '📊 Canvas (On)'}</button>
        {mode !== 'hidden' && (
          <>
            <button onClick={cycleMode}>Cycle Mode</button>
            <button onClick={closeCanvas}>Close Canvas</button>
          </>
        )}
      </div>
      {mode !== 'hidden' && !currentArtifact && (
        <div className="canvas-sidebar">
          <div className="canvas-mode-label">{mode.charAt(0).toUpperCase() + mode.slice(1)}</div>
          <div className="artifact-list">
            {artifacts.length === 0 ? (
              <div className="canvas-empty-text">No artifacts yet</div>
            ) : (
              artifacts.map(artifact => (
                <div key={artifact.id} className="artifact-card" onClick={() => loadArtifact(artifact.id)}>
                  <div className="artifact-card-title">{artifact.title}</div>
                  <div className="artifact-card-meta">{artifact.created_at}</div>
                  <span className="artifact-type-badge">{artifact.artifact_type}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {mode !== 'hidden' && currentArtifact && (
        <div className="canvas-content">
          <div className="artifact-header">
            <div className="artifact-title-main">{currentArtifact.title}</div>
            <div className="artifact-meta-row">
              <div className="artifact-meta-item">
                <span>📅</span>
                <span>Created: {new Date(currentArtifact.created_at).toLocaleDateString()}</span>
              </div>
              <div className="artifact-meta-item">
                <span>📦</span>
                <span>Type: {currentArtifact.artifact_type}</span>
              </div>
            </div>
            <div className="artifact-actions">
              <button onClick={closeArtifact}>← Back to List</button>
              <button onClick={closeCanvas}>✕ Close Canvas</button>
            </div>
          </div>
          <div className="artifact-body">
            {currentArtifact.artifact_type === 'CHART' ? (
              <div className="chart-placeholder">Renderer for CHART (rebuild harness) - see rebuild/Canvas for integration</div>
            ) : (
              <div className="canvas-empty-text">Renderer for {currentArtifact.artifact_type} not implemented</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasManager;
