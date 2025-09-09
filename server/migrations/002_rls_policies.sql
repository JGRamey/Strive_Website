-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- Strive Tech Role-Based Access Control
-- ==============================================

-- This file contains all Row Level Security policies for the Strive Tech database
-- Access Control Matrix:
-- - Master Admin: Full access to all tables and data
-- - Admin: Full access to CRM, CMS, analytics, and user management  
-- - Employee: Limited access to assigned CRM contacts, content creation, project updates
-- - Client: Access only to their own data and assigned projects

-- ==============================================
-- USERS TABLE POLICIES
-- ==============================================

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (
    auth.uid()::text = id::text 
    AND (OLD.role = NEW.role OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'))
  );

-- Master admins and admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Master admins can insert/update/delete any user
CREATE POLICY "Master admin full user access" ON users
  FOR ALL USING (auth.jwt() ->> 'user_role' = 'master_admin');

-- Admins can create new users (except master_admins)
CREATE POLICY "Admins can create users" ON users
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin' 
    AND NEW.role != 'master_admin'
  );

-- ==============================================
-- PROJECTS TABLE POLICIES  
-- ==============================================

-- Clients can read their own projects
CREATE POLICY "Clients read own projects" ON projects
  FOR SELECT USING (
    auth.uid()::text = client_id::text
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
    OR auth.uid()::text = ANY(assigned_team_members::text[])
  );

-- Employees can read assigned projects
CREATE POLICY "Employees read assigned projects" ON projects
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' = 'employee' 
    AND auth.uid()::text = ANY(assigned_team_members::text[])
  );

-- Admins and master admins can read all projects
CREATE POLICY "Admins read all projects" ON projects
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Admins can create/update/delete projects
CREATE POLICY "Admins manage projects" ON projects
  FOR ALL USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Employees can update assigned projects (limited fields)
CREATE POLICY "Employees update assigned projects" ON projects
  FOR UPDATE USING (
    auth.jwt() ->> 'user_role' = 'employee'
    AND auth.uid()::text = ANY(OLD.assigned_team_members::text[])
  ) WITH CHECK (
    auth.jwt() ->> 'user_role' = 'employee'
    AND auth.uid()::text = ANY(NEW.assigned_team_members::text[])
    -- Prevent employees from changing critical fields
    AND OLD.client_id = NEW.client_id
    AND OLD.budget_amount = NEW.budget_amount
    AND OLD.assigned_team_members = NEW.assigned_team_members
  );

-- ==============================================
-- BETA_PROGRAMS TABLE POLICIES
-- ==============================================

-- Everyone can read active beta programs
CREATE POLICY "Read active beta programs" ON beta_programs
  FOR SELECT USING (status = 'active' OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- Admins can manage beta programs
CREATE POLICY "Admins manage beta programs" ON beta_programs
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- BETA_PARTICIPANTS TABLE POLICIES
-- ==============================================

-- Users can read their own participation
CREATE POLICY "Users read own participation" ON beta_participants
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own participation
CREATE POLICY "Users join beta programs" ON beta_participants
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own participation (limited fields)
CREATE POLICY "Users update own participation" ON beta_participants
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (
    auth.uid()::text = user_id::text
    AND OLD.user_id = NEW.user_id
    AND OLD.program_id = NEW.program_id
  );

-- Admins can manage all participation
CREATE POLICY "Admins manage participation" ON beta_participants
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- CONTENT TABLE POLICIES
-- ==============================================

-- Everyone can read published content
CREATE POLICY "Read published content" ON content
  FOR SELECT USING (
    status = 'published' 
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
    OR auth.uid()::text = author_id::text
  );

-- Authors can read their own content
CREATE POLICY "Authors read own content" ON content
  FOR SELECT USING (auth.uid()::text = author_id::text);

-- Employees can create content
CREATE POLICY "Employees create content" ON content
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
    AND auth.uid()::text = author_id::text
  );

-- Authors can update their own content
CREATE POLICY "Authors update own content" ON content
  FOR UPDATE USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

-- Admins can manage all content
CREATE POLICY "Admins manage all content" ON content
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- SOCIAL_MEDIA_POSTS TABLE POLICIES
-- ==============================================

-- Authors can read their own posts
CREATE POLICY "Authors read own social posts" ON social_media_posts
  FOR SELECT USING (
    auth.uid()::text = author_id::text
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Employees can create social media posts
CREATE POLICY "Employees create social posts" ON social_media_posts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
    AND auth.uid()::text = author_id::text
  );

-- Authors can update their own posts (if not published)
CREATE POLICY "Authors update own social posts" ON social_media_posts
  FOR UPDATE USING (
    auth.uid()::text = author_id::text
    AND OLD.status != 'published'
  ) WITH CHECK (
    auth.uid()::text = author_id::text
  );

