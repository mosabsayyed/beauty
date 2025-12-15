-- Twin Knowledge Comments Table
-- Stores comments per article, visible to all users

CREATE TABLE IF NOT EXISTS twin_knowledge_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL, -- e.g., "1.1", "1.2"
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast article lookups
CREATE INDEX IF NOT EXISTS idx_twin_knowledge_comments_article 
ON twin_knowledge_comments(article_id, created_at DESC);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_twin_knowledge_comments_user 
ON twin_knowledge_comments(user_id);

-- Enable Row Level Security
ALTER TABLE twin_knowledge_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments (including guests)
CREATE POLICY "Anyone can view comments"
ON twin_knowledge_comments
FOR SELECT
USING (true);

-- Policy: Only authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
ON twin_knowledge_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
ON twin_knowledge_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON twin_knowledge_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_twin_knowledge_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_twin_knowledge_comments_timestamp
BEFORE UPDATE ON twin_knowledge_comments
FOR EACH ROW
EXECUTE FUNCTION update_twin_knowledge_comments_updated_at();
