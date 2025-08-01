import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          admin_code: string;
          password_hash: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          admin_code: string;
          password_hash: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          admin_code?: string;
          password_hash?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          name: string;
          uid: string;
          email: string;
          class: string;
          year: string;
          gpa: number;
          total_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          uid: string;
          email: string;
          roll_no: string;
          department?: string;
          year?: string;
          gpa?: number;
          total_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          uid?: string;
          email?: string;
          roll_no?: string;
          department?: string;
          year?: string;
          gpa?: number;
          total_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          instructor: string;
          room: string;
          schedule: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          instructor: string;
          room: string;
          schedule: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          instructor?: string;
          room?: string;
          schedule?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_courses: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          progress: number;
          grade: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          progress?: number;
          grade?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          progress?: number;
          grade?: string;
        };
      };
  };
}
}