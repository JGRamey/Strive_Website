import { createClient } from '@supabase/supabase-js';
import { Database } from '../../client/src/lib/types/supabase';

// Server-side Supabase client with service role key (admin access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables for server-side admin access:\n' +
    '- SUPABASE_URL\n' +
    '- SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Create admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Regular server-side client with anon key (respects RLS)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
export const supabaseServer = supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * User Management Functions
 */

// Create a new user with specified role
export async function createUser(userData: {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  role?: 'master_admin' | 'admin' | 'employee' | 'client';
  company?: string;
  phone?: string;
}) {
  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    });

    if (authError) {
      console.error('Error creating user in auth:', authError);
      return { user: null, error: authError };
    }

    // Create user profile in database
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'client',
        company: userData.company,
        phone: userData.phone,
        email_verified: true, // Admin-created users are pre-verified
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Try to clean up auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { user: null, error: profileError };
    }

    return { user: profileData, error: null };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { user: null, error: error as any };
  }
}

// Get user by ID (admin access)
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { user: data, error };
  } catch (error) {
    return { user: null, error: error as any };
  }
}

// Get user by email (admin access)
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    return { user: data, error };
  } catch (error) {
    return { user: null, error: error as any };
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'master_admin' | 'admin' | 'employee' | 'client') {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    return { user: data, error };
  } catch (error) {
    return { user: null, error: error as any };
  }
}

// Delete user (admin only)
export async function deleteUser(userId: string) {
  try {
    // Delete from auth first
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return { error: authError };
    }

    // Database profile will be deleted automatically due to CASCADE constraint
    return { error: null };
  } catch (error) {
    return { error: error as any };
  }
}

/**
 * Project Management Functions
 */

// Create project
export async function createProject(projectData: Database['public']['Tables']['projects']['Insert']) {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    return { project: data, error };
  } catch (error) {
    return { project: null, error: error as any };
  }
}

// Get projects for client
export async function getProjectsForClient(clientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:users!projects_client_id_fkey(id, username, first_name, last_name, email),
        created_by_user:users!projects_created_by_fkey(id, username, first_name, last_name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    return { projects: data, error };
  } catch (error) {
    return { projects: null, error: error as any };
  }
}

/**
 * Content Management Functions
 */

// Get published content
export async function getPublishedContent(type?: string) {
  try {
    let query = supabaseAdmin
      .from('content')
      .select(`
        *,
        author:users!content_author_id_fkey(id, username, first_name, last_name)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    return { content: data, error };
  } catch (error) {
    return { content: null, error: error as any };
  }
}

/**
 * Activity Logging Functions
 */

// Log user activity
export async function logActivity(
  userId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }

    return { error };
  } catch (error) {
    console.error('Error in logActivity:', error);
    return { error: error as any };
  }
}

// Log failed activity
export async function logFailedActivity(
  userId: string | null,
  action: string,
  errorMessage: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        success: false,
        error_message: errorMessage,
      });

    if (error) {
      console.error('Error logging failed activity:', error);
    }

    return { error };
  } catch (error) {
    console.error('Error in logFailedActivity:', error);
    return { error: error as any };
  }
}

/**
 * Database Health Check
 */

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error: error as any };
  }
}

/**
 * Migration Helpers
 */

// Check if master admin exists
export async function masterAdminExists() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'master_admin')
      .limit(1);

    return { exists: (data && data.length > 0), error };
  } catch (error) {
    return { exists: false, error: error as any };
  }
}

// Migrate existing Drizzle users to Supabase
export async function migrateUser(userData: {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: string;
  createdAt: string;
}) {
  try {
    // Check if user already exists in Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userData.id)
      .single();

    if (existingUser) {
      return { user: existingUser, error: null, skipped: true };
    }

    // Insert migrated user
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userData.id,
        email: userData.email,
        username: userData.username,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: 'client', // Default role for migrated users
        email_verified: userData.emailVerified === 'true',
        created_at: userData.createdAt,
        updated_at: userData.createdAt,
      })
      .select()
      .single();

    return { user: data, error, skipped: false };
  } catch (error) {
    return { user: null, error: error as any, skipped: false };
  }
}

export default supabaseAdmin;