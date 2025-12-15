import React from 'react';
import '../styles/architecture-redesigned.css';

// Configuration for animated lines
const ANIMATION_PATHS = [
  // Group 1: Interface -> GenAI -> Workflow -> LLM -> MCP (Ping-Pong, Gold)
  { id: 'flow-1', d: 'M 240 125 L 500 160', color: '#FFD700', duration: '2.5s', mode: 'ping-pong' },
  { id: 'flow-2', d: 'M 500 190 L 260 225', color: '#FFD700', duration: '2.5s', mode: 'ping-pong' },
  { id: 'flow-3', d: 'M 260 260 L 210 290', color: '#FFD700', duration: '1.5s', mode: 'ping-pong' },
  { id: 'flow-4', d: 'M 390 350 L 410 350', color: '#FFD700', duration: '1.5s', mode: 'ping-pong' },

  // Group 2: Bottom Section (One-Way, Green)
  { id: 'flow-5', d: 'M 300 420 L 250 395', color: '#10B981', duration: '1.5s', mode: 'one-way' },
  { id: 'flow-6', d: 'M 125 420 L 200 395', color: '#10B981', duration: '1.5s', mode: 'one-way' },
  { id: 'flow-7', d: 'M 450 420 L 300 395', color: '#10B981', duration: '1.5s', mode: 'one-way' },
  { id: 'flow-8', d: 'M 600 420 L 350 395', color: '#10B981', duration: '1.5s', mode: 'one-way' }
];

// Toggle this to true to see the coordinate grid
const SHOW_GRID = false;

const CoordinateGrid = () => {
  if (!SHOW_GRID) return null;
  
  const width = 800;
  const height = 600;
  const step = 50;
  
  const verticalLines = [];
  const horizontalLines = [];
  const labels = [];

  // Generate vertical lines and labels
  for (let x = 0; x <= width; x += step) {
    verticalLines.push(
      <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
    );
    labels.push(
      <text key={`lx-${x}`} x={x + 2} y={15} fill="rgba(255, 255, 255, 0.7)" fontSize="10">{x}</text>
    );
  }

  // Generate horizontal lines and labels
  for (let y = 0; y <= height; y += step) {
    horizontalLines.push(
      <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
    );
    labels.push(
      <text key={`ly-${y}`} x={5} y={y - 2} fill="rgba(255, 255, 255, 0.7)" fontSize="10">{y}</text>
    );
  }

  return (
    <g className="debug-grid">
      {verticalLines}
      {horizontalLines}
      {labels}
    </g>
  );
};

export default function ArchitectureRedesigned() {
  return (
    <div className="arch-container">
      <img
        loading="lazy"
        src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F27dafc19299f4017b8472fb32e4c22c5"
        alt="Architecture snapshot"
        className="arch-hero-image"
      />
      
      {/* Animated Overlay */}
      <svg className="arch-overlay-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
        <defs>
          {/* Glow Filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <CoordinateGrid />

        {/* Render all faint paths and their particles */}
        {ANIMATION_PATHS.map((path) => (
          <g key={path.id}>
            <path 
              d={path.d} 
              stroke={path.color} 
              strokeWidth="1.5" 
              fill="none" 
              opacity="0.1" 
              strokeDasharray="4 4"
            />
            
            {/* The moving particle */}
            <circle r="0.5" fill={path.color} filter="url(#glow)">
              <animateMotion 
                dur={path.duration} 
                repeatCount="indefinite"
                path={path.d}
                keyPoints={path.mode === 'ping-pong' ? "0;1;0" : "0;1"}
                keyTimes={path.mode === 'ping-pong' ? "0;0.5;1" : "0;1"}
                calcMode="linear"
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
