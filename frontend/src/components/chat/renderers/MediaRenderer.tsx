/**
 * MediaRenderer - Images, Video, and Audio playback
 * Uses react-player for universal media support
 */

import ReactPlayer from 'react-player';
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon 
} from '@heroicons/react/24/outline';

interface MediaRendererProps {
  url: string;
  type: 'image' | 'video' | 'audio';
  title?: string;
}

export function MediaRenderer({ url, type, title }: MediaRendererProps) {
  if (type === 'image') {
    return (
      <div className="media-renderer renderer-panel media-image">
        {title && (
          <h3 style={{ color: 'var(--component-text-primary)', marginBottom: 16 }}>{title}</h3>
        )}
        <img
          src={url}
          alt={title || 'Image'}
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            }}
        />
      </div>
    );
  }

  const Player = ReactPlayer as any;
  
  return (
    <div className="media-renderer renderer-panel media-video">
      {title && (
        <h3 style={{ color: 'var(--component-text-primary)', marginBottom: 16 }}>{title}</h3>
      )}
      <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-black">
        <div className="aspect-video relative">
          <Player
            url={url}
            controls
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
          />
        </div>
      </div>
    </div>
  );
}
