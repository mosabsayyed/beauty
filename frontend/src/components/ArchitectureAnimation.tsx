import React, { useEffect, useState, useRef } from 'react';
import { ANIMATION_FLOW, ANIMATION_CYCLE_TIME } from '../data/architectureData';

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ArchitectureAnimationProps {
  isEnabled?: boolean;
}

export default function ArchitectureAnimation({
  isEnabled = true,
}: ArchitectureAnimationProps): React.ReactElement {
  const [, setAnimatingComponentId] = useState<string | undefined>();
  const [pathStrokeDashoffset, setPathStrokeDashoffset] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardPositionsRef = useRef<Map<string, CardPosition>>(new Map());
  const animationTimeRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Calculate card positions in the DOM
  const updateCardPositions = () => {
    const cardElements = document.querySelectorAll('[data-component-id]');
    cardElements.forEach((element) => {
      const componentId = element.getAttribute('data-component-id');
      if (componentId) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        cardPositionsRef.current.set(componentId, {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.top + scrollTop + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    });
  };

  // Draw SVG path between two points
  const drawPath = (from: CardPosition, to: CardPosition): string => {
    const startX = from.x;
    const startY = from.y;
    const endX = to.x;
    const endY = to.y;

    // Use curved path for visual appeal
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + Math.abs(endY - startY) * 0.3;

    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  };

  // Animation loop
  useEffect(() => {
    if (!isEnabled) return;

    const animate = (timestamp: number) => {
      if (!animationTimeRef.current) {
        animationTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - animationTimeRef.current) % ANIMATION_CYCLE_TIME;
      // Removed unused progress variable

      // Update card positions periodically
      if (Math.floor(elapsed) % 500 === 0) {
        updateCardPositions();
      }

      // Determine which component should be animating
      let currentAnimatingId: string | undefined;
      for (let i = 0; i < ANIMATION_FLOW.length - 1; i++) {
        const currentNode = ANIMATION_FLOW[i];
        const nextNode = ANIMATION_FLOW[i + 1];
        const currentDelay = currentNode.delay;
        const nextDelay = nextNode.delay;

        if (elapsed >= currentDelay && elapsed < nextDelay) {
          currentAnimatingId = currentNode.componentId;
          break;
        }
      }

      setAnimatingComponentId(currentAnimatingId);

      // Animate stroke dash offset for path drawing effect
      setPathStrokeDashoffset((1 - (elapsed % 1000) / 1000) * 100);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled]);

  // Render SVG paths for animation flow
  const renderPaths = () => {
    const paths: React.ReactElement[] = [];

    for (let i = 0; i < ANIMATION_FLOW.length - 1; i++) {
      const currentNode = ANIMATION_FLOW[i];
      const nextNode = ANIMATION_FLOW[i + 1];

      const fromPos = cardPositionsRef.current.get(currentNode.componentId);
      const toPos = cardPositionsRef.current.get(nextNode.componentId);

      if (fromPos && toPos) {
        const pathData = drawPath(fromPos, toPos);

        paths.push(
          <path
            key={`path-${i}`}
            d={pathData}
            className="arch-animation-path"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
            strokeDasharray="500"
            strokeDashoffset={pathStrokeDashoffset}
            opacity="0.6"
          />
        );

        // Add arrow marker
        paths.push(
          <defs key={`defs-${i}`}>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#FFD700" />
            </marker>
          </defs>
        );
      }
    }

    return paths;
  };

  // Get SVG dimensions (should cover entire page)
  const pageHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    window.innerHeight
  );
  const pageWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
    window.innerWidth
  );

  return (
    <svg
      ref={svgRef}
      className="arch-animation-svg"
      width={pageWidth}
      height={pageHeight}
      viewBox={`0 0 ${pageWidth} ${pageHeight}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {renderPaths()}
    </svg>
  );
}
