# Backend & Dashboard Implementation - File Protection List

**Purpose**: This document lists all files created and modified during the backend and dashboard implementation to prevent accidental deletion during code review.

**� CRITICAL WARNING**: Do NOT delete, modify, or refactor any files marked with  **CRITICAL** without consulting the backend implementation team.

---

## = PROTECTED FILES INVENTORY

### **Backend Infrastructure Files**

####  **CRITICAL - Environment & Configuration**
- `scripts/check-env.ts` - Environment validation tool
- `.env.example` - Environment variables template  
- `vite.config.ts` - � **MODIFIED** - Added Supabase env var support

####  **CRITICAL - Database Schema & Security**
- `server/migrations/001_supabase_schema.sql` - Complete database schema (11 tables)
- `server/migrations/002_rls_policies.sql` - Row Level Security policies
- `server/utils/supabase-admin.ts` - Server-side admin utilities
- `server/utils/permissions.ts` - Role-based permission system

####  **CRITICAL - API Routes & Server**
- `server/routes-supabase.ts` - Modern Supabase-powered API endpoints
- `server/index.ts` - � **MODIFIED** - Dynamic route loading system
- `server/routes.ts` - = **LEGACY** - Fallback routes (keep as backup)

####  **CRITICAL - Scripts & Tools**
- `scripts/init-master-admin.ts` - Master admin account initialization
- `scripts/migrate-to-supabase.ts` - ⚠️ **MODIFIED** - Legacy data migration tool (ES module fixes)
- `server/middleware/security.ts` - ✅ **CRITICAL** - Security middleware (existing but essential)
- `shared/schema.ts` - ✅ **CRITICAL** - Shared database schema definitions

---

### **Frontend Authentication & Client Files**

####  **CRITICAL - Authentication System**
- `client/src/lib/supabase-client.ts` - Browser Supabase client
- `client/src/lib/supabase-auth.tsx` - Main authentication system
- `client/src/lib/auth.tsx` - � **MODIFIED** - Backward compatibility wrapper
- `client/src/lib/types/supabase.ts` - TypeScript database definitions

####  **CRITICAL - Authentication Pages**
- `client/src/pages/auth/login.tsx` - Login page
- `client/src/pages/auth/signup.tsx` - User registration
- `client/src/pages/auth/reset-password.tsx` - Password reset
- `client/src/pages/auth/verify-email.tsx` - Email verification

####  **CRITICAL - Hooks & Utilities**
- `client/src/hooks/use-toast.ts` - ✅ **CRITICAL** - Toast notification system (used by auth)
- `client/src/hooks/use-mobile.tsx` - ✅ **CRITICAL** - Mobile detection (used by navigation)

---

### **Dashboard System Files**

####  **CRITICAL - Dashboard Architecture**
- `client/src/pages/dashboard/index.tsx` - Smart role-based dashboard router
- `client/src/pages/dashboard/client/index.tsx` - Client dashboard (projects & beta programs)
- `client/src/pages/dashboard/admin/index.tsx` - Admin dashboard (system management)
- `client/src/pages/dashboard/employee/index.tsx` - Employee dashboard (assigned work)
- `client/src/pages/dashboard/admin/users.tsx` - User management interface

#### = **LEGACY - Can Be Removed After Full Migration**
- `client/src/pages/dashboard-legacy.tsx` - Original dashboard (replaced by role-based system)

---

### **Application Integration Files**

#### � **MODIFIED - Contains Critical Changes**
- `client/src/App.tsx` - Dashboard & auth routes integration
- `client/src/components/layout/navigation.tsx` - Authentication state integration
- `package.json` - ⚠️ **MODIFIED** - Added scripts and dependencies
- `package-lock.json` - ⚠️ **MODIFIED** - Dependency lockfile updates
- `.claude/settings.local.json` - ⚠️ **MODIFIED** - Claude Code configuration updates

---

## 🗑️ FILES SAFELY DELETED (During Session 2 Cleanup)

