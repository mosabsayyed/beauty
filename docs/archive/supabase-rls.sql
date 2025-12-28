-- Supabase RLS policies for conversations and messages
-- Paste these into the Supabase SQL editor for the project's `public` schema.

-- Conversations: allow authenticated users to access only their own conversations
CREATE POLICY "Users can access own conversations"
ON public.conversations
FOR ALL
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Messages: allow authenticated users to access messages belonging to conversations
-- This assumes messages.conversation_id references conversations.id
CREATE POLICY "Users can access own messages"
ON public.messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = public.messages.conversation_id AND (select auth.uid()) = c.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = public.messages.conversation_id AND (select auth.uid()) = c.user_id
  )
);

-- Notes:
-- 1) Use `TO authenticated` to avoid expensive anon role checks during development.
-- 2) Also add `auth.uid() IS NOT NULL` checks if desired.
-- 3) Client-side filters (e.g., `.eq('user_id', userId)`) are still recommended to reduce query scope.
