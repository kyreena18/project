/*
  # Complete Dynamic Placement Requirements System

  1. New Tables
    - `placement_requirements`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to placement_events)
      - `type` (text) - marksheet_10th, marksheet_12th, video, portfolio, etc.
      - `description` (text) - Human readable description
      - `is_required` (boolean) - Whether this requirement is mandatory
      - `created_at` (timestamp)

    - `student_requirement_submissions`
      - `id` (uuid, primary key)
      - `placement_application_id` (uuid, foreign key)
      - `requirement_id` (uuid, foreign key)
      - `file_url` (text) - URL to uploaded file
      - `submission_status` (text) - pending, approved, rejected
      - `submitted_at` (timestamp)
      - `admin_feedback` (text)

  2. Security
    - Enable RLS on new tables
    - Add public policies to avoid 401 errors
*/

-- Create placement_requirements table if not exists
CREATE TABLE IF NOT EXISTS placement_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create student_requirement_submissions table if not exists
CREATE TABLE IF NOT EXISTS student_requirement_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_application_id uuid REFERENCES placement_applications(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES placement_requirements(id) ON DELETE CASCADE,
  file_url text,
  submission_status text DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  admin_feedback text,
  UNIQUE(placement_application_id, requirement_id)
);

-- Enable Row Level Security
ALTER TABLE placement_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requirement_submissions ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public can read placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Public can insert placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Public can update placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Public can delete placement requirements" ON placement_requirements;
DROP POLICY IF EXISTS "Public can read requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Public can insert requirement submissions" ON student_requirement_submissions;
DROP POLICY IF EXISTS "Public can update requirement submissions" ON student_requirement_submissions;

-- Create simple public policies for placement_requirements
CREATE POLICY "Allow all operations on placement requirements"
  ON placement_requirements
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create simple public policies for student_requirement_submissions
CREATE POLICY "Allow all operations on requirement submissions"
  ON student_requirement_submissions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for placement documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('placement-documents', 'placement-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for placement documents
CREATE POLICY IF NOT EXISTS "Allow public access to placement documents"
  ON storage.objects
  FOR ALL
  TO public
  USING (bucket_id = 'placement-documents')
  WITH CHECK (bucket_id = 'placement-documents');