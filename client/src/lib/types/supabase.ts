/**
 * Supabase Database Types
 * These types are generated based on our database schema
 * TODO: Replace with auto-generated types from Supabase CLI
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          password_hash?: string;
          role: 'master_admin' | 'admin' | 'employee' | 'client';
          email_verified: boolean;
          phone?: string;
          company?: string;
          job_title?: string;
          avatar_url?: string;
          timezone: string;
          preferences: Record<string, any>;
          last_login_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          first_name: string;
          last_name: string;
          password_hash?: string;
          role?: 'master_admin' | 'admin' | 'employee' | 'client';
          email_verified?: boolean;
          phone?: string;
          company?: string;
          job_title?: string;
          avatar_url?: string;
          timezone?: string;
          preferences?: Record<string, any>;
          last_login_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          first_name?: string;
          last_name?: string;
          password_hash?: string;
          role?: 'master_admin' | 'admin' | 'employee' | 'client';
          email_verified?: boolean;
          phone?: string;
          company?: string;
          job_title?: string;
          avatar_url?: string;
          timezone?: string;
          preferences?: Record<string, any>;
          last_login_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description?: string;
          status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          progress_percentage: number;
          estimated_hours?: number;
          actual_hours: number;
          budget_amount?: number;
          start_date?: string;
          estimated_completion_date?: string;
          actual_completion_date?: string;
          milestones: any[];
          deliverables: any[];
          files: any[];
          notes?: string;
          assigned_team_members: string[];
          communication_log: any[];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string;
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          progress_percentage?: number;
          estimated_hours?: number;
          actual_hours?: number;
          budget_amount?: number;
          start_date?: string;
          estimated_completion_date?: string;
          actual_completion_date?: string;
          milestones?: any[];
          deliverables?: any[];
          files?: any[];
          notes?: string;
          assigned_team_members?: string[];
          communication_log?: any[];
          created_by: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string;
          status?: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          progress_percentage?: number;
          estimated_hours?: number;
          actual_hours?: number;
          budget_amount?: number;
          start_date?: string;
          estimated_completion_date?: string;
          actual_completion_date?: string;
          milestones?: any[];
          deliverables?: any[];
          files?: any[];
          notes?: string;
          assigned_team_members?: string[];
          communication_log?: any[];
          updated_at?: string;
        };
      };
      beta_programs: {
        Row: {
          id: string;
          name: string;
          description?: string;
          status: 'draft' | 'active' | 'closed' | 'cancelled';
          requirements?: string;
          benefits?: string;
          max_participants?: number;
          current_participants: number;
          start_date?: string;
          end_date?: string;
          feedback_form_config: Record<string, any>;
          rewards: any[];
          features: any[];
          documentation_url?: string;
          slack_channel?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          status?: 'draft' | 'active' | 'closed' | 'cancelled';
          requirements?: string;
          benefits?: string;
          max_participants?: number;
          current_participants?: number;
          start_date?: string;
          end_date?: string;
          feedback_form_config?: Record<string, any>;
          rewards?: any[];
          features?: any[];
          documentation_url?: string;
          slack_channel?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          status?: 'draft' | 'active' | 'closed' | 'cancelled';
          requirements?: string;
          benefits?: string;
          max_participants?: number;
          current_participants?: number;
          start_date?: string;
          end_date?: string;
          feedback_form_config?: Record<string, any>;
          rewards?: any[];
          features?: any[];
          documentation_url?: string;
          slack_channel?: string;
          updated_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          title: string;
          slug: string;
          type: 'page' | 'blog_post' | 'solution_page' | 'resource' | 'documentation';
          status: 'draft' | 'published' | 'archived';
          excerpt?: string;
          body?: string;
          html_body?: string;
          featured_image_url?: string;
          seo_title?: string;
          seo_description?: string;
          seo_keywords?: string[];
          tags?: string[];
          category?: string;
          author_id: string;
          editor_id?: string;
          published_at?: string;
          scheduled_publish_at?: string;
          view_count: number;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          type: 'page' | 'blog_post' | 'solution_page' | 'resource' | 'documentation';
          status?: 'draft' | 'published' | 'archived';
          excerpt?: string;
          body?: string;
          html_body?: string;
          featured_image_url?: string;
          seo_title?: string;
          seo_description?: string;
          seo_keywords?: string[];
          tags?: string[];
          category?: string;
          author_id: string;
          editor_id?: string;
          published_at?: string;
          scheduled_publish_at?: string;
          view_count?: number;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          type?: 'page' | 'blog_post' | 'solution_page' | 'resource' | 'documentation';
          status?: 'draft' | 'published' | 'archived';
          excerpt?: string;
          body?: string;
          html_body?: string;
          featured_image_url?: string;
          seo_title?: string;
          seo_description?: string;
          seo_keywords?: string[];
          tags?: string[];
          category?: string;
          author_id?: string;
          editor_id?: string;
          published_at?: string;
          scheduled_publish_at?: string;
          view_count?: number;
          metadata?: Record<string, any>;
          updated_at?: string;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          company: string;
          phone?: string;
          company_size?: string;
          message: string;
          privacy_consent: boolean;
          status: 'new' | 'in_progress' | 'resolved' | 'archived';
          assigned_to?: string;
          follow_up_notes?: string;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          company: string;
          phone?: string;
          company_size?: string;
          message: string;
          privacy_consent?: boolean;
          status?: 'new' | 'in_progress' | 'resolved' | 'archived';
          assigned_to?: string;
          follow_up_notes?: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          company?: string;
          phone?: string;
          company_size?: string;
          message?: string;
          privacy_consent?: boolean;
          status?: 'new' | 'in_progress' | 'resolved' | 'archived';
          assigned_to?: string;
          follow_up_notes?: string;
        };
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          status: 'active' | 'unsubscribed' | 'bounced';
          tags?: string[];
          preferences: Record<string, any>;
          confirmed_at?: string;
          unsubscribed_at?: string;
          subscribed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          status?: 'active' | 'unsubscribed' | 'bounced';
          tags?: string[];
          preferences?: Record<string, any>;
          confirmed_at?: string;
          unsubscribed_at?: string;
          subscribed_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          status?: 'active' | 'unsubscribed' | 'bounced';
          tags?: string[];
          preferences?: Record<string, any>;
          confirmed_at?: string;
          unsubscribed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'master_admin' | 'admin' | 'employee' | 'client';
      project_status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
      content_type: 'page' | 'blog_post' | 'solution_page' | 'resource' | 'documentation';
    };
  };
}

// Utility types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type BetaProgram = Database['public']['Tables']['beta_programs']['Row'];
export type Content = Database['public']['Tables']['content']['Row'];
export type ContactSubmission = Database['public']['Tables']['contact_submissions']['Row'];
export type NewsletterSubscription = Database['public']['Tables']['newsletter_subscriptions']['Row'];

export type UserRole = Database['public']['Enums']['user_role'];
export type ProjectStatus = Database['public']['Enums']['project_status'];
export type ContentType = Database['public']['Enums']['content_type'];