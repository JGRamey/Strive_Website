import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useSupabaseAuth, ProtectedRoute as SupabaseProtectedRoute } from './supabase-auth';
import type { User as DatabaseUser } from './types/supabase';

// Legacy User interface for backwards compatibility
interface LegacyUser {
  id: string;
  username: string;
  email: string;
  emailVerified: string;
  createdAt: string;
}

// Auth context interface (kept for backwards compatibility)
interface AuthContextType {
  user: LegacyUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Supabase user to legacy format
function convertToLegacyUser(userProfile: DatabaseUser | null): LegacyUser | null {
  if (!userProfile) return null;
  
  return {
    id: userProfile.id,
    username: userProfile.username,
    email: userProfile.email,
    emailVerified: userProfile.email_verified ? 'true' : 'false',
    createdAt: userProfile.created_at,
  };
}

// Auth provider component (wrapper around Supabase auth)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user: supabaseUser,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  } = useSupabaseAuth();

  // Convert Supabase auth to legacy interface
  const user = convertToLegacyUser(userProfile);
  const token = session?.access_token || null;

  // Wrapper functions to match legacy interface
  const login = async (username: string, password: string) => {
    // Try login with username first, fallback to email
    let email = username;
    
    // If username doesn't contain @, try to find email by username
    if (!username.includes('@')) {
      // For now, we'll assume username is actually email
      // In a real implementation, you might want to query the database
      throw new Error('Please use your email address to login');
    }

    const result = await signIn(email, password);
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const signup = async (
    username: string, 
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ) => {
    const result = await signUp(email, password, {
      username,
      first_name: firstName,
      last_name: lastName,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  const logout = async () => {
    const result = await signOut();
    if (result.error) {
      throw new Error(result.error.message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      isAuthenticated,
      isLoading: loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context (backwards compatibility)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component (wrapper around Supabase ProtectedRoute)
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  return (
    <SupabaseProtectedRoute
      fallback={fallback || <div className="flex items-center justify-center min-h-screen">Please log in to access this page.</div>}
    >
      {children}
    </SupabaseProtectedRoute>
  );
};

// Export legacy token management functions (now no-ops for compatibility)
export const getToken = () => {
  console.warn('getToken is deprecated. Use useAuth hook instead.');
  return null;
};

export const setToken = (token: string) => {
  console.warn('setToken is deprecated. Authentication is now handled by Supabase.');
};

export const removeToken = () => {
  console.warn('removeToken is deprecated. Use logout function instead.');
};

export const getStoredUser = () => {
  console.warn('getStoredUser is deprecated. Use useAuth hook instead.');
  return null;
};

export const setStoredUser = (user: any) => {
  console.warn('setStoredUser is deprecated. User data is handled by Supabase.');
};

export const removeStoredUser = () => {
  console.warn('removeStoredUser is deprecated. Use logout function instead.');
};

// Export enhanced auth hook for new features
export { useAuth as useSupabaseAuth, ProtectedRoute as SupabaseProtectedRoute } from './supabase-auth';