-- Add review_summary column to properties table
ALTER TABLE properties
ADD COLUMN review_summary TEXT;

-- Create index for faster queries
CREATE INDEX idx_properties_review_summary ON properties(review_summary);
