/*
  # Fix RLS policies for file uploads and requirement submissions

  1. Storage Policies
    - Allow authenticated users to upload files with their UID in filename
    - Allow authenticated users to update their own files
    - Allow authenticated users to read files

  2. Student Requirement Submissions
    - Allow students to insert their own requirement submissions
    - Allow students to update their own requirement submissions
    - Allow students to read their own submissions
    - Allow admins to read all submissions

  3. Placement Applications
    - Ensure students can read their own applications for validation
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow students to insert requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Allow students to update requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Allow students to read own submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Allow admins to read all submissions" ON student_requirement_submissions;

-- Storage policies for file uploads
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the filename starts with the user's UID
  auth.uid()::text = (regexp_match(name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]
);

CREATE POLICY "Allow authenticated users to update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  -- Allow if the filename starts with the user's UID
  auth.uid()::text = (regexp_match(name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]
)
WITH CHECK (
  -- Allow if the filename starts with the user's UID
  auth.uid()::text = (regexp_match(name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]
);

CREATE POLICY "Allow authenticated users to read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (true);

-- Student requirement submissions policies
CREATE POLICY "Allow students to insert requirement submissions"
ON student_requirement_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM placement_applications pa 
    WHERE pa.id = placement_application_id 
    AND pa.student_id = auth.uid()
  )
);

CREATE POLICY "Allow students to update requirement submissions"
ON student_requirement_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM placement_applications pa 
    WHERE pa.id = placement_application_id 
    AND pa.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM placement_applications pa 
    WHERE pa.id = placement_application_id 
    AND pa.student_id = auth.uid()
  )
);

CREATE POLICY "Allow students to read own submissions"
ON student_requirement_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM placement_applications pa 
    WHERE pa.id = placement_application_id 
    AND pa.student_id = auth.uid()
  )
);

CREATE POLICY "Allow admins to read all submissions"
ON student_requirement_submissions
FOR SELECT
TO authenticated
USING (true);

-- Ensure placement_applications has proper read policy for validation
DROP POLICY IF EXISTS "Students can read own applications for validation" ON placement_applications;
CREATE POLICY "Students can read own applications for validation"
ON placement_applications
FOR SELECT
TO authenticated
USING (student_id = auth.uid());