#### ✅ **SUCCESSFULLY REMOVED - Do Not Recreate**
- `client/src/lib/auth-old.tsx` - ❌ **DELETED** - Backup authentication file (no longer needed)
- `client/src/pages/login.tsx` - ❌ **DELETED** - Legacy login page (replaced by /auth/login)


---

## =� CRITICAL DEPENDENCIES

### **Backend Dependencies (DO NOT REMOVE)**
```json
{
  "@supabase/supabase-js": "^2.56.1",
  "@supabase/auth-helpers-react": "^0.5.0", 
  "@supabase/ssr": "^0.7.0",
  "express-rate-limit": "^8.1.0"
}
```

### **Frontend Dependencies (DO NOT REMOVE)**
```json
{
  "@tanstack/react-query": "^5.60.5",
  "@tanstack/react-table": "^8.21.3",
  "@tiptap/react": "^3.4.1",
  "@tiptap/starter-kit": "^3.4.1"
}
```

### **Package.json Scripts (DO NOT REMOVE)**
```json
{
  "env:check": "tsx scripts/check-env.ts",
  "supabase:init": "tsx scripts/init-master-admin.ts",
  "supabase:migrate": "tsx scripts/migrate-to-supabase.ts"
}
```

---

## =� WHAT NOT TO DO DURING CODE REVIEW

### **L DO NOT DELETE:**
- Any file marked with  **CRITICAL**
- Any file in `server/migrations/` directory
- Any file in `client/src/pages/dashboard/` directory
- Any file in `client/src/pages/auth/` directory
- Any script in `scripts/` directory
- Dependencies listed in the critical dependencies section

### **L DO NOT MODIFY WITHOUT CONSULTATION:**
- Authentication logic in `client/src/lib/`
- Permission system in `server/utils/permissions.ts`
- API routes in `server/routes-supabase.ts`
- Database schema files
- Environment configuration

### **L DO NOT REFACTOR:**
- Role hierarchy logic
- Database type definitions
- Authentication flow components
- Dashboard routing system

---

##  SAFE TO REVIEW/MODIFY

### **= Safe for Standard Code Review:**
- Code formatting and style improvements
- Comment additions for clarity  
- Performance optimizations that don't change logic
- Adding error handling improvements
- UI/UX enhancements that don't affect auth logic

### **>� Safe to Clean Up:**
- Unused imports (but verify they're truly unused)
- Console.log statements
- Commented-out code sections
- Duplicate utility functions
- `client/src/pages/dashboard-legacy.tsx` (after confirming new system works)

---

## =� VERIFICATION CHECKLIST

Before making ANY changes to protected files:

- [ ] Confirm the file is not marked as  **CRITICAL**
- [ ] Verify the change doesn't affect authentication flows
- [ ] Check that database operations still work
- [ ] Ensure dashboard routing remains functional
- [ ] Test that user roles and permissions work correctly
- [ ] Confirm API endpoints still respond properly

---

## <� EMERGENCY RESTORATION

If any protected file is accidentally deleted or broken:

### **File Restoration Sources:**
1. **Session Logs**: `/home/runner/workspace/chat_logs/website_updates/backend&dashboard/`
   - `session1.md` - Original implementation details
   - `session2-review-COMPLETED.md` - Latest review and fixes

2. **Git History**: Check git commits for file restoration

3. **Backup Strategy**: 
   - Legacy routes in `server/routes.ts` can serve as fallback
   - Original dashboard in `dashboard-legacy.tsx` preserved as backup

---

## =� SUPPORT CONTACTS

For questions about backend/dashboard files:
- **Backend Architecture**: Consult `server/utils/permissions.ts` comments
- **Database Schema**: Review `server/migrations/001_supabase_schema.sql` 
- **Authentication Flow**: Check `client/src/lib/supabase-auth.tsx` documentation
- **Dashboard Logic**: Review `client/src/pages/dashboard/index.tsx` routing

---

**Last Updated**: 2025-09-09  
**Implementation Status**:  Production Ready  
**Total Protected Files**: 29 files  
**Critical Dependencies**: 8 packages  

**� Remember: When in doubt, DON'T delete it!**


# Do not delete or edit any of the RadIX dependencies #