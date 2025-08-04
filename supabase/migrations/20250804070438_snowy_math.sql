/*
  # Add bucket_name column to placement_events table

  1. Table Updates
    - Add `bucket_name` column to `placement_events` table
    - Set default value for existing records

  2. Security
    - Maintain existing RLS policies
*/

-- Add bucket_name column to placement_events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'placement_events' AND column_name = 'bucket_name'
  ) THEN
    ALTER TABLE placement_events ADD COLUMN bucket_name text DEFAULT 'student-documents';
  END IF;
END $$;

-- Update any existing records to have a bucket name
UPDATE placement_events 
SET bucket_name = LOWER(REPLACE(company_name, ' ', '-')) || '-placement'
WHERE bucket_name IS NULL OR bucket_name = '';

-- Make bucket_name NOT NULL after setting defaults
ALTER TABLE placement_events ALTER COLUMN bucket_name SET NOT NULL;