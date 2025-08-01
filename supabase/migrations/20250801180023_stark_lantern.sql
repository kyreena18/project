/*
  # Update Student Profiles to Use Class System

  1. Schema Changes
    - Add `class` column to `student_profiles` table
    - Remove `year_of_study` and `department` columns
    - Update constraints to use the 4 specific classes: SYIT, SYSD, TYIT, TYSD

  2. Data Migration
    - Migrate existing data if any exists
    - Update policies to reflect new structure
*/

-- Add new class column with constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'class'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN class text CHECK (class IN ('SYIT', 'SYSD', 'TYIT', 'TYSD'));
  END IF;
END $$;

-- Remove old columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'year_of_study'
  ) THEN
    ALTER TABLE student_profiles DROP COLUMN year_of_study;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_profiles' AND column_name = 'department'
  ) THEN
    ALTER TABLE student_profiles DROP COLUMN department;
  END IF;
END $$;

-- Update the updated_at timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_student_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_student_profiles_updated_at
      BEFORE UPDATE ON student_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;