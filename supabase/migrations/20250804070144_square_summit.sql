/*
  # Fix Placement System RLS and Storage Policies

  1. Storage Policies
    - Fix bucket creation policies
    - Add proper storage access policies for dynamic buckets

  2. Table Policies
    - Fix placement_events table policies
    - Ensure proper access for authenticated users

  3. Functions
    - Add function to create buckets with proper permissions
*/

-- First, let's ensure the placement_events table exists with proper structure
CREATE TABLE IF NOT EXISTS placement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  company_name text NOT NULL,
  event_date timestamptz NOT NULL,
  application_deadline timestamptz NOT NULL,
  requirements text DEFAULT '',
  bucket_name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE placement_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active placement events" ON placement_events;
DROP POLICY IF EXISTS "Admins can manage placement events" ON placement_events;

-- Create new policies for placement_events
CREATE POLICY "Authenticated users can view active placement events"
  ON placement_events
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create placement events"
  ON placement_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update placement events"
  ON placement_events
  FOR UPDATE
  TO authenticated
  USING (true);

-- Fix storage bucket policies
-- Drop existing bucket policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;

-- Create policy to allow bucket creation
CREATE POLICY "Authenticated users can create buckets"
  ON storage.buckets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view buckets"
  ON storage.buckets
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for dynamic placement buckets (objects)
CREATE POLICY "Authenticated users can upload to placement buckets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id LIKE '%-placement' OR bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can view placement bucket objects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id LIKE '%-placement' OR bucket_id = 'student-documents');

CREATE POLICY "Authenticated users can update placement bucket objects"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id LIKE '%-placement' OR bucket_id = 'student-documents');

-- Ensure placement_requirements table exists
CREATE TABLE IF NOT EXISTS placement_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE placement_requirements ENABLE ROW LEVEL SECURITY;

-- Policies for placement_requirements
CREATE POLICY "Authenticated users can view placement requirements"
  ON placement_requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage placement requirements"
  ON placement_requirements
  FOR ALL
  TO authenticated
  USING (true);

-- Ensure placement_applications table exists
CREATE TABLE IF NOT EXISTS placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  application_status text DEFAULT 'pending' CHECK (application_status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamptz DEFAULT now(),
  admin_notes text DEFAULT '',
  UNIQUE(placement_event_id, student_id)
);

ALTER TABLE placement_applications ENABLE ROW LEVEL SECURITY;

-- Policies for placement_applications
CREATE POLICY "Students can view their own applications"
  ON placement_applications
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can create their own applications"
  ON placement_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Authenticated users can view all applications"
  ON placement_applications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update applications"
  ON placement_applications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Ensure student_requirement_submissions table exists
CREATE TABLE IF NOT EXISTS student_requirement_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_application_id uuid REFERENCES placement_applications(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES placement_requirements(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  submission_status text DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  admin_feedback text DEFAULT '',
  UNIQUE(placement_application_id, requirement_id)
);

ALTER TABLE student_requirement_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for student_requirement_submissions
CREATE POLICY "Students can manage their own requirement submissions"
  ON student_requirement_submissions
  FOR ALL
  TO authenticated
  USING (
    placement_application_id IN (
      SELECT id FROM placement_applications WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view all requirement submissions"
  ON student_requirement_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update requirement submissions"
  ON student_requirement_submissions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_placement_events_active ON placement_events(is_active, event_date);
CREATE INDEX IF NOT EXISTS idx_placement_requirements_event ON placement_requirements(event_id);
CREATE INDEX IF NOT EXISTS idx_placement_applications_event ON placement_applications(placement_event_id);
CREATE INDEX IF NOT EXISTS idx_placement_applications_student ON placement_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_requirement_submissions_app ON student_requirement_submissions(placement_application_id);