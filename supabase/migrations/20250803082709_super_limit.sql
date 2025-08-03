/*
  # Dynamic Placement Requirements System

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
    - Add appropriate policies for students and admins
*/

-- Create placement_requirements table
CREATE TABLE IF NOT EXISTS placement_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('marksheet_10th', 'marksheet_12th', 'video', 'portfolio', 'resume', 'cover_letter', 'transcript', 'other')),
  description text NOT NULL,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create student_requirement_submissions table
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

-- Create policies for placement_requirements
CREATE POLICY "Anyone can read placement requirements"
  ON placement_requirements
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage placement requirements"
  ON placement_requirements
  FOR ALL
  USING (true);

-- Create policies for student_requirement_submissions
CREATE POLICY "Students can read own requirement submissions"
  ON student_requirement_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Students can insert own requirement submissions"
  ON student_requirement_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Students can update own requirement submissions"
  ON student_requirement_submissions
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can read all requirement submissions"
  ON student_requirement_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update requirement submissions"
  ON student_requirement_submissions
  FOR UPDATE
  USING (true);

-- Insert sample requirements for existing placement events
INSERT INTO placement_requirements (event_id, type, description, is_required)
SELECT 
  pe.id,
  'marksheet_10th',
  '10th Grade Marksheet - Upload your 10th standard marksheet',
  true
FROM placement_events pe
WHERE pe.company_name = 'NIQ (Nielsen IQ)'
ON CONFLICT DO NOTHING;

INSERT INTO placement_requirements (event_id, type, description, is_required)
SELECT 
  pe.id,
  'marksheet_12th',
  '12th Grade Marksheet - Upload your 12th standard marksheet',
  true
FROM placement_events pe
WHERE pe.company_name = 'NIQ (Nielsen IQ)'
ON CONFLICT DO NOTHING;

INSERT INTO placement_requirements (event_id, type, description, is_required)
SELECT 
  pe.id,
  'video',
  'Video Portfolio - Submit a 2-minute video introducing yourself',
  false
FROM placement_events pe
WHERE pe.company_name = 'NIQ (Nielsen IQ)'
ON CONFLICT DO NOTHING;

INSERT INTO placement_requirements (event_id, type, description, is_required)
SELECT 
  pe.id,
  'portfolio',
  'Project Portfolio - Upload your best project work samples',
  false
FROM placement_events pe
WHERE pe.company_name = 'TechCorp Solutions'
ON CONFLICT DO NOTHING;