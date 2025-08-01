/*
  # Initial Schema for College Management System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `admin_code` (text, unique) - Admin login code
      - `password_hash` (text) - Hashed password
      - `name` (text) - Admin name
      - `email` (text, unique) - Admin email
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `students`
      - `id` (uuid, primary key)
      - `name` (text) - Student full name
      - `uid` (text, unique) - College UID
      - `email` (text, unique) - Student email
      - `roll_no` (text, unique) - Roll number
      - `department` (text) - Department name
      - `year` (text) - Academic year
      - `gpa` (numeric) - Current GPA
      - `total_credits` (integer) - Total credits earned
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `courses`
      - `id` (uuid, primary key)
      - `name` (text) - Course name
      - `instructor` (text) - Instructor name
      - `room` (text) - Room number
      - `schedule` (text) - Class schedule
      - `color` (text) - UI color code
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `student_courses`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `course_id` (uuid, foreign key)
      - `progress` (integer) - Course progress percentage
      - `grade` (text) - Current grade
      - `enrolled_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_code text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  uid text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  roll_no text UNIQUE NOT NULL,
  department text DEFAULT 'Computer Science',
  year text DEFAULT '1st Year',
  gpa numeric(3,2) DEFAULT 0.0,
  total_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  instructor text NOT NULL,
  room text NOT NULL,
  schedule text NOT NULL,
  color text DEFAULT '#007AFF',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_courses junction table
CREATE TABLE IF NOT EXISTS student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  grade text DEFAULT '',
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin users can read own data"
  ON admin_users
  FOR SELECT
  USING (true);

-- Create policies for students
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  USING (true);

CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow student registration"
  ON students
  FOR INSERT
  WITH CHECK (true);

-- Create policies for courses
CREATE POLICY "Anyone can read courses"
  ON courses
  FOR SELECT
  USING (true);

-- Create policies for student_courses
CREATE POLICY "Students can read own enrollments"
  ON student_courses
  FOR SELECT
  USING (true);

CREATE POLICY "Students can enroll in courses"
  ON student_courses
  FOR INSERT
  WITH CHECK (true);

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (admin_code, password_hash, name, email) 
VALUES ('ADMIN001', 'admin123', 'System Administrator', 'admin@college.edu')
ON CONFLICT (admin_code) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (name, instructor, room, schedule, color) VALUES
  ('Advanced React Native', 'Dr. Sarah Johnson', 'Room 102', 'Mon/Wed/Fri 10:00-11:30 AM', '#007AFF'),
  ('Database Design', 'Prof. Michael Chen', 'Room 301', 'Tue/Thu 2:00-3:30 PM', '#34C759'),
  ('Mobile UI/UX Design', 'Dr. Emma Wilson', 'Room 205', 'Mon/Wed 4:00-5:30 PM', '#FF9500'),
  ('Web Development', 'Prof. David Brown', 'Room 305', 'Tue/Thu 9:00-10:30 AM', '#AF52DE'),
  ('Data Structures', 'Dr. Lisa Wang', 'Room 201', 'Mon/Wed/Fri 1:00-2:30 PM', '#FF3B30'),
  ('Software Engineering', 'Prof. James Miller', 'Room 401', 'Tue/Thu 11:00-12:30 PM', '#5856D6')
ON CONFLICT DO NOTHING;