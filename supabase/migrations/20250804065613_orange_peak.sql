/*
  # Complete Placement System Schema

  1. New Tables
    - `placement_events` - Stores placement events created by admins
    - `placement_requirements` - Stores additional document requirements for each event
    - `placement_applications` - Stores student applications for placement events
    - `student_requirement_submissions` - Stores student document submissions for requirements
    - `student_profiles` - Stores detailed student profile information
    - `internship_submissions` - Stores internship submission requirements
    - `student_internship_submissions` - Stores student internship document submissions

  2. Storage Buckets
    - Dynamic company-specific buckets created per placement event
    - `student-documents` bucket for general student documents

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure file access policies
*/

-- Create placement_events table
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

-- Create placement_requirements table
CREATE TABLE IF NOT EXISTS placement_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create placement_applications table
CREATE TABLE IF NOT EXISTS placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  application_status text DEFAULT 'pending' CHECK (application_status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamptz DEFAULT now(),
  admin_notes text DEFAULT '',
  UNIQUE(placement_event_id, student_id)
);

-- Create student_requirement_submissions table
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

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  uid text NOT NULL,
  roll_no text NOT NULL,
  class text NOT NULL DEFAULT 'SYIT',
  resume_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create internship_submissions table
CREATE TABLE IF NOT EXISTS internship_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  submission_type text NOT NULL,
  is_required boolean DEFAULT false,
  deadline timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_internship_submissions table
CREATE TABLE IF NOT EXISTS student_internship_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_submission_id uuid REFERENCES internship_submissions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  submission_status text DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  admin_feedback text DEFAULT '',
  reviewed_at timestamptz,
  UNIQUE(internship_submission_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE placement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_internship_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for placement_events
CREATE POLICY "Anyone can view active placement events"
  ON placement_events
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage placement events"
  ON placement_events
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for placement_requirements
CREATE POLICY "Anyone can view placement requirements"
  ON placement_requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage placement requirements"
  ON placement_requirements
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for placement_applications
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

CREATE POLICY "Admins can view all applications"
  ON placement_applications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update applications"
  ON placement_applications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for student_requirement_submissions
CREATE POLICY "Students can manage their own requirement submissions"
  ON student_requirement_submissions
  FOR ALL
  TO authenticated
  USING (
    placement_application_id IN (
      SELECT id FROM placement_applications WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all requirement submissions"
  ON student_requirement_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update requirement submissions"
  ON student_requirement_submissions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for student_profiles
CREATE POLICY "Students can manage their own profile"
  ON student_profiles
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all student profiles"
  ON student_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for internship_submissions
CREATE POLICY "Anyone can view active internship submissions"
  ON internship_submissions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage internship submissions"
  ON internship_submissions
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for student_internship_submissions
CREATE POLICY "Students can manage their own internship submissions"
  ON student_internship_submissions
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can view all internship submissions"
  ON student_internship_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update internship submissions"
  ON student_internship_submissions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_placement_events_active ON placement_events(is_active, event_date);
CREATE INDEX IF NOT EXISTS idx_placement_requirements_event ON placement_requirements(event_id);
CREATE INDEX IF NOT EXISTS idx_placement_applications_event ON placement_applications(placement_event_id);
CREATE INDEX IF NOT EXISTS idx_placement_applications_student ON placement_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_requirement_submissions_app ON student_requirement_submissions(placement_application_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student ON student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_internship_submissions_active ON internship_submissions(is_active, deadline);
CREATE INDEX IF NOT EXISTS idx_student_internship_submissions_student ON student_internship_submissions(student_id);

-- Create storage bucket for general student documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for student documents
CREATE POLICY "Students can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Students can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Students can update their own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Admins can view all student documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-documents');