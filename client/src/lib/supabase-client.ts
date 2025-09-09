import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// Supabase client configuration for browser use
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Create Supabase client only if credentials are available (graceful degradation)
export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth settings
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
    // Custom storage for session persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  // Global request configuration
  global: {
    headers: {
      'X-Client-Info': 'strive-tech-website',
    },
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events for performance
    },
  },
}) : null;

// Export types for convenience
export type { Database } from './types/supabase';

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Helper function to get current session
export const getCurrentSession = async () => {
  if (!supabase) return { session: null, error: new Error('Supabase not configured') };
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Helper function to get current user
export const getCurrentUser = async () => {
  if (!supabase) return { user: null, error: new Error('Supabase not configured') };
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Helper function to sign out
export const signOut = async () => {
  if (!supabase) return { error: new Error('Supabase not configured') };
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper function to refresh session
export const refreshSession = async () => {
  if (!supabase) return { session: null, user: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase.auth.refreshSession();
  return { session: data.session, user: data.user, error };
};

// Real-time subscription helper
export const subscribeToTable = (
  table: keyof Database['public']['Tables'],
  callback: (payload: any) => void,
  filter?: string
) => {
  if (!supabase) {
    console.warn('Supabase not configured, real-time subscriptions disabled');
    return null;
  }
  
  let subscription = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: table as string,
        filter: filter 
      },
      callback
    )
    .subscribe();

  return subscription;
};

// Helper to unsubscribe from real-time
export const unsubscribeFromTable = (subscription: any) => {
  if (!supabase || !subscription) return;
  return supabase.removeChannel(subscription);
};

export default supabase;