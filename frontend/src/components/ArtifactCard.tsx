import React from 'react';

interface ArtifactCardProps {
  title: string;
  createdAt: string;
  type: string;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ title, createdAt, type }) => (
  <div className="artifact-card">
    <div className="artifact-card-title">{title}</div>
    <div className="artifact-card-meta">{createdAt}</div>
    <span className="artifact-type-badge">{type}</span>
  </div>
);

export default ArtifactCard;
