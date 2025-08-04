/*
  # Enhance Student Profiles with Academic Documents

  1. Table Updates
    - Add new columns to student_profiles for 12th standard information
    - Add columns for academic document URLs (10th and 12th marksheets)

  2. New Columns Added
    - `stream_12th` - Arts, Science, or Commerce
    - `marksheet_10th_url` - URL for 10th grade marksheet PDF
    - `marksheet_12th_url` - URL for 12th grade marksheet PDF

  3. Security
    - Maintain existing RLS policies
    - No changes to existing permissions
*/

-- Add new columns to student_profiles table
DO $$
BEGIN
  -- Add stream_12th column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'stream_12th'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN stream_12th text DEFAULT 'Science' CHECK (stream_12th IN ('Arts', 'Science', 'Commerce'));
  END IF;

  -- Add marksheet_10th_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'marksheet_10th_url'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN marksheet_10th_url text DEFAULT '';
  END IF;

  -- Add marksheet_12th_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'marksheet_12th_url'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN marksheet_12th_url text DEFAULT '';
  END IF;
END $$;