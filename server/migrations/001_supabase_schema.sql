-- ==============================================
-- STRIVE TECH SUPABASE SCHEMA MIGRATION
-- Phase 1: Complete Business Database Schema
-- ==============================================

-- Enable Row Level Security on all tables
-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- USERS TABLE (Enhanced for Role-Based Access)
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT, -- Will be null for Supabase Auth users
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('master_admin', 'admin', 'employee', 'client')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PROJECTS TABLE (Client Project Management)
-- ==============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  budget_amount DECIMAL(10,2),
  start_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  milestones JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  files JSONB DEFAULT '[]',
  notes TEXT,
  assigned_team_members UUID[], -- Array of user IDs
  communication_log JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- BETA_PROGRAMS TABLE (Beta Testing Management)
-- ==============================================
CREATE TABLE IF NOT EXISTS beta_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
  requirements TEXT,
  benefits TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  feedback_form_config JSONB DEFAULT '{}',
  rewards JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  documentation_url TEXT,
  slack_channel TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on beta_programs table
ALTER TABLE beta_programs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- BETA_PARTICIPANTS TABLE (Beta Program Participation)
-- ==============================================
CREATE TABLE IF NOT EXISTS beta_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES beta_programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'active', 'completed', 'withdrawn')),
  application_notes TEXT,
  feedback_submissions JSONB DEFAULT '[]',
  badges_earned JSONB DEFAULT '[]',
  participation_score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(program_id, user_id)
);

-- Enable RLS on beta_participants table
ALTER TABLE beta_participants ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CONTENT TABLE (CMS Functionality)
-- ==============================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('page', 'blog_post', 'solution_page', 'resource', 'documentation')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  excerpt TEXT,
  body TEXT,
  html_body TEXT, -- Rendered HTML
  featured_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  tags TEXT[],
  category TEXT,
  author_id UUID REFERENCES users(id),
  editor_id UUID REFERENCES users(id), -- Last editor
  published_at TIMESTAMPTZ,
  scheduled_publish_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on content table
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- SOCIAL_MEDIA_POSTS TABLE (Social Media Management)
-- ==============================================
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'youtube')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  mentions TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT, -- ID from the social platform
  engagement_metrics JSONB DEFAULT '{}', -- likes, shares, comments, etc.
  campaign_id TEXT, -- For grouping related posts
  author_id UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on social_media_posts table
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CRM_CONTACTS TABLE (Customer Relationship Management)
-- ==============================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'client', 'inactive', 'lost')),
  lead_source TEXT, -- Where they came from
  industry TEXT,
  company_size TEXT,
  annual_revenue DECIMAL(15,2),
  location TEXT,
  timezone TEXT,
  assigned_to UUID REFERENCES users(id), -- Sales/account rep
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist')),
  lead_score INTEGER DEFAULT 0,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  communication_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on crm_contacts table
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PERMISSIONS TABLE (Granular Access Control)
-- ==============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- e.g., 'projects', 'crm_contacts', 'content'
  resource_id UUID, -- Specific resource ID (NULL for global permissions)
  actions TEXT[] NOT NULL, -- e.g., ['read', 'write', 'delete']
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  conditions JSONB DEFAULT '{}', -- Additional conditions for permission
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- ACTIVITY_LOGS TABLE (Comprehensive Audit Trail)
-- ==============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- e.g., 'create', 'update', 'delete', 'login', 'logout'
  resource_type TEXT, -- e.g., 'user', 'project', 'content'
  resource_id UUID, -- ID of the affected resource
  details JSONB DEFAULT '{}', -- Additional context about the action
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activity_logs table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- LEGACY TABLES (Preserve existing data)
-- ==============================================

-- Contact Submissions (migrate existing data)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  company_size TEXT,
  message TEXT NOT NULL,
  privacy_consent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  assigned_to UUID REFERENCES users(id),
  follow_up_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on contact_submissions table
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Newsletter Subscriptions (migrate existing data)
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  tags TEXT[],
  preferences JSONB DEFAULT '{}',
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on newsletter_subscriptions table
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_team_members ON projects USING gin(assigned_team_members);

-- Beta programs indexes
CREATE INDEX IF NOT EXISTS idx_beta_programs_status ON beta_programs(status);
CREATE INDEX IF NOT EXISTS idx_beta_participants_program_id ON beta_participants(program_id);
CREATE INDEX IF NOT EXISTS idx_beta_participants_user_id ON beta_participants(user_id);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_published_at ON content(published_at);
CREATE INDEX IF NOT EXISTS idx_content_tags ON content USING gin(tags);

-- Social media posts indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_media_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags ON social_media_posts USING gin(hashtags);

-- CRM contacts indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_assigned_to ON crm_contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_contacted ON crm_contacts(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags ON crm_contacts USING gin(tags);

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_id ON permissions(resource_id);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Contact submissions indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at);

-- Newsletter subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);

-- ==============================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beta_programs_updated_at BEFORE UPDATE ON beta_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_media_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE users IS 'Enhanced users table with role-based access control';
COMMENT ON TABLE projects IS 'Client project tracking with milestones and team assignment';
COMMENT ON TABLE beta_programs IS 'Beta testing program management';
COMMENT ON TABLE beta_participants IS 'Participants in beta testing programs';
COMMENT ON TABLE content IS 'CMS functionality for website content management';
COMMENT ON TABLE social_media_posts IS 'Social media scheduling and management';
COMMENT ON TABLE crm_contacts IS 'Customer relationship management contacts';
COMMENT ON TABLE permissions IS 'Granular permission system for access control';
COMMENT ON TABLE activity_logs IS 'Comprehensive audit trail for all system activities';
COMMENT ON TABLE contact_submissions IS 'Website contact form submissions';
COMMENT ON TABLE newsletter_subscriptions IS 'Email newsletter subscriber management';

-- ==============================================
-- INITIAL DATA SETUP
-- ==============================================

-- Create default content entries for existing pages
INSERT INTO content (id, title, slug, type, status, body, author_id) VALUES 
  (uuid_generate_v4(), 'Homepage', 'home', 'page', 'published', 'Strive Tech homepage content', NULL),
  (uuid_generate_v4(), 'About Us', 'about', 'page', 'published', 'About Strive Tech', NULL),
  (uuid_generate_v4(), 'Contact', 'contact', 'page', 'published', 'Contact information and form', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Create default beta program
INSERT INTO beta_programs (id, name, description, status, max_participants) VALUES 
  (uuid_generate_v4(), 'AI Solutions Beta', 'Early access to our latest AI automation tools', 'active', 50)
ON CONFLICT DO NOTHING;