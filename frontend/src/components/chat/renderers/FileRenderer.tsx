import { DocumentIcon, ArrowDownTrayIcon, MusicalNoteIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import ReactPlayer from 'react-player';
import { useLanguage } from '../../../contexts/LanguageContext';

interface FileRendererProps {
  url?: string;
  filename: string;
  size?: string;
  type?: string;
  content?: string; // Base64 content
}

export function FileRenderer({ url, filename, size, type, content }: FileRendererProps) {
  const { language } = useLanguage();
  const fileUrl = url || (content ? `data:${type || 'application/octet-stream'};base64,${content}` : '');

  const isVideo = type?.startsWith('video/') || filename.match(/\.(mp4|webm|ogg|mov)$/i);
  const isAudio = type?.startsWith('audio/') || filename.match(/\.(mp3|wav|m4a)$/i);
  const isMedia = isVideo || isAudio;

  const translations = {
    download: language === 'ar' ? 'تحميل' : 'Download',
    unknownType: language === 'ar' ? 'نوع غير معروف' : 'Unknown type',
    unknownSize: language === 'ar' ? 'حجم غير معروف' : 'Unknown size',
    play: language === 'ar' ? 'تشغيل' : 'Play',
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = () => {
    if (isVideo) return <VideoCameraIcon className="w-8 h-8" />;
    if (isAudio) return <MusicalNoteIcon className="w-8 h-8" />;
    return <DocumentIcon className="w-8 h-8" />;
  };

  const Player = ReactPlayer as any;

  return (
    <div className="w-full space-y-4">
      {/* File Card */}
      <div className="panel flex items-center p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-3 bg-amber-50 text-amber-600 mr-4 rtl:mr-0 rtl:ml-4">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate" title={filename}>
            {filename}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {type || translations.unknownType} • {size || translations.unknownSize}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4 rtl:ml-0 rtl:mr-4">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title={translations.download}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Player */}
      {isMedia && fileUrl && (
        <div className="mt-4 border overflow-hidden bg-black flex items-center justify-center">
          <Player
            url={fileUrl}
            controls
            width="100%"
            height={isVideo ? "auto" : "80px"}
            style={{ maxWidth: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
