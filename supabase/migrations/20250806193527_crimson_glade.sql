/*
  # Add eligible_classes column to placement_events table

  1. Schema Changes
    - Add `eligible_classes` column to `placement_events` table
    - Type: text[] (array of text values)
    - Default: empty array
    - Nullable: true for backward compatibility

  2. Purpose
    - Allow admins to specify which classes can see specific placement events
    - Enable class-based filtering for students
    - Support targeted placement opportunities
*/

-- Add eligible_classes column to placement_events table
ALTER TABLE placement_events 
ADD COLUMN IF NOT EXISTS eligible_classes text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN placement_events.eligible_classes IS 'Array of class names that are eligible for this placement event (e.g., TYIT, TYSD, SYIT, SYSD)';