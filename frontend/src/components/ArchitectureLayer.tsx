import React from 'react';
import { ArchitectureLayer as LayerType } from '../data/architectureData';
import ArchitectureCard from './ArchitectureCard';

interface ArchitectureLayerProps {
  layer: LayerType;
  animatingComponentId?: string;
}

export default function ArchitectureLayer({
  layer,
  animatingComponentId,
}: ArchitectureLayerProps): React.ReactElement {
  return (
    <section className="arch-layer" data-layer-id={layer.id}>
      <div className="arch-layer-header">
        <h2 className="arch-layer-title">{layer.displayName}</h2>
        {layer.description && (
          <p className="arch-layer-description">{layer.description}</p>
        )}
      </div>

      <div className="arch-layer-content">
        <div className="arch-layer-cards">
          {layer.components.map((component) => (
            <ArchitectureCard
              key={component.id}
              component={component}
              layerId={layer.id}
              isAnimating={animatingComponentId === component.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
