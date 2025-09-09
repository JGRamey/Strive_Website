import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield, Users, Briefcase, User } from "lucide-react";

// Role-based dashboard redirect component
const DashboardRedirect = () => {
  const { userProfile, loading, isAuthenticated } = useSupabaseAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    if (userProfile?.role) {
      // Redirect based on user role
      switch (userProfile.role) {
        case 'master_admin':
          setLocation('/dashboard/admin'); // Master admins use admin dashboard with full access
          break;
        case 'admin':
          setLocation('/dashboard/admin');
          break;
        case 'employee':
          setLocation('/dashboard/employee');
          break;
        case 'client':
        default:
          setLocation('/dashboard/client');
          break;
      }
    }
  }, [userProfile, loading, isAuthenticated, setLocation]);

  // Loading state
  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role-based dashboard preview (shown briefly before redirect)
  const getRoleInfo = () => {
    switch (userProfile.role) {
      case 'master_admin':
        return {
          icon: Shield,
          title: 'Master Admin Dashboard',
          description: 'System administration and full platform control',
          color: 'text-red-600 dark:text-red-400'
        };
      case 'admin':
        return {
          icon: Users,
          title: 'Admin Dashboard', 
          description: 'User management, CMS, CRM, and analytics',
          color: 'text-blue-600 dark:text-blue-400'
        };
      case 'employee':
        return {
          icon: Briefcase,
          title: 'Employee Dashboard',
          description: 'Project management and content creation',
          color: 'text-green-600 dark:text-green-400'
        };
      case 'client':
      default:
        return {
          icon: User,
          title: 'Client Dashboard',
          description: 'Project tracking and beta program access',
          color: 'text-orange-600 dark:text-orange-400'
        };
    }
  };

  const roleInfo = getRoleInfo();
  const IconComponent = roleInfo.icon;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-md mx-auto">
        <CardContent className="flex flex-col items-center space-y-6">
          <div className={`p-4 rounded-full bg-muted ${roleInfo.color}`}>
            <IconComponent className="h-12 w-12" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{roleInfo.title}</h1>
            <p className="text-muted-foreground">{roleInfo.description}</p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to your dashboard...</span>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Welcome back, <span className="font-medium">{userProfile.first_name}!</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardRedirect;