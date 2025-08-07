/*
  # Add additional_requirements column to placement_events table

  1. Schema Changes
    - Add `additional_requirements` column to `placement_events` table
    - Column type: JSONB to store array of requirement objects
    - Default value: empty array '[]'
    - Nullable: true for backward compatibility

  2. Purpose
    - Stores additional document requirements for placement events
    - Each requirement has type (string) and required (boolean) properties
    - Enables flexible requirement management per placement event
*/

-- Add additional_requirements column to placement_events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'placement_events' AND column_name = 'additional_requirements'
  ) THEN
    ALTER TABLE placement_events ADD COLUMN additional_requirements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;