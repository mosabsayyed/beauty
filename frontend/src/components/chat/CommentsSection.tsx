import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: string;
  user: string;
  avatar?: string;
  content: string;
  timestamp: Date;
}

interface CommentsSectionProps {
  artifactId: string;
}

export function CommentsSection({ artifactId }: CommentsSectionProps) {
  const { language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: 'Ahmed',
      content: language === 'ar' ? 'هذا تحليل ممتاز، شكراً لك.' : 'This is an excellent analysis, thank you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '2',
      user: 'Sarah',
      content: language === 'ar' ? 'هل يمكننا إضافة المزيد من البيانات حول الربع الرابع؟' : 'Can we add more data about Q4?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    }
  ]);
  const [newComment, setNewComment] = useState('');

  const translations = {
    title: language === 'ar' ? 'التعليقات' : 'Comments',
    placeholder: language === 'ar' ? 'أضف تعليقاً...' : 'Add a comment...',
    send: language === 'ar' ? 'إرسال' : 'Send',
    noComments: language === 'ar' ? 'لا توجد تعليقات بعد.' : 'No comments yet.',
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: 'You',
      content: newComment,
      timestamp: new Date(),
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  return (
    <div className="border-t border-gray-200 canvas-sidebar p-4 flex flex-col h-full max-h-[300px]">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {translations.title}
        <span className="badge">
          {comments.length}
        </span>
      </h3>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{translations.noComments}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="shrink-0">
                {comment.avatar ? (
                  <img src={comment.avatar} alt={comment.user} className="w-8 h-8 " />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="panel p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">{comment.user}</span>
                    <span className="text-xs text-gray-400">
                      {comment.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={translations.placeholder}
          className="w-full border border-gray-300 pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={translations.send}
        >
          <PaperAirplaneIcon className="w-5 h-5 -rotate-45 rtl:rotate-135" />
        </button>
      </form>
    </div>
  );
}
