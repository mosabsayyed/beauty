/**
 * ChatInput Component
 * 
 * Message composer with:
 * - Auto-growing textarea
 * - Send button
 * - File attachment with preview
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import '../../styles/chat.css';

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, fileIds?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  language?: 'en' | 'ar';
}

// Public sector file type policy
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

const ACCEPT_STRING = Object.values(ALLOWED_FILE_TYPES).flat().join(',');

const FILE_ERROR_MESSAGES = {
  en: {
    invalidType: 'Invalid file type. Allowed: PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG',
    tooLarge: 'File too large. Maximum size: {size}MB',
    tooMany: 'Maximum 10 files per upload',
    uploadFailed: 'Upload failed. Please try again.',
  },
  ar: {
    invalidType: 'نوع ملف غير صالح. المسموح: PDF، DOCX، XLSX، CSV، TXT، MD، PNG، JPG',
    tooLarge: 'الملف كبير جدًا. الحد الأقصى: {size}ميجابايت',
    tooMany: 'الحد الأقصى 10 ملفات لكل تحميل',
    uploadFailed: 'فشل التحميل. يرجى المحاولة مرة أخرى.',
  }
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
  language = 'en',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = language === 'ar';

  const defaultPlaceholder = language === 'ar'
    ? 'اكتب رسالتك إلى نور... — اضغط Enter للإرسال'
    : 'Message Noor — Press Enter to send';

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (attachedFiles.length + files.length > 10) {
      alert(FILE_ERROR_MESSAGES[language].tooMany);
      return;
    }

    const newFiles: AttachedFile[] = await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        let preview: string | undefined;
        
        // Generate preview for images
        if (file.type.startsWith('image/')) {
          try {
            preview = await fileToBase64(file);
          } catch (error) {
            console.error('Failed to generate preview:', error);
          }
        }
        
        return { id, file, preview };
      })
    );
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (attachedFiles.length === 0) return [];

    const formData = new FormData();
    attachedFiles.forEach(({ file }) => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('josoor_token');
      const response = await fetch('/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.files.map((f: any) => f.file_id);
    } catch (error) {
      console.error('File upload error:', error);
      alert(FILE_ERROR_MESSAGES[language].uploadFailed);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    if (disabled || uploading) return;

    try {
      setUploading(true);

      // Upload files first if any
      const fileIds = await uploadFiles();

      // Send message with file IDs
      onSend(message.trim(), fileIds.length > 0 ? fileIds : undefined);
      
      // Clear state
      setMessage('');
      setAttachedFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (message.trim().length > 0 || attachedFiles.length > 0) && !disabled && !uploading;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="chat-input-area">
      {/* File Previews */}
      {attachedFiles.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 20px',
          overflowX: 'auto',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {attachedFiles.map(({ id, file, preview }) => (
            <div
              key={id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                border: '1px solid var(--component-panel-border)',
                background: 'var(--component-panel-bg)',
                minWidth: '100px',
                maxWidth: '120px'
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => removeFile(id)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <X size={14} />
              </button>

              {/* Preview */}
              {preview ? (
                <img
                  src={preview}
                  alt={file.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    marginBottom: '4px'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--component-bg-primary)',
                  marginBottom: '4px'
                }}>
                  <FileText size={32} color="var(--component-text-secondary)" />
                </div>
              )}

              {/* File info */}
              <div style={{
                fontSize: '11px',
                color: 'var(--component-text-secondary)',
                textAlign: 'center',
                wordBreak: 'break-word',
                width: '100%'
              }}>
                <div style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '2px'
                }}>
                  {file.name}
                </div>
                <div>{formatFileSize(file.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="chat-input-center">
        <div className="chat-input-row">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Attachment Button - NOW FUNCTIONAL */}
          <button
            className={`chat-attach-button clickable ${disabled || uploading ? 'disabled' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            title={language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
          >
            <Paperclip className="chat-attach-icon" />
          </button>

          {/* Textarea */}
          <div className="chat-input-wrapper clickable">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || defaultPlaceholder}
              disabled={disabled || uploading}
              dir={isRTL ? 'rtl' : 'ltr'}
              rows={1}
              className={`chat-textarea ${disabled || uploading ? 'disabled' : ''}`}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`chat-send-button clickable ${canSend ? 'can-send' : 'disabled'}`}
            title={language === 'ar' ? 'إرسال' : 'Send'}
          >
            {uploading ? (
              <div className="spinner" style={{ width: '20px', height: '20px' }} />
            ) : (
              <Send className="chat-send-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Keyboard hint moved into textarea placeholder to reduce clutter under input */}
    </div>
  );
}

