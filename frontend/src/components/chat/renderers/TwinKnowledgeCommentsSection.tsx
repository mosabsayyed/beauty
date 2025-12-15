import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import {
  getArticleComments,
  addComment,
  subscribeToArticleComments,
  type TwinKnowledgeComment,
} from '../../../services/twinKnowledgeComments';
import './TwinKnowledgeCommentsSection.css';

interface TwinKnowledgeCommentsSectionProps {
  articleId: string;
}

export function TwinKnowledgeCommentsSection({ articleId }: TwinKnowledgeCommentsSectionProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<TwinKnowledgeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const translations = {
    title: language === 'ar' ? 'التعليقات' : 'Comments',
    placeholder: language === 'ar' ? 'أضف تعليقاً...' : 'Add a comment...',
    send: language === 'ar' ? 'إرسال' : 'Send',
    noComments: language === 'ar' 
      ? 'نرحب بتعليقاتكم وملاحظاتكم حول الحلقة، حيث يمكن أن تساهم في تحسين المحتوى. نتطلع إلى مناقشة حيوية وبناءة.' 
      : 'Feel free to include your comments and notes on the episode, these comments can also lead to changing the content. We look forward to a lively discussion.',
    loginToComment: language === 'ar' ? 'سجل الدخول للتعليق' : 'Login to comment',
  };

  useEffect(() => {
    loadComments();
  }, [articleId]);

  useEffect(() => {
    const unsubscribe = subscribeToArticleComments(articleId, (newComment) => {
      setComments((prev) => [...prev, newComment]);
    });
    return unsubscribe;
  }, [articleId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getArticleComments(articleId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const addedComment = await addComment({ article_id: articleId, content: newComment.trim() });
      // Add comment immediately to local state for instant feedback
      setComments((prev) => [...prev, addedComment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="twin-knowledge-comments-section">
      <div className="twin-knowledge-comments-header">
        {translations.title}
        <span className="badge">{comments.length}</span>
      </div>
      <div className="twin-knowledge-comments-list">
        {loading ? (
          <div className="twin-knowledge-comments-loading">Loading...</div>
        ) : comments.length === 0 ? (
          <p className="twin-knowledge-comments-empty">{translations.noComments}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="twin-knowledge-comment">
              <div className="twin-knowledge-comment-avatar">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt={comment.user_name} />
                ) : (
                  <UserCircleIcon style={{ width: '32px', height: '32px' }} />
                )}
              </div>
              <div className="twin-knowledge-comment-content">
                <div className="twin-knowledge-comment-header">
                  <span className="twin-knowledge-comment-author">{comment.user_name}</span>
                  <span className="twin-knowledge-comment-time">{formatTimestamp(comment.created_at)}</span>
                </div>
                <p className="twin-knowledge-comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="twin-knowledge-comment-form">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={translations.placeholder}
          disabled={submitting}
          className="twin-knowledge-comment-input"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="twin-knowledge-comment-submit"
          title={user ? translations.send : translations.loginToComment}
        >
          <PaperAirplaneIcon style={{ width: '20px', height: '20px' }} />
        </button>
      </form>
    </div>
  );
}
