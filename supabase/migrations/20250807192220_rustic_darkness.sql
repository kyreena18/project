/*
  # Enable Realtime Subscriptions

  1. Enable Realtime
    - Enable realtime for student_profiles table
    - Enable realtime for placement_events table
    - Enable realtime for placement_applications table
    - Enable realtime for student_requirement_submissions table

  2. Security
    - Ensure RLS policies allow realtime subscriptions
*/

-- Enable realtime for student profiles
ALTER PUBLICATION supabase_realtime ADD TABLE student_profiles;

-- Enable realtime for placement events
ALTER PUBLICATION supabase_realtime ADD TABLE placement_events;

-- Enable realtime for placement applications
ALTER PUBLICATION supabase_realtime ADD TABLE placement_applications;

-- Enable realtime for student requirement submissions
ALTER PUBLICATION supabase_realtime ADD TABLE student_requirement_submissions;

-- Enable realtime for internship submissions
ALTER PUBLICATION supabase_realtime ADD TABLE internship_submissions;

-- Enable realtime for student internship submissions
ALTER PUBLICATION supabase_realtime ADD TABLE student_internship_submissions;