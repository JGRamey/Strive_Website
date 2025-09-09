import { supabaseAdmin } from './supabase-admin';
import { Database } from '../../client/src/lib/types/supabase';

type UserRole = Database['public']['Enums']['user_role'];

/**
 * Role hierarchy and permissions system
 */

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  'client': 1,
  'employee': 2,
  'admin': 3,
  'master_admin': 4,
} as const;

// Resource permissions matrix
export const PERMISSIONS_MATRIX = {
  // User management
  'users.read': ['admin', 'master_admin'],
  'users.create': ['admin', 'master_admin'],
  'users.update': ['admin', 'master_admin'],
  'users.delete': ['master_admin'],
  'users.update_role': ['master_admin'],

  // Project management
  'projects.read': ['employee', 'admin', 'master_admin'],
  'projects.create': ['admin', 'master_admin'],
  'projects.update': ['admin', 'master_admin'],
  'projects.delete': ['admin', 'master_admin'],
  'projects.assign': ['admin', 'master_admin'],

  // Content management
  'content.read': ['employee', 'admin', 'master_admin'],
  'content.create': ['employee', 'admin', 'master_admin'],
  'content.update': ['employee', 'admin', 'master_admin'],
  'content.delete': ['admin', 'master_admin'],
  'content.publish': ['admin', 'master_admin'],

  // CRM management
  'crm.read': ['employee', 'admin', 'master_admin'],
  'crm.create': ['employee', 'admin', 'master_admin'],
  'crm.update': ['employee', 'admin', 'master_admin'],
  'crm.delete': ['admin', 'master_admin'],
  'crm.assign': ['admin', 'master_admin'],

  // Social media management
  'social.read': ['employee', 'admin', 'master_admin'],
  'social.create': ['employee', 'admin', 'master_admin'],
  'social.update': ['employee', 'admin', 'master_admin'],
  'social.delete': ['admin', 'master_admin'],
  'social.publish': ['admin', 'master_admin'],

  // Analytics
  'analytics.read': ['admin', 'master_admin'],
  'analytics.export': ['admin', 'master_admin'],

  // Beta programs
  'beta.read': ['employee', 'admin', 'master_admin'],
  'beta.create': ['admin', 'master_admin'],
  'beta.update': ['admin', 'master_admin'],
  'beta.delete': ['admin', 'master_admin'],
  'beta.participate': ['client', 'employee', 'admin', 'master_admin'],

  // System administration
  'system.logs': ['master_admin'],
  'system.config': ['master_admin'],
  'system.backup': ['master_admin'],

  // Contact submissions
  'contact.read': ['employee', 'admin', 'master_admin'],
  'contact.update': ['employee', 'admin', 'master_admin'],
  'contact.delete': ['admin', 'master_admin'],

  // Newsletter management
  'newsletter.read': ['admin', 'master_admin'],
  'newsletter.create': ['admin', 'master_admin'],
  'newsletter.send': ['admin', 'master_admin'],
} as const;

/**
 * Permission checking functions
 */

// Check if user has permission for a specific action
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const requiredRoles = PERMISSIONS_MATRIX[permission as keyof typeof PERMISSIONS_MATRIX];
  return requiredRoles ? requiredRoles.includes(userRole) : false;
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Check if user has all specified permissions
export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Check if user role is higher than or equal to minimum required role
export function hasRoleLevel(userRole: UserRole, minimumRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minimumLevel;
}

// Get user's role level
export function getRoleLevel(userRole: UserRole): number {
  return ROLE_HIERARCHY[userRole] || 0;
}

