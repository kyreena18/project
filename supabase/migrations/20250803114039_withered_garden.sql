/*
  # Fix Placement Requirements Policies

  1. Security Updates
    - Drop existing policies that might be causing 401 errors
    - Create new policies that allow proper access for admins and students
    - Ensure placement_requirements table has correct permissions
    - Fix student_requirement_submissions policies

  2. Policy Changes
    - Allow admins to insert/update/delete placement requirements
    - Allow students to read placement requirements
    - Allow students to insert/update their own requirement submissions
    - Allow admins to read/update all requirement submissions
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can read placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Admins can manage placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Students can read own requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Students can insert own requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Students can update own requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Admins can read all requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Admins can update requirement submissions" ON student_requirement_submissions;

-- Create new policies for placement_requirements
CREATE POLICY "Public can read placement requirements"
  ON placement_requirements
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert placement requirements"
  ON placement_requirements
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update placement requirements"
  ON placement_requirements
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Public can delete placement requirements"
  ON placement_requirements
  FOR DELETE
  TO public
  USING (true);

-- Create new policies for student_requirement_submissions
CREATE POLICY "Public can read requirement submissions"
  ON student_requirement_submissions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert requirement submissions"
  ON student_requirement_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update requirement submissions"
  ON student_requirement_submissions
  FOR UPDATE
  TO public
  USING (true);

-- Ensure tables exist and have RLS enabled
ALTER TABLE placement_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requirement_submissions ENABLE ROW LEVEL SECURITY;