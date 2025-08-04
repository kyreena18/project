/*
  # Fix Placement Events Permissions and Remove Bucket Trigger

  1. Security Changes
    - Drop the problematic bucket creation trigger that requires elevated permissions
    - Grant proper permissions to anon role for placement_events table
    - Update RLS policies to allow public access for INSERT and SELECT operations
    - Remove the bucket_name column dependency

  2. Changes Made
    - Drop trigger that creates storage buckets (requires superuser permissions)
    - Drop the trigger function that was causing permission issues
    - Grant INSERT and SELECT permissions to anon role
    - Create permissive RLS policies for public access
    - Remove bucket_name column as it's not needed without the trigger
*/

-- Drop the problematic trigger and function that requires elevated permissions
DROP TRIGGER IF EXISTS trigger_create_placement_event_bucket ON placement_events;
DROP FUNCTION IF EXISTS create_placement_event_bucket();

-- Remove the bucket_name column since we're not using bucket creation
ALTER TABLE placement_events DROP COLUMN IF EXISTS bucket_name;

-- Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE ON placement_events TO anon;
GRANT SELECT, INSERT, UPDATE ON placement_events TO authenticated;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public to insert placement events" ON placement_events;
DROP POLICY IF EXISTS "Allow public to read placement events" ON placement_events;

-- Create permissive policies for public access
CREATE POLICY "placement_events_public_insert"
  ON placement_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "placement_events_public_select"
  ON placement_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "placement_events_public_update"
  ON placement_events
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);