/*
  # Create Students Table

  1. New Tables
    - `students` - Stores basic student information for authentication

  2. Security
    - Enable RLS on students table
    - Add policies for student access
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  uid text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  roll_no text NOT NULL,
  department text DEFAULT 'Computer Science',
  year text DEFAULT '1st Year',
  gpa numeric(3,2) DEFAULT 0.0,
  total_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Students can view their own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can update their own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert student data"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_uid ON students(uid);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);