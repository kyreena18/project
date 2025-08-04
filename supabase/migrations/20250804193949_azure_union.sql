/*
  # Add bucket_name column to placement_events table

  1. Schema Changes
    - Add `bucket_name` column to `placement_events` table
    - Column type: text (nullable)
    - Used to store the name of the Supabase storage bucket for each placement event

  2. Purpose
    - Enables placement-specific document storage
    - Each company gets its own storage bucket for better organization
    - Supports the additional requirements functionality
*/

-- Add bucket_name column to placement_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'placement_events' AND column_name = 'bucket_name'
  ) THEN
    ALTER TABLE placement_events ADD COLUMN bucket_name text;
  END IF;
END $$;