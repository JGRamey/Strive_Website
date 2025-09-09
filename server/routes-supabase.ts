import { createServer, type Server } from "http";
import { z } from "zod";
import express from "express";
import { supabaseAdmin, createUser, getUserByEmail, logActivity, logFailedActivity } from "./utils/supabase-admin";
import { requireRole, requirePermission } from "./utils/permissions";
import { insertContactSubmissionSchema, insertNewsletterSubscriptionSchema } from "../shared/schema";

// Middleware to extract user from Supabase session
async function extractSupabaseUser(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...userProfile
    };

    next();
  } catch (error) {
    console.error('Error extracting user:', error);
    req.user = null;
    next();
  }
}

// Auth middleware that requires authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }
  next();
}

export async function registerRoutes(app: express.Application): Promise<Server> {
  
  // Apply user extraction middleware to all routes
  app.use(extractSupabaseUser);

  // ==========================================
  // PUBLIC ROUTES (No authentication required)
  // ==========================================

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      
      const { data, error } = await supabaseAdmin
        .from('contact_submissions')
        .insert({
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          email: validatedData.email,
          company: validatedData.company,
          phone: validatedData.phone,
          company_size: validatedData.companySize,
          message: validatedData.message,
          privacy_consent: validatedData.privacyConsent === 'true',
        })
        .select()
        .single();

      if (error) {
        console.error('Contact submission error:', error);
        throw error;
      }

      // Log activity
      if (req.user) {
        await logActivity(
          req.user.id,
          'contact_submitted',
          'contact_submissions',
          data.id,
          { email: validatedData.email },
          req.ip,
          req.get('User-Agent')
        );
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your message. We'll get back to you within one business day."
      });
    } catch (error) {
      console.error('Contact form error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid form data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to submit contact form" 
        });
      }
    }
  });

  // Newsletter subscription
  app.post("/api/newsletter", async (req, res) => {
    try {
      const validatedData = insertNewsletterSubscriptionSchema.parse(req.body);
      
      // Try to insert, handle unique constraint violation gracefully
      const { data, error } = await supabaseAdmin
        .from('newsletter_subscriptions')
        .insert({
          email: validatedData.email,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          res.status(409).json({ 
            success: false, 
            message: "Email is already subscribed to our newsletter." 
          });
          return;
        }
        throw error;
      }

      // Log activity
      if (req.user) {
        await logActivity(
          req.user.id,
          'newsletter_subscribed',
          'newsletter_subscriptions',
          data.id,
          { email: validatedData.email },
          req.ip,
          req.get('User-Agent')
        );
      }
      
      res.json({ 
        success: true, 
        message: "Successfully subscribed to newsletter!" 
      });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid email address", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to subscribe to newsletter" 
        });
      }
    }
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // User signup (creates account in Supabase Auth + our database)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      if (!username || !email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: "All fields are required"
        });
        return;
      }

      // Check if username already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "Username already exists"
        });
        return;
      }

      // Create user with admin SDK
      const { user: newUser, error } = await createUser({
        email,
        password,
        username,
        first_name: firstName,
        last_name: lastName,
        role: 'client' // Default role for new signups
      });

      if (error) {
        console.error('User creation error:', error);
        res.status(400).json({
          success: false,
          message: error.message || "Failed to create account"
        });
        return;
      }

      // Log activity
      await logActivity(
        newUser.id,
        'user_registered',
        'users',
        newUser.id,
        { registration_method: 'email_password' },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: "Account created successfully! You can now log in.",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          emailVerified: newUser.email_verified ? "true" : "false"
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      await logFailedActivity(
        null,
        'user_registration_failed',
        error.message,
        'users',
        undefined,
        { email: req.body.email },
        req.ip,
        req.get('User-Agent')
      );

      res.status(500).json({
        success: false,
        message: "Failed to create account"
      });
    }
  });

  // User login (returns JWT token compatible with existing frontend)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "Username/email and password are required"
        });
        return;
      }

      // Determine if username is email or actual username
      let email = username;
      if (!username.includes('@')) {
        // Look up email by username
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('username', username)
          .single();

        if (!user) {
          res.status(401).json({
            success: false,
            message: "Invalid credentials"
          });
          return;
        }
        email = user.email;
      }

      // Authenticate with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user || !data.session) {
        await logFailedActivity(
          null,
          'login_failed',
          'Invalid credentials',
          'users',
          undefined,
          { attempted_username: username },
          req.ip,
          req.get('User-Agent')
        );

        res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
        return;
      }

      // Get user profile
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!userProfile) {
        res.status(401).json({
          success: false,
          message: "User profile not found"
        });
        return;
      }

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Log activity
      await logActivity(
        data.user.id,
        'user_logged_in',
        'users',
        data.user.id,
        { login_method: 'email_password' },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          emailVerified: userProfile.email_verified ? "true" : "false",
          createdAt: userProfile.created_at
        },
        token: data.session.access_token // JWT token for frontend
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to login"
      });
    }
  });

  // Get current user (protected route)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = req.user;

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.email_verified ? "true" : "false",
          createdAt: user.created_at,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get user information"
      });
    }
  });

  // Logout user
  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      // Supabase JWT tokens are stateless, so we just acknowledge logout
      // The frontend should clear the token from storage
      
      // Log activity
      await logActivity(
        req.user.id,
        'user_logged_out',
        'users',
        req.user.id,
        {},
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to logout"
      });
    }
  });

  // ==========================================
  // PROTECTED ROUTES (Authentication required)
  // ==========================================

  // Get user projects (clients can see their own, admins can see all)
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      let query = supabaseAdmin.from('projects').select(`
        *,
        client:users!projects_client_id_fkey(id, username, first_name, last_name, email),
        created_by_user:users!projects_created_by_fkey(id, username, first_name, last_name)
      `);

      // Filter based on user role
      if (req.user.role === 'client') {
        query = query.eq('client_id', req.user.id);
      } else if (req.user.role === 'employee') {
        query = query.contains('assigned_team_members', [req.user.id]);
      }
      // Admins and master_admins can see all projects (no filter)

      const { data: projects, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        projects: projects || []
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get projects"
      });
    }
  });

  // Get beta programs (public programs for all users)
  app.get("/api/beta-programs", requireAuth, async (req, res) => {
    try {
      const { data: programs, error } = await supabaseAdmin
        .from('beta_programs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        programs: programs || []
      });
    } catch (error) {
      console.error('Get beta programs error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get beta programs"
      });
    }
  });

  // ==========================================
  // ADMIN ROUTES (Admin/Master Admin only)
  // ==========================================

  // Get all contact submissions (admin only)
  app.get("/api/admin/contacts", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { data: contacts, error } = await supabaseAdmin
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        contacts: contacts || []
      });
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get contact submissions"
      });
    }
  });

  // Get all newsletter subscriptions (admin only)
  app.get("/api/admin/newsletters", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { data: subscriptions, error } = await supabaseAdmin
        .from('newsletter_subscriptions')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        subscriptions: subscriptions || []
      });
    } catch (error) {
      console.error('Get newsletter subscriptions error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get newsletter subscriptions"
      });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, username, email, first_name, last_name, role, email_verified, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        users: users || []
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get users"
      });
    }
  });

  // User management endpoints (admin only)
  
  // Get all users (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user is admin or master_admin
      if (user.role !== 'admin' && user.role !== 'master_admin') {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required."
        });
        return;
      }

      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map users to include is_active flag
      const mappedUsers = users.map(u => ({
        ...u,
        is_active: u.is_active !== false, // Default to true if not set
      }));

      res.json(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  });

  // Update user role (master admin only)
  app.put("/api/users/:userId/role", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const { role } = req.body;
      
      // Only master admin can change roles
      if (user.role !== 'master_admin') {
        res.status(403).json({
          success: false,
          message: "Access denied. Only Master Admin can change user roles."
        });
        return;
      }

      // Validate role
      const validRoles = ['master_admin', 'admin', 'employee', 'client'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role specified"
        });
        return;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      // Log the activity
      await logActivity(
        user.id,
        'role_updated',
        'users',
        userId,
        { new_role: role },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: "User role updated successfully"
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update user role"
      });
    }
  });

  // Update user status (admin only)
  app.put("/api/users/:userId/status", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      const { is_active } = req.body;
      
      // Check if user is admin or master_admin
      if (user.role !== 'admin' && user.role !== 'master_admin') {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required."
        });
        return;
      }

      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active })
        .eq('id', userId);

      if (error) throw error;

      // Log the activity
      await logActivity(
        user.id,
        is_active ? 'user_activated' : 'user_deactivated',
        'users',
        userId,
        { is_active },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update user status"
      });
    }
  });

  // Get user activity logs (admin only)
  app.get("/api/users/:userId/activity", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      
      // Check if user is admin or master_admin
      if (user.role !== 'admin' && user.role !== 'master_admin') {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required."
        });
        return;
      }

      const { data: activities, error } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      res.json(activities || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user activity"
      });
    }
  });

  // Resend verification email (admin only)
  app.post("/api/users/:userId/resend-verification", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { userId } = req.params;
      
      // Check if user is admin or master_admin
      if (user.role !== 'admin' && user.role !== 'master_admin') {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required."
        });
        return;
      }

      // Get user email
      const { data: targetUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }

      // Resend verification email using Supabase Auth Admin
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: targetUser.email,
      });

      if (error) throw error;

      res.json({
        success: true,
        message: "Verification email sent successfully"
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      res.status(500).json({
        success: false,
        message: "Failed to send verification email"
      });
    }
  });

  // Password reset endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required"
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/auth/verify-email`,
      });

      if (error) throw error;

      res.json({
        success: true,
        message: "Password reset email sent successfully"
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({
        success: false,
        message: "Failed to send password reset email"
      });
    }
  });

  // Email verification endpoint
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Verification token is required"
        });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) throw error;

      res.json({
        success: true,
        message: "Email verified successfully"
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({
        success: false,
        message: "Failed to verify email"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      supabase: !!supabaseAdmin
    });
  });

  const server = createServer(app as any);
  return server;
}

export default registerRoutes;