/*
  # Fix RLS policies for anon role uploads

  1. Storage Policies
    - Allow anon role to upload files to storage buckets
    - Allow anon role to read uploaded files

  2. Database Policies  
    - Allow anon role to insert/update student requirement submissions
    - Allow anon role to read placement requirements

  Note: These policies are permissive for the anon role due to custom authentication.
  In production, consider implementing proper Supabase auth integration.
*/

-- Storage policies for anon role
CREATE POLICY "Allow anon upload to storage objects"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon read storage objects"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (true);

-- Database policies for student_requirement_submissions
CREATE POLICY "Allow anon insert student requirement submissions"
  ON public.student_requirement_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update student requirement submissions"
  ON public.student_requirement_submissions
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anon read student requirement submissions"
  ON public.student_requirement_submissions
  FOR SELECT
  TO anon
  USING (true);

-- Database policies for placement_requirements
CREATE POLICY "Allow anon read placement requirements"
  ON public.placement_requirements
  FOR SELECT
  TO anon
  USING (true);

-- Database policies for placement_applications (needed for Excel export)
CREATE POLICY "Allow anon read placement applications"
  ON public.placement_applications
  FOR SELECT
  TO anon
  USING (true);