You are building a comprehensive user dashboard and backend system for the Strive Tech website. The existing website uses React 18.3.1, TypeScript 5.6.3, Vite 5.4.19, Tailwind CSS 3.4.17, and shadcn/ui components with a dark theme and orange accent (#FF9966). 

CRITICAL: Maintain the EXACT same UI design patterns, color scheme (dark theme with orange accents), component styles, and visual consistency from the existing website. Use the existing shadcn/ui components and Tailwind configuration.

## PHASE 1: Supabase Setup & Migration

1. Initialize Supabase with the following schema:
   - Users table with role-based access control (Admin, Employee, Client)
   - Projects table for client project tracking
   - Beta_programs table for beta testing management
   - Content table for CMS functionality
   - Social_media_posts table for social media management
   - CRM_contacts table for customer relationship management
   - Permissions table for granular access control
   - Activity_logs table for audit trails

2. Migrate existing Drizzle ORM schemas to Supabase:
   - Convert existing user authentication from Passport.js to Supabase Auth
   - Maintain session management compatibility
   - Set up Row Level Security (RLS) policies for each table

3. Configure master admin account from environment variables:
   - Read MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD from .env
   - Create initial master admin user with full permissions
   - Set up permission assignment system for master admin

## PHASE 2: Authentication & Authorization System

Build a three-tier user system with the following hierarchy:
- **Master Admin**: Can assign any role and permission to any user
- **Admin**: Full access to CRM, CMS, analytics, and user management
- **Employee**: Limited access to CRM, content creation, project updates
- **Client**: Access to their projects, beta programs, and resources

Implement authentication flows:
- Sign up (default as Client role)
- Login with email/password
- Password reset functionality
- Email verification
- Session management with Supabase Auth

## PHASE 3: Client Dashboard

Create `/dashboard/client` with the following features:

1. **Project Progress Tracker**:
   - Visual progress bar showing project completion percentage
   - Milestone tracker with timeline view
   - Deliverables checklist
   - File uploads/downloads section
   - Project communication feed
   - Estimated completion dates

2. **Beta Testing Hub**:
   - Available beta programs the client can join
   - Active beta participations
   - Feedback submission forms
   - Beta feature documentation
   - Testing rewards/badges system

3. **Client Portal Features**:
   - Invoice history and payment status
   - Support ticket system
   - Resource library access
   - Meeting scheduler integration
   - Contract and document viewer
   - Analytics dashboard for their solutions

Use existing UI components from the codebase and maintain visual consistency.

## PHASE 4: Admin Dashboard

Create `/dashboard/admin` with comprehensive management tools:

1. **CMS Hub** (`/dashboard/admin/cms`):
   - Content editor for all website pages using existing page structures
   - Blog post creator/editor with rich text editing
   - Portfolio project management
   - Solutions page content updates
   - Resource library management
   - SEO metadata editor for each page
   - Media library with drag-and-drop upload

2. **CRM Hub** (`/dashboard/admin/crm`):
   - Client database with advanced filtering
   - Lead tracking and pipeline management
   - Communication history timeline
   - Task and reminder system
   - Email campaign management
   - Client segmentation tools
   - Revenue tracking and forecasting

3. **Social Media Manager**:
   - Multi-platform post scheduler (Twitter, LinkedIn, Facebook, Instagram)
   - Content calendar view
   - Post performance analytics
   - Hashtag and keyword tracking
   - Competitor analysis tools
   - AI-powered content suggestions

4. **Analytics Dashboard**:
   - Website traffic metrics
   - Conversion funnel analysis
   - Client engagement scores
   - Revenue reports
   - Project timeline analysis
   - Team performance metrics

## PHASE 5: Employee Dashboard

Create `/dashboard/employee` with focused tools:
- Limited CRM access (assigned clients only)
- Content creation tools
- Project update capabilities
- Task management system
- Team collaboration features
- Time tracking integration

## TECHNICAL REQUIREMENTS:

1. **Database Structure**: Use Supabase with proper relationships:
   - Implement foreign keys and indexes
   - Set up real-time subscriptions for live updates
   - Configure database triggers for activity logs
   - Optimize queries with proper indexing

2. **API Routes**: Create RESTful endpoints:
   - /api/auth/* for authentication
   - /api/users/* for user management
   - /api/projects/* for project operations
   - /api/cms/* for content management
   - /api/crm/* for CRM operations
   - /api/analytics/* for metrics

3. **State Management**: 
   - Use TanStack Query for server state (already in project)
   - Implement optimistic updates for better UX
   - Cache management for performance

4. **UI/UX Consistency**:
   - Use existing shadcn/ui components from /client/src/components/ui/
   - Maintain dark theme with orange accent (#FF9966)
   - Keep existing responsive breakpoints
   - Use existing loading skeletons and animations
   - Implement existing modal and dialog patterns

5. **Security**:
   - Row Level Security on all Supabase tables
   - Input validation with Zod (already in project)
   - XSS protection
   - Rate limiting on API endpoints
   - Audit logging for sensitive operations

6. **Vercel Deployment Configuration**:
   - Set up vercel.json with proper routing
   - Configure environment variables for production
   - Set up preview deployments for testing
   - Configure custom domain settings
   - Implement proper CORS settings

## FILE STRUCTURE TO CREATE:
client/src/
├── pages/
│   ├── dashboard/
│   │   ├── index.tsx (role-based redirect)
│   │   ├── client/
│   │   │   ├── index.tsx
│   │   │   ├── projects.tsx
│   │   │   ├── beta-testing.tsx
│   │   │   └── settings.tsx
│   │   ├── admin/
│   │   │   ├── index.tsx
│   │   │   ├── cms/
│   │   │   ├── crm/
│   │   │   ├── social/
│   │   │   └── analytics/
│   │   └── employee/
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
├── components/
│   ├── dashboard/
│   │   ├── ProjectTracker.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── CMSEditor.tsx
│   │   ├── CRMTable.tsx
│   │   └── SocialScheduler.tsx
├── lib/
│   ├── supabase.ts
│   └── permissions.ts
├── hooks/
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useProjects.ts
server/ (migrate to Supabase Edge Functions)
├── functions/
│   ├── auth/
│   ├── cms/
│   ├── crm/
│   └── analytics/

IMPORTANT: Start by checking if the master admin credentials are in the .env file. If not, prompt the user to add them before proceeding. Use the existing design system and component library throughout the entire implementation.
- Confirmed that credentials are in the .env file - (check supabase for confirmation that this user has been created)

