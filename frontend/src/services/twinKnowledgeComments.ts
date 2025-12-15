import { supabase } from '../lib/supabaseClient';

export interface TwinKnowledgeComment {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  article_id: string;
  content: string;
}

/**
 * Fetch all comments for a specific article
 */
export async function getArticleComments(articleId: string): Promise<TwinKnowledgeComment[]> {
  const { data, error } = await supabase
    .from('twin_knowledge_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Add a new comment (requires authentication)
 */
export async function addComment(commentData: CreateCommentData): Promise<TwinKnowledgeComment> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to add comments');
  }

  // Get user profile for name and avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('twin_knowledge_comments')
    .insert({
      article_id: commentData.article_id,
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split('@')[0] || 'User',
      user_avatar: profile?.avatar_url,
      content: commentData.content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
}

/**
 * Update a comment (user can only update their own)
 */
export async function updateComment(commentId: string, content: string): Promise<TwinKnowledgeComment> {
  const { data, error } = await supabase
    .from('twin_knowledge_comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a comment (user can only delete their own)
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('twin_knowledge_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time comments for an article
 */
export function subscribeToArticleComments(
  articleId: string,
  callback: (comment: TwinKnowledgeComment) => void
) {
  const channel = supabase
    .channel(`comments:${articleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'twin_knowledge_comments',
        filter: `article_id=eq.${articleId}`,
      },
      (payload: { new: TwinKnowledgeComment }) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