// Check if user can access resource
export function canAccessResource(
  userRole: UserRole,
  resourceType: string,
  action: string,
  resourceOwnerId?: string,
  userId?: string
): boolean {
  const permission = `${resourceType}.${action}`;

  // Check base permission
  if (!hasPermission(userRole, permission)) {
    // Special cases for self-access
    if (resourceOwnerId && userId && resourceOwnerId === userId) {
      // Users can always read/update their own data
      if (action === 'read' || action === 'update') {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * Database permission checking
 */

// Get user permissions from database
export async function getUserPermissions(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()'); // Include non-expiring or future permissions

    return { permissions: data, error };
  } catch (error) {
    return { permissions: null, error: error as any };
  }
}

// Check if user has specific permission in database
export async function hasSpecificPermission(
  userId: string,
  resourceType: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  try {
    let query = supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .contains('actions', [action])
      .or('expires_at.is.null,expires_at.gt.now()');

    if (resourceId) {
      query = query.or(`resource_id.is.null,resource_id.eq.${resourceId}`);
    } else {
      query = query.is('resource_id', null);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('Error checking specific permission:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in hasSpecificPermission:', error);
    return false;
  }
}

// Grant permission to user
export async function grantPermission(
  userId: string,
  resourceType: string,
  actions: string[],
  grantedBy: string,
  resourceId?: string,
  expiresAt?: string,
  conditions?: any
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        actions,
        granted_by: grantedBy,
        expires_at: expiresAt,
        conditions: conditions || {},
      })
      .select()
      .single();

    return { permission: data, error };
  } catch (error) {
    return { permission: null, error: error as any };
  }
}

// Revoke permission from user
export async function revokePermission(permissionId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('id', permissionId);

    return { error };
  } catch (error) {
    return { error: error as any };
  }
}

// Revoke all permissions for user/resource combination
export async function revokeAllPermissions(
  userId: string,
  resourceType: string,
  resourceId?: string
) {
  try {
    let query = supabaseAdmin
      .from('permissions')
      .delete()
      .eq('user_id', userId)
      .eq('resource_type', resourceType);

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { error } = await query;
    return { error };
  } catch (error) {
    return { error: error as any };
  }
}

/**
 * Express middleware for permission checking
 */

// Middleware to check user role
export function requireRole(minimumRole: UserRole) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasRoleLevel(userRole, minimumRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: minimumRole,
        current: userRole 
      });
    }

    next();
  };
}

// Middleware to check specific permission
export function requirePermission(permission: string) {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        role: userRole 
      });
    }

    next();
  };
}

// Middleware to check resource ownership or admin access
export function requireOwnershipOrAdmin(resourceUserIdField = 'userId') {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role as UserRole;
    const userId = req.user?.id;
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!userRole || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin and master_admin can access any resource
    if (hasRoleLevel(userRole, 'admin')) {
      return next();
    }

    // Users can only access their own resources
    if (userId === resourceUserId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied - can only access own resources' 
    });
  };
}

/**
 * Utility functions for common permission patterns
 */

// Check if user can manage another user (based on role hierarchy)
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);

  // Master admin can manage anyone
  if (managerRole === 'master_admin') {
    return true;
  }

  // Admin can manage employee and client, but not other admins or master_admin
  if (managerRole === 'admin') {
    return targetRole === 'employee' || targetRole === 'client';
  }

  // Employee can only manage clients in some contexts
  if (managerRole === 'employee') {
    return targetRole === 'client';
  }

  return false;
}

// Get allowed actions for user on resource type
export function getAllowedActions(userRole: UserRole, resourceType: string): string[] {
  const actions = ['create', 'read', 'update', 'delete'];
  return actions.filter(action => {
    const permission = `${resourceType}.${action}`;
    return hasPermission(userRole, permission);
  });
}

// Check if user is resource owner
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string,
  ownerField = 'user_id'
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(resourceType as any)
      .select(ownerField)
      .eq('id', resourceId)
      .single();

    if (error || !data) {
      return false;
    }

    return data[ownerField] === userId;
  } catch (error) {
    console.error('Error checking resource ownership:', error);
    return false;
  }
}

export {
  type UserRole,
  PERMISSIONS_MATRIX,
  ROLE_HIERARCHY,
};