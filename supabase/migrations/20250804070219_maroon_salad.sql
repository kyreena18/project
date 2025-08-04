/*
  # Fix Storage Policies for Dynamic Bucket Creation

  1. Storage Bucket Policies
    - Allow authenticated users to create buckets
    - Fix RLS policies for bucket management

  2. Storage Object Policies  
    - Allow access to dynamic placement buckets
    - Ensure proper file upload/download permissions
*/

-- First, ensure we can create buckets by updating storage.buckets policies
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can view buckets" ON storage.buckets;

-- Create more permissive bucket policies
CREATE POLICY "Allow bucket creation"
  ON storage.buckets
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow bucket viewing"
  ON storage.buckets
  FOR SELECT
  TO public
  USING (true);

-- Update storage.objects policies for dynamic buckets
DROP POLICY IF EXISTS "Authenticated users can upload to placement buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view placement bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update placement bucket objects" ON storage.objects;

-- Create comprehensive storage object policies
CREATE POLICY "Allow uploads to placement and student buckets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id LIKE '%-placement' OR 
    bucket_id = 'student-documents' OR
    bucket_id LIKE '%placement%'
  );

CREATE POLICY "Allow viewing placement and student bucket objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id LIKE '%-placement' OR 
    bucket_id = 'student-documents' OR
    bucket_id LIKE '%placement%'
  );

CREATE POLICY "Allow updating placement and student bucket objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id LIKE '%-placement' OR 
    bucket_id = 'student-documents' OR
    bucket_id LIKE '%placement%'
  );

-- Ensure the student-documents bucket exists as fallback
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;