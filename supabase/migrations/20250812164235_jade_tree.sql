/*
  # Consolidate and fix all RLS policies

  This migration consolidates all RLS policies and ensures proper permissions for all operations.
  
  1. Storage policies for file uploads
  2. Database policies for all tables
  3. Proper anon and authenticated user permissions
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to view uploaded files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to view uploaded files" ON storage.objects;

-- Storage policies for file uploads
CREATE POLICY "Allow file uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow file access" ON storage.objects
  FOR SELECT TO anon, authenticated, public
  USING (true);

CREATE POLICY "Allow file updates" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Ensure all tables have proper RLS policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_internship_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Students table policies
CREATE POLICY "Students full access" ON students
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Student profiles policies
CREATE POLICY "Student profiles full access" ON student_profiles
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Placement events policies
CREATE POLICY "Placement events full access" ON placement_events
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Placement requirements policies
CREATE POLICY "Placement requirements full access" ON placement_requirements
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Placement applications policies
CREATE POLICY "Placement applications full access" ON placement_applications
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Student requirement submissions policies
CREATE POLICY "Student requirement submissions full access" ON student_requirement_submissions
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Internship submissions policies
CREATE POLICY "Internship submissions full access" ON internship_submissions
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Student internship submissions policies
CREATE POLICY "Student internship submissions full access" ON student_internship_submissions
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);

-- Admin users policies
CREATE POLICY "Admin users full access" ON admin_users
  FOR ALL TO anon, authenticated, public
  USING (true)
  WITH CHECK (true);