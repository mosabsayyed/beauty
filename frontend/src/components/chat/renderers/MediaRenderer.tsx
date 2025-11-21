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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        padding: 24,
        background: '#000',
        height: '100%',
      }}>
        {title && (
          <h3 style={{ color: '#fff', marginBottom: 16 }}>{title}</h3>
        )}
        <img 
          src={url} 
          alt={title || 'Image'} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: 8,
          }} 
        />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#000',
      height: '100%',
    }}>
      {title && (
        <h3 style={{ color: '#fff', marginBottom: 16 }}>{title}</h3>
      )}
      <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden w-full max-w-[1000px]">
        {/* @ts-ignore */}
        <ReactPlayer
          url={url}
          controls
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
        />
      </div>
    </div>
  );
}
