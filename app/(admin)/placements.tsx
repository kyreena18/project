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
      // Add a small delay to ensure component is mounted before state update
      await new Promise(resolve => setTimeout(resolve, 0));
      
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
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('admin_code', code)
        .maybeSingle();

      if (error || !data) {
        console.error('Admin login error:', error);
        return { success: false, error: 'Invalid admin code or database connection issue' };
      }

      // In production, you should hash the password and compare
      // For demo purposes, we'll store plain text (NOT recommended)
      if (data.password_hash !== password) {
        const bucketName = 'student-documents';
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .createBucket(bucketName, {
          name: bucketName,
          public: true,
          file_size_limit: 52428800, // 50MB
          allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
        });
      
        if (bucketError) {
          // Check if bucket already exists
          const { data: existingBucket } = await supabase
            .from('storage.buckets')
            .select('id')
            .eq('id', bucketName)
            .single();
            
          if (!existingBucket) {
            console.warn('Bucket creation failed, using fallback bucket:', bucketError);
            return 'student-documents'; // Fallback to existing bucket
          }
        }
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