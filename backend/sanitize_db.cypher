// Rename Label: Water -> Resources
MATCH (n:Water)
REMOVE n:Water
SET n:Resources;

// Rename Property Value: sector='Water' -> sector='Resources'
MATCH (n)
WHERE n.sector = 'Water'
SET n.sector = 'Resources';

// Rename Property Value: domain='Water' -> domain='Resources' (if applicable)
MATCH (n)
WHERE n.domain = 'Water'
SET n.domain = 'Resources';
