import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a comprehensive mock client for development when Supabase is not configured
const createMockClient = () => {
  const mockQuery = {
    select: (columns?: string) => mockQuery,
    insert: (data: any) => mockQuery,
    update: (data: any) => mockQuery,
    delete: () => mockQuery,
    eq: (column: string, value: any) => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    order: (column: string, options?: any) => mockQuery,
    limit: (count: number) => mockQuery,
    or: (query: string) => mockQuery,
    upsert: (data: any, options?: any) => mockQuery,
  };

  return {
    from: (table: string) => mockQuery,
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any, options?: any) => Promise.resolve({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: 'mock-url' } }),
      }),
      createBucket: (name: string, options?: any) => Promise.resolve({ error: null }),
    },
  };
};

let supabaseClient;

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-project-id') || 
    supabaseAnonKey.includes('your-anon-key')) {
  console.warn('Supabase not configured, using mock client for development');
  supabaseClient = createMockClient();
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = supabaseClient;

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
          eligible_classes: string[];
          additional_requirements: { type: string; required: boolean }[];
          bucket_name: string;
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
          eligible_classes?: string[];
          additional_requirements?: { type: string; required: boolean }[];
          bucket_name?: string;
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
          eligible_classes?: string[];
          additional_requirements?: { type: string; required: boolean }[];
          bucket_name?: string;
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
          email: string;
          class: string;
          stream_12th: string;
          resume_url: string;
          marksheet_10th_url: string;
          marksheet_12th_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          full_name: string;
          uid: string;
          roll_no: string;
          email: string;
          class?: string;
          stream_12th?: string;
          resume_url?: string;
          marksheet_10th_url?: string;
          marksheet_12th_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          full_name?: string;
          uid?: string;
          roll_no?: string;
          email?: string;
          class?: string;
          stream_12th?: string;
          resume_url?: string;
          marksheet_10th_url?: string;
          marksheet_12th_url?: string;
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