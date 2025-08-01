/*
  # Fix Student Profiles RLS Policies

  1. Security Updates
    - Drop existing conflicting policies
    - Create proper INSERT policy for students to create their own profiles
    - Create proper UPDATE policy for students to update their own profiles
    - Ensure SELECT policies work correctly
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Allow users to insert/update their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can insert own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can read own profile" ON student_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON student_profiles;

-- Create new, clear policies
CREATE POLICY "Students can insert their own profile"
  ON student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = student_id::text);

CREATE POLICY "Students can update their own profile"
  ON student_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = student_id::text)
  WITH CHECK (auth.uid()::text = student_id::text);

CREATE POLICY "Students can read their own profile"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = student_id::text);

CREATE POLICY "Admins can read all profiles"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (true);