-- Admins can manage all social media posts
CREATE POLICY "Admins manage all social posts" ON social_media_posts
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- CRM_CONTACTS TABLE POLICIES
-- ==============================================

-- Employees can read assigned contacts
CREATE POLICY "Employees read assigned contacts" ON crm_contacts
  FOR SELECT USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Employees can update assigned contacts
CREATE POLICY "Employees update assigned contacts" ON crm_contacts
  FOR UPDATE USING (auth.uid()::text = assigned_to::text)
  WITH CHECK (auth.uid()::text = assigned_to::text);

-- Employees can create new contacts
CREATE POLICY "Employees create contacts" ON crm_contacts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
  );

-- Admins can manage all contacts
CREATE POLICY "Admins manage all contacts" ON crm_contacts
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- PERMISSIONS TABLE POLICIES
-- ==============================================

-- Users can read their own permissions
CREATE POLICY "Users read own permissions" ON permissions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Master admins can manage all permissions
CREATE POLICY "Master admins manage permissions" ON permissions
  FOR ALL USING (auth.jwt() ->> 'user_role' = 'master_admin');

-- Admins can grant limited permissions (not master_admin role)
CREATE POLICY "Admins grant limited permissions" ON permissions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'user_role' = 'admin'
    AND resource_type != 'users'
  );

-- ==============================================
-- ACTIVITY_LOGS TABLE POLICIES
-- ==============================================

-- Users can read their own activity logs
CREATE POLICY "Users read own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admins can read all activity logs
CREATE POLICY "Admins read all activity logs" ON activity_logs
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- System can insert activity logs (no user restriction)
CREATE POLICY "System inserts activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Only master admins can delete activity logs
CREATE POLICY "Master admins delete activity logs" ON activity_logs
  FOR DELETE USING (auth.jwt() ->> 'user_role' = 'master_admin');

-- ==============================================
-- CONTACT_SUBMISSIONS TABLE POLICIES
-- ==============================================

-- Admins and employees can read contact submissions
CREATE POLICY "Staff read contact submissions" ON contact_submissions
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin', 'employee')
  );

-- Anyone can create contact submissions (public form)
CREATE POLICY "Public create contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Assigned staff can update contact submissions
CREATE POLICY "Assigned staff update submissions" ON contact_submissions
  FOR UPDATE USING (
    auth.uid()::text = assigned_to::text
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Admins can manage all contact submissions
CREATE POLICY "Admins manage contact submissions" ON contact_submissions
  FOR ALL USING (auth.jwt() ->> 'user_role' IN ('master_admin', 'admin'));

-- ==============================================
-- NEWSLETTER_SUBSCRIPTIONS TABLE POLICIES
-- ==============================================

-- Anyone can subscribe to newsletter (public)
CREATE POLICY "Public newsletter subscription" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Users can manage their own subscription
CREATE POLICY "Users manage own subscription" ON newsletter_subscriptions
  FOR ALL USING (
    email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- Admins can read all subscriptions
CREATE POLICY "Admins read all subscriptions" ON newsletter_subscriptions
  FOR SELECT USING (
    auth.jwt() ->> 'user_role' IN ('master_admin', 'admin')
  );

-- ==============================================
-- UTILITY FUNCTIONS FOR RLS
-- ==============================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id_param UUID,
  resource_type_param TEXT,
  resource_id_param UUID,
  action_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM permissions
    WHERE user_id = user_id_param
    AND resource_type = resource_type_param
    AND (resource_id IS NULL OR resource_id = resource_id_param)
    AND action_param = ANY(actions)
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'user_role', 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('master_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- POLICY TESTING QUERIES (FOR DEVELOPMENT)
-- ==============================================

-- Uncomment these for testing RLS policies in development
-- Make sure to comment out before production deployment

/*
-- Test data for RLS validation
INSERT INTO users (id, email, username, first_name, last_name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'master@strive-tech.com', 'master_admin', 'Master', 'Admin', 'master_admin'),
  ('00000000-0000-0000-0000-000000000002', 'admin@strive-tech.com', 'admin_user', 'Admin', 'User', 'admin'),
  ('00000000-0000-0000-0000-000000000003', 'employee@strive-tech.com', 'employee_user', 'Employee', 'User', 'employee'),
  ('00000000-0000-0000-0000-000000000004', 'client@example.com', 'client_user', 'Client', 'User', 'client')
ON CONFLICT DO NOTHING;

-- Test policies by setting different JWT contexts
-- SET LOCAL auth.jwt TO '{"user_id": "00000000-0000-0000-0000-000000000001", "user_role": "master_admin"}';
-- SELECT * FROM users; -- Should see all users

-- SET LOCAL auth.jwt TO '{"user_id": "00000000-0000-0000-0000-000000000004", "user_role": "client"}';  
-- SELECT * FROM users; -- Should only see own user
*/