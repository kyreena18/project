/*
  # Add email field to student profiles

  1. Changes
    - Add `email` column to `student_profiles` table
    - Update existing profiles to populate email from students table
    - Add index for email lookups

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add email column to student_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update existing profiles to populate email from students table
UPDATE student_profiles 
SET email = students.email
FROM students 
WHERE student_profiles.student_id = students.id 
AND student_profiles.email IS NULL;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON student_profiles (email);