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
      placement_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          company_name: string;
          event_date: string;
          application_deadline: string;
          requirements: string;
          bucket_name: string;
          created_by: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          company_name: string;
          event_date: string;
          application_deadline: string;
          requirements?: string;
          bucket_name: string;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          company_name?: string;
          event_date?: string;
          application_deadline?: string;
          requirements?: string;
          bucket_name?: string;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      placement_requirements: {
        Row: {
          id: string;
          event_id: string;
          type: string;
          description: string;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          type: string;
          description: string;
          is_required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          type?: string;
          description?: string;
          is_required?: boolean;
          created_at?: string;
        };
      };
      placement_applications: {
        Row: {
          id: string;
          placement_event_id: string;
          student_id: string;
          application_status: string;
          applied_at: string;
          admin_notes: string;
        };
        Insert: {
          id?: string;
          placement_event_id: string;
          student_id: string;
          application_status?: string;
          applied_at?: string;
          admin_notes?: string;
        };
        Update: {
          id?: string;
          placement_event_id?: string;
          student_id?: string;
          application_status?: string;
          applied_at?: string;
          admin_notes?: string;
        };
      };
      student_requirement_submissions: {
        Row: {
          id: string;
          placement_application_id: string;
          requirement_id: string;
          file_url: string;
          submission_status: string;
          submitted_at: string;
          admin_feedback: string;
        };
        Insert: {
          id?: string;
          placement_application_id: string;
          requirement_id: string;
          file_url: string;
          submission_status?: string;
          submitted_at?: string;
          admin_feedback?: string;
        };
        Update: {
          id?: string;
          placement_application_id?: string;
          requirement_id?: string;
          file_url?: string;
          submission_status?: string;
          submitted_at?: string;
          admin_feedback?: string;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          student_id: string;
          full_name: string;
          uid: string;
          roll_no: string;
          class: string;
          resume_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          full_name: string;
          uid: string;
          roll_no: string;
          class?: string;
          resume_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          full_name?: string;
          uid?: string;
          roll_no?: string;
          class?: string;
          resume_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      internship_submissions: {
        Row: {
          id: string;
          title: string;
          description: string;
          submission_type: string;
          is_required: boolean;
          deadline: string;
          created_by: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          submission_type: string;
          is_required?: boolean;
          deadline: string;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          submission_type?: string;
          is_required?: boolean;
          deadline?: string;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_internship_submissions: {
        Row: {
          id: string;
          internship_submission_id: string;
          student_id: string;
          file_url: string;
          submission_status: string;
          submitted_at: string;
          admin_feedback: string;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          internship_submission_id: string;
          student_id: string;
          file_url: string;
          submission_status?: string;
          submitted_at?: string;
          admin_feedback?: string;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          internship_submission_id?: string;
          student_id?: string;
          file_url?: string;
          submission_status?: string;
          submitted_at?: string;
          admin_feedback?: string;
          reviewed_at?: string;
        };
      };
  };
}
}