import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UserType = 'admin' | 'student' | null;

interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  uid?: string;
  rollNo?: string;
  adminCode?: string;
}

interface AuthContextType {
  user: User | null;
  userType: UserType;
  loading: boolean;
  signInAdmin: (code: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInStudent: (uid: string, email: string) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (data: {
    name: string;
    uid: string;
    email: string;
    rollNo: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // In a real app, you'd check for stored session tokens
      // For now, we'll just set loading to false after the delay
      setLoading(false);
    } catch (error) {
      console.error('Session check error:', error);
      setLoading(false);
    }
  };

  const signInAdmin = async (code: string, password: string) => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!supabase) {
        return { success: false, error: 'Database not configured. Please set up Supabase environment variables.' };
      }
      
      // First check if we have a valid Supabase connection
      const { data: testData, error: testError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Database connection error:', testError);
        return { success: false, error: 'Database connection failed. Please check your Supabase configuration.' };
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('admin_code', code)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid admin code' };
      }

      // In production, you should hash the password and compare
      // For demo purposes, we'll store plain text (NOT recommended)
      if (data.password_hash !== password) {
        return { success: false, error: 'Invalid password' };
      }

      const adminUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        type: 'admin',
        adminCode: data.admin_code,
      };

      setUser(adminUser);
      setUserType('admin');
      setLoading(false);

      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signInStudent = async (uid: string, email: string) => {
    try {
      setLoading(true);

      // Check if Supabase is configured
      if (!supabase) {
        return { success: false, error: 'Database not configured. Please set up Supabase environment variables.' };
      }

      // Check if environment variables contain placeholder values
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key') || 
          supabaseUrl === 'https://your-project-id.supabase.co' || 
          supabaseKey === 'your-anon-key-here') {
        return { 
          success: false, 
          error: 'Please configure your Supabase credentials in the .env file and restart the server.' 
        };
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('uid', uid)
        .eq('email', email)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid credentials. Please check your UID and email.' };
      }

      const studentUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        type: 'student',
        uid: data.uid,
        rollNo: data.roll_no,
      };

      setUser(studentUser);
      setUserType('student');
      setLoading(false);

      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Student login error:', error);
      
      // Handle specific fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Please check your Supabase configuration and internet connection.' 
        };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const registerStudent = async (data: {
    name: string;
    uid: string;
    email: string;
    rollNo: string;
  }) => {
    try {
      setLoading(true);

      // Check if Supabase is configured
      if (!supabase) {
        return { success: false, error: 'Database not configured. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.' };
      }

      // Check if environment variables contain placeholder values
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key') || 
          supabaseUrl === 'https://your-project-id.supabase.co' || 
          supabaseKey === 'your-anon-key-here') {
        return { 
          success: false, 
          error: 'Please configure your Supabase credentials:\n1. Go to your Supabase dashboard\n2. Copy your Project URL and Anon Key from Settings > API\n3. Update the .env file with these values\n4. Restart the development server' 
        };
      }

      // Check if student already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .or(`uid.eq.${data.uid},email.eq.${data.email}`)
        .single();

      if (existingStudent) {
        return { success: false, error: 'Student with this UID or email already exists' };
      }

      const { data: newStudent, error } = await supabase
        .from('students')
        .insert({
          name: data.name,
          uid: data.uid,
          email: data.email,
          roll_no: data.rollNo,
          department: 'Computer Science', // Default department
          year: '1st Year', // Default year
          gpa: 0.0,
          total_credits: 0,
        })
        .select()
        .single();

      if (error || !newStudent) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      const studentUser: User = {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        type: 'student',
        uid: newStudent.uid,
        rollNo: newStudent.roll_no,
      };

      setUser(studentUser);
      setUserType('student');
      setLoading(false);

      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Admin login error:', error);
      
      // Handle specific fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Please check:\n1. Your internet connection\n2. Supabase credentials in .env file\n3. That your Supabase project is active' 
        };
      }
      
      console.error('Registration error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { success: false, error: 'Cannot connect to database. Please check your internet connection and Supabase configuration in the .env file.' };
      }
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const signOut = async () => {
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        signInAdmin,
        signInStudent,
        registerStudent,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};