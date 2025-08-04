/*
  # Fix Placement Events Permissions

  1. Security Updates
    - Grant INSERT permission to anon role on placement_events table
    - Update RLS policy to allow public access for INSERT operations
    - Ensure placement_events table has proper permissions for admin operations

  2. Changes Made
    - Grant INSERT permission to anon role
    - Create permissive INSERT policy for public role
    - Maintain existing RLS security while allowing necessary operations
*/

-- Grant INSERT permission to anon role
GRANT INSERT ON public.placement_events TO anon;

-- Grant SELECT permission to anon role (for loading events)
GRANT SELECT ON public.placement_events TO anon;

-- Create a more permissive INSERT policy for placement events
DROP POLICY IF EXISTS "Allow authenticated users to insert placement events" ON public.placement_events;

CREATE POLICY "Allow public to insert placement events"
  ON public.placement_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create a permissive SELECT policy for placement events
DROP POLICY IF EXISTS "Allow all operations on placement_events" ON public.placement_events;

CREATE POLICY "Allow public to read placement events"
  ON public.placement_events
  FOR SELECT
  TO public
  USING (true);