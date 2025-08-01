/*
  # Enhanced Features for Placement and Internship Management

  1. New Tables
    - `student_profiles`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `full_name` (text)
      - `uid` (text)
      - `roll_no` (text)
      - `year_of_study` (text)
      - `department` (text) - BSCIT, BVOCSD
      - `resume_url` (text) - PDF file URL
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `placement_events`
      - `id` (uuid, primary key)
      - `title` (text) - Event name like "NIQ Placement Drive"
      - `description` (text)
      - `company_name` (text)
      - `event_date` (timestamp)
      - `application_deadline` (timestamp)
      - `requirements` (text)
      - `created_by` (uuid, foreign key to admin_users)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `placement_applications`
      - `id` (uuid, primary key)
      - `placement_event_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `application_status` (text) - pending, accepted, rejected
      - `applied_at` (timestamp)
      - `admin_notes` (text)

    - `internship_submissions`
      - `id` (uuid, primary key)
      - `title` (text) - e.g., "Offer Letter", "Weekly Report"
      - `description` (text)
      - `submission_type` (text) - offer_letter, weekly_report, completion_certificate, etc.
      - `is_required` (boolean)
      - `deadline` (timestamp)
      - `created_by` (uuid, foreign key to admin_users)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `student_internship_submissions`
      - `id` (uuid, primary key)
      - `internship_submission_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `file_url` (text) - PDF file URL
      - `submission_status` (text) - submitted, reviewed, approved, rejected
      - `submitted_at` (timestamp)
      - `admin_feedback` (text)
      - `reviewed_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for students and admins
*/

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  full_name text,
  uid text,
  roll_no text,
  year_of_study text,
  department text CHECK (department IN ('BSCIT', 'BVOCSD')),
  resume_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create placement_events table
CREATE TABLE IF NOT EXISTS placement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  company_name text NOT NULL,
  event_date timestamptz,
  application_deadline timestamptz,
  requirements text,
  created_by uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create placement_applications table
CREATE TABLE IF NOT EXISTS placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_event_id uuid REFERENCES placement_events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  application_status text DEFAULT 'pending' CHECK (application_status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamptz DEFAULT now(),
  admin_notes text,
  UNIQUE(placement_event_id, student_id)
);

-- Create internship_submissions table
CREATE TABLE IF NOT EXISTS internship_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  submission_type text NOT NULL,
  is_required boolean DEFAULT false,
  deadline timestamptz,
  created_by uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_internship_submissions table
CREATE TABLE IF NOT EXISTS student_internship_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_submission_id uuid REFERENCES internship_submissions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  file_url text,
  submission_status text DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  admin_feedback text,
  reviewed_at timestamptz,
  UNIQUE(internship_submission_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_internship_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for student_profiles
CREATE POLICY "Students can read own profile"
  ON student_profiles
  FOR SELECT
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can insert own profile"
  ON student_profiles
  FOR INSERT
  WITH CHECK (student_id = auth.uid()::uuid);

CREATE POLICY "Students can update own profile"
  ON student_profiles
  FOR UPDATE
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Admins can read all profiles"
  ON student_profiles
  FOR SELECT
  USING (true);

-- Create policies for placement_events
CREATE POLICY "Anyone can read active placement events"
  ON placement_events
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage placement events"
  ON placement_events
  FOR ALL
  USING (true);

-- Create policies for placement_applications
CREATE POLICY "Students can read own applications"
  ON placement_applications
  FOR SELECT
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can insert own applications"
  ON placement_applications
  FOR INSERT
  WITH CHECK (student_id = auth.uid()::uuid);

CREATE POLICY "Admins can read all applications"
  ON placement_applications
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update applications"
  ON placement_applications
  FOR UPDATE
  USING (true);

-- Create policies for internship_submissions
CREATE POLICY "Anyone can read active internship submissions"
  ON internship_submissions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage internship submissions"
  ON internship_submissions
  FOR ALL
  USING (true);

-- Create policies for student_internship_submissions
CREATE POLICY "Students can read own submissions"
  ON student_internship_submissions
  FOR SELECT
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Students can insert own submissions"
  ON student_internship_submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid()::uuid);

CREATE POLICY "Students can update own submissions"
  ON student_internship_submissions
  FOR UPDATE
  USING (student_id = auth.uid()::uuid);

CREATE POLICY "Admins can read all student submissions"
  ON student_internship_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update student submissions"
  ON student_internship_submissions
  FOR UPDATE
  USING (true);

-- Insert sample placement events
INSERT INTO placement_events (title, description, company_name, event_date, application_deadline, requirements, created_by) 
SELECT 
  'Software Developer Placement Drive',
  'Join our dynamic team as a Software Developer. We are looking for passionate individuals with strong programming skills.',
  'NIQ (Nielsen IQ)',
  now() + interval '7 days',
  now() + interval '5 days',
  'Bachelor''s degree in Computer Science or related field. Proficiency in Java, Python, or JavaScript. Strong problem-solving skills.',
  id
FROM admin_users 
WHERE admin_code = 'ADMIN001'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO placement_events (title, description, company_name, event_date, application_deadline, requirements, created_by) 
SELECT 
  'Frontend Developer Internship',
  'Exciting opportunity for frontend development internship with hands-on experience in React and modern web technologies.',
  'TechCorp Solutions',
  now() + interval '10 days',
  now() + interval '7 days',
  'Knowledge of HTML, CSS, JavaScript, and React. Portfolio of web projects preferred.',
  id
FROM admin_users 
WHERE admin_code = 'ADMIN001'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample internship submission requirements
INSERT INTO internship_submissions (title, description, submission_type, is_required, deadline, created_by) 
SELECT 
  'Internship Offer Letter',
  'Upload your official internship offer letter from the company.',
  'offer_letter',
  true,
  now() + interval '30 days',
  id
FROM admin_users 
WHERE admin_code = 'ADMIN001'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO internship_submissions (title, description, submission_type, is_required, deadline, created_by) 
SELECT 
  'Weekly Progress Report',
  'Submit your weekly progress report detailing your internship activities and learnings.',
  'weekly_report',
  true,
  now() + interval '60 days',
  id
FROM admin_users 
WHERE admin_code = 'ADMIN001'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO internship_submissions (title, description, submission_type, is_required, deadline, created_by) 
SELECT 
  'Internship Completion Certificate',
  'Upload your internship completion certificate upon finishing your internship.',
  'completion_certificate',
  false,
  now() + interval '90 days',
  id
FROM admin_users 
WHERE admin_code = 'ADMIN001'
LIMIT 1
ON CONFLICT DO NOTHING;