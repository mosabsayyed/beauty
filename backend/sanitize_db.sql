-- Update conversations title if it contains 'Water'
UPDATE conversations
SET title = REPLACE(title, 'Water', 'Resources')
WHERE title LIKE '%Water%';

-- Update messages content if it contains 'Water' (Optional, use with caution)
-- UPDATE messages
-- SET content = REPLACE(content, 'Water', 'Resources')
-- WHERE content LIKE '%Water%';
