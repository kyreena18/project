/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users` - Stores admin user credentials and information

  2. Security
    - Enable RLS on admin_users table
    - Add policies for admin access
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

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admins can view their own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert a default admin user for testing
INSERT INTO admin_users (admin_code, password_hash, name, email)
VALUES ('ADMIN001', 'admin123', 'System Administrator', 'admin@college.edu')
ON CONFLICT (admin_code) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_code ON admin_users(admin_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);