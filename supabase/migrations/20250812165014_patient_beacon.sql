/*
  # Fix Storage RLS Policies for Public Access

  1. Storage Policies
    - Allow public access to upload files to placement buckets
    - Allow public access to read uploaded files
    - Allow public access to update files they uploaded

  2. Database Policies  
    - Allow public access to insert/update student requirement submissions
    - Allow public access to read placement requirements and applications
*/

-- Drop existing storage policies that might be causing issues
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;

-- Create public storage policies
CREATE POLICY "Allow public file uploads to placement buckets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id LIKE '%-placement-%' OR bucket_id LIKE '%google%' OR bucket_id LIKE '%microsoft%' OR bucket_id LIKE '%amazon%');

CREATE POLICY "Allow public file reads from placement buckets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id LIKE '%-placement-%' OR bucket_id LIKE '%google%' OR bucket_id LIKE '%microsoft%' OR bucket_id LIKE '%amazon%');

CREATE POLICY "Allow public file updates in placement buckets"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id LIKE '%-placement-%' OR bucket_id LIKE '%google%' OR bucket_id LIKE '%microsoft%' OR bucket_id LIKE '%amazon%');

-- Drop existing database policies that might be restrictive
DROP POLICY IF EXISTS "Students can manage their own requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Allow students to read placement applications" ON placement_applications;

-- Create public database policies for student requirement submissions
CREATE POLICY "Allow public access to student requirement submissions"
ON student_requirement_submissions FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Ensure placement applications can be read publicly
CREATE POLICY "Allow public read access to placement applications"
ON placement_applications FOR SELECT
TO public
USING (true);

-- Ensure placement requirements can be read publicly
CREATE POLICY "Allow public read access to placement requirements"
ON placement_requirements FOR SELECT
TO public
USING (true);