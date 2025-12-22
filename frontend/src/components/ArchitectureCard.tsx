import React from 'react';
import { ArchitectureComponent } from '../data/architectureData';

interface ArchitectureCardProps {
  component: ArchitectureComponent;
  isAnimating?: boolean;
  layerId: string;
}

export default function ArchitectureCard({
  component,
  isAnimating = false,
  layerId,
}: ArchitectureCardProps): React.ReactElement {
  return (
    <div
      className={`arch-card ${
        component.isCompleted ? 'arch-card-completed' : 'arch-card-planned'
      } ${isAnimating ? 'arch-card-animating' : ''}`}
      data-component-id={component.id}
      data-layer-id={layerId}
      data-completed={component.isCompleted}
      title={component.description}
    >
      <div className="arch-card-header">
        <h3 className="arch-card-title">{component.name}</h3>
      </div>

      <div className="arch-card-body">
        <span className="arch-card-category">{component.category}</span>
        <span
          className={`arch-card-status ${
            component.isCompleted ? 'arch-card-status-completed' : 'arch-card-status-planned'
          }`}
        >
          {component.isCompleted ? '✓ Completed' : '○ Planned'}
        </span>
      </div>

      {component.description && (
        <p className="arch-card-description">{component.description}</p>
      )}
    </div>
  );
}
