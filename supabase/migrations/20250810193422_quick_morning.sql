/*
  # Fix Storage and Submission RLS Policies

  1. Storage Policies
    - Allow authenticated users to upload files to student-documents bucket
    - Allow authenticated users to upload files to placement event buckets
    - Allow users to read their own uploaded files

  2. Student Requirement Submissions Policies
    - Allow students to insert their own requirement submissions
    - Allow students to update their own requirement submissions
    - Allow students to read their own requirement submissions
*/

-- Storage policies for student-documents bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload to student-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-documents' AND
  auth.uid()::text = split_part(name, '_', 1)
);

CREATE POLICY IF NOT EXISTS "Allow users to read their own files in student-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-documents' AND
  auth.uid()::text = split_part(name, '_', 1)
);

-- General storage policy for placement event buckets
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload to placement buckets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = split_part(name, '_', 1)
);

CREATE POLICY IF NOT EXISTS "Allow users to read their own files in placement buckets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = split_part(name, '_', 1)
);

-- Student requirement submissions policies
CREATE POLICY IF NOT EXISTS "Allow students to insert their own requirement submissions"
ON public.student_requirement_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = (
    SELECT student_id 
    FROM public.placement_applications 
    WHERE id = placement_application_id
  )
);

CREATE POLICY IF NOT EXISTS "Allow students to update their own requirement submissions"
ON public.student_requirement_submissions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = (
    SELECT student_id 
    FROM public.placement_applications 
    WHERE id = placement_application_id
  )
);

CREATE POLICY IF NOT EXISTS "Allow students to read their own requirement submissions"
ON public.student_requirement_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() = (
    SELECT student_id 
    FROM public.placement_applications 
    WHERE id = placement_application_id
  )
);

-- Allow admins to read all requirement submissions
CREATE POLICY IF NOT EXISTS "Allow admins to read all requirement submissions"
ON public.student_requirement_submissions
FOR SELECT
TO authenticated
USING (true);