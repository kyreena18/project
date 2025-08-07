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
      
      // For development without Supabase, use mock authentication
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        // Mock admin login for development
        if (code === 'ADMIN001' && password === 'admin123') {
          const mockAdmin: User = {
            id: 'mock-admin-id',
            name: 'Mock Administrator',
            email: 'admin@college.edu',
            type: 'admin',
            adminCode: 'ADMIN001',
          };
          setUser(mockAdmin);
          setUserType('admin');
          setLoading(false);
          return { success: true };
        } else {
          return { success: false, error: 'Invalid credentials. Use ADMIN001 / admin123 for demo.' };
        }
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

      // For development without Supabase, use mock authentication
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
        // Mock student login for development
        const mockStudent: User = {
          id: 'mock-student-id',
          name: 'Mock Student',
          email: email,
          type: 'student',
          uid: uid,
          rollNo: 'MOCK001',
        };
        setUser(mockStudent);
        setUserType('student');
        setLoading(false);
        return { success: true };
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('uid', uid)
        .eq('email', email)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.error('Login error:', error);
        } else {
          console.error('Login error: No student found with provided credentials');
        }
        setLoading(false);
        return { success: false, error: 'No student found with these credentials. Please check your UID and email.' };
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

      // Check if student already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .or(`uid.eq.${data.uid},email.eq.${data.email},roll_no.eq.${data.rollNo}`)
        .maybeSingle();

      if (existingStudent) {
        return { success: false, error: 'Student with this UID, email, or roll number already exists' };
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
        .maybeSingle();

      if (error || !newStudent) {
        setLoading(false);
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
      console.error('Registration error:', error);
      setLoading(false);
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