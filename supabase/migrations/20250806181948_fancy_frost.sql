/*
  # Fix placement application status constraint

  1. Database Changes
    - Update placement_applications table constraint to include 'applied' status
    - Add eligible_classes column to placement_events table for class-based filtering
  
  2. Security
    - Maintain existing RLS policies
    - No changes to existing permissions
*/

-- Update the check constraint to include 'applied' status
ALTER TABLE placement_applications 
DROP CONSTRAINT IF EXISTS placement_applications_application_status_check;

ALTER TABLE placement_applications 
ADD CONSTRAINT placement_applications_application_status_check 
CHECK (application_status = ANY (ARRAY['pending'::text, 'applied'::text, 'accepted'::text, 'rejected'::text]));

-- Add eligible_classes column to placement_events for class-based filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'placement_events' AND column_name = 'eligible_classes'
  ) THEN
    ALTER TABLE placement_events ADD COLUMN eligible_classes text[] DEFAULT ARRAY['TYIT', 'TYSD', 'SYIT', 'SYSD'];
  END IF;
END $$;