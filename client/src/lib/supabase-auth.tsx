import { useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import { User as DatabaseUser } from './types/supabase';

// Authentication state interface
export interface AuthState {
  user: User | null;
  userProfile: DatabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

// Helper to create AuthError objects
const createAuthError = (message: string, code: string = 'AUTH_ERROR'): AuthError => ({
  name: 'AuthError',
  message,
  code,
  status: 400,
  __isAuthError: true
} as unknown as AuthError);

// Authentication hook with enhanced functionality
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    session: null,
    loading: !supabase, // If no supabase, not loading
    error: !supabase ? { name: 'AuthError', message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED', status: 500, __isAuthError: true } as unknown as AuthError : null,
  });

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string): Promise<DatabaseUser | null> => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Update auth state
  const updateAuthState = useCallback(async (session: Session | null) => {
    setState(prev => ({ ...prev, loading: true }));

    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id);
      setState({
        user: session.user,
        userProfile,
        session,
        loading: false,
        error: null,
      });
    } else {
      setState({
        user: null,
        userProfile: null,
        session: null,
        loading: false,
        error: null,
      });
    }
  }, [fetchUserProfile]);

  // Initialize auth state and set up listener
  useEffect(() => {
    if (!supabase) {
      setState({
        user: null,
        userProfile: null,
        session: null,
        loading: false,
        error: null, // Don't treat missing Supabase as an error for preview
      });
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
      } else {
        updateAuthState(session);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            await updateAuthState(session);
            break;
          case 'SIGNED_OUT':
            setState({
              user: null,
              userProfile: null,
              session: null,
              loading: false,
              error: null,
            });
            break;
          case 'TOKEN_REFRESHED':
            await updateAuthState(session);
            break;
          case 'USER_UPDATED':
            if (session) {
              const userProfile = await fetchUserProfile(session.user.id);
              setState(prev => ({
                ...prev,
                user: session.user,
                userProfile,
                session,
              }));
            }
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [updateAuthState, fetchUserProfile]);

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    userData: {
      username: string;
      first_name: string;
      last_name: string;
      company?: string;
      phone?: string;
    }
  ) => {
    if (!supabase) {
      const error = createAuthError('Supabase not configured', 'SUPABASE_NOT_CONFIGURED');
      setState(prev => ({ ...prev, error, loading: false }));
      return { user: null, error };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            company: userData.company,
            phone: userData.phone,
          },
        },
      });

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return { user: null, error };
      }

      // If user is created, create profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            company: userData.company,
            phone: userData.phone,
            role: 'client', // Default role
            email_verified: false,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Note: We don't return error here as auth signup succeeded
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      return { user: data.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { user: null, error: authError };
    }
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const error = createAuthError('Supabase not configured', 'SUPABASE_NOT_CONFIGURED');
      setState(prev => ({ ...prev, error, loading: false }));
      return { user: null, error };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return { user: null, error };
      }

      // Update last_login_at in user profile
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      setState(prev => ({ ...prev, loading: false }));
      return { user: data.user, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError, loading: false }));
      return { user: null, error: authError };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    if (!supabase) {
      const error = createAuthError('Supabase not configured', 'SUPABASE_NOT_CONFIGURED');
      return { error };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }

    setState({
      user: null,
      userProfile: null,
      session: null,
      loading: false,
      error: null,
    });

    return { error: null };
  }, []);

  // Password reset function
  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  // Update password function
  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }, []);

  // Update user profile function
  const updateProfile = useCallback(async (updates: Partial<DatabaseUser>) => {
    if (!state.user) return { error: new Error('No authenticated user') };

    setState(prev => ({ ...prev, loading: true }));

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();

    if (error) {
      setState(prev => ({ ...prev, error: error as any, loading: false }));
      return { error };
    }

    setState(prev => ({
      ...prev,
      userProfile: data,
      loading: false,
      error: null,
    }));

    return { error: null };
  }, [state.user]);

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const userProfile = await fetchUserProfile(state.user.id);
    setState(prev => ({ ...prev, userProfile }));
  }, [state.user, fetchUserProfile]);

  return {
    // State
    ...state,
    state, // Explicitly expose state for components that need it
    
    // Auth actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,

    // Helper properties
    isAuthenticated: !!state.user,
    isAdmin: state.userProfile?.role === 'admin' || state.userProfile?.role === 'master_admin',
    isMasterAdmin: state.userProfile?.role === 'master_admin',
    userRole: state.userProfile?.role || 'client',
  };
}

// Protected route component props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: DatabaseUser['role'];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// Protected route component
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }

  // Check role requirement
  if (requiredRole && userProfile?.role !== requiredRole) {
    // Check if user has sufficient role level
    const roleHierarchy = {
      'client': 0,
      'employee': 1,
      'admin': 2,
      'master_admin': 3,
    };

    const userRoleLevel = roleHierarchy[userProfile?.role || 'client'];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Role check utilities
export const hasRole = (userRole: string, requiredRole: DatabaseUser['role']): boolean => {
  const roleHierarchy = {
    'client': 0,
    'employee': 1,
    'admin': 2,
    'master_admin': 3,
  };

  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
};

export const canAccessResource = (
  userRole: string,
  resourceType: string,
  action: string
): boolean => {
  // Define access matrix based on role
  const accessMatrix = {
    master_admin: ['*'], // Full access
    admin: ['users.read', 'projects.*', 'content.*', 'crm.*', 'social.*', 'analytics.*'],
    employee: ['users.read', 'projects.read', 'content.create', 'content.update', 'crm.read', 'crm.update'],
    client: ['users.read', 'projects.read'],
  };

  const userPermissions = accessMatrix[userRole as keyof typeof accessMatrix] || [];
  const permissionKey = `${resourceType}.${action}`;

  return userPermissions.includes('*') || 
         userPermissions.includes(permissionKey) ||
         userPermissions.includes(`${resourceType}.*`);
};

// Export AuthProvider as a wrapper around the context
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};