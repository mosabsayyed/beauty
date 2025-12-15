import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  isDark?: boolean;
  language?: string;
}

const Panel: React.FC<PanelProps> = ({ children, className = '', id, isDark, language }) => {
  return (
    <div
      id={id}
      className={`panel ${className}`}
      style={{
        background: '#1F2937',
        border: '2px solid #4B5563',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      {children}
    </div>
  );
};

export default Panel;