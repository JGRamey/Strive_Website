import { SupabaseProtectedRoute, useSupabaseAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Mail, 
  BarChart3, 
  Settings,
  Shield,
  LogOut,
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Share2
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { userProfile, signOut, loading, isMasterAdmin } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, contactsRes, newslettersRes, projectsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/admin/contacts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/admin/newsletters', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);

      const [users, contacts, newsletters, projects] = await Promise.all([
        usersRes.ok ? usersRes.json() : { users: [] },
        contactsRes.ok ? contactsRes.json() : { contacts: [] },
        newslettersRes.ok ? newslettersRes.json() : { subscriptions: [] },
        projectsRes.ok ? projectsRes.json() : { projects: [] }
      ]);

      return {
        totalUsers: users.users?.length || 0,
        newContacts: contacts.contacts?.filter((c: any) => c.status === 'new')?.length || 0,
        totalContacts: contacts.contacts?.length || 0,
        newsletterSubscribers: newsletters.subscriptions?.length || 0,
        activeProjects: projects.projects?.filter((p: any) => p.status === 'in_progress')?.length || 0,
        totalProjects: projects.projects?.length || 0
      };
    },
    enabled: !!userProfile,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      stats: adminStats?.totalUsers || 0,
      action: () => console.log("Navigate to user management"),
      available: true
    },
    {
      title: "CRM Hub",
      description: "Customer relationship management",
      icon: MessageSquare,
      color: "text-green-600 dark:text-green-400", 
      bgColor: "bg-green-50 dark:bg-green-900/20",
      stats: adminStats?.totalContacts || 0,
      action: () => console.log("Navigate to CRM"),
      available: true
    },
    {
      title: "Content Management",
      description: "Manage website content and pages",
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      stats: "12 pages",
      action: () => console.log("Navigate to CMS"),
      available: true
    },
    {
      title: "Analytics Dashboard",
      description: "Business intelligence and reports",
      icon: BarChart3,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      stats: "Live",
      action: () => console.log("Navigate to analytics"),
      available: true
    },
    {
      title: "Social Media Manager",
      description: "Schedule and manage social posts",
      icon: Share2,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      stats: "Coming Soon",
      action: () => console.log("Navigate to social"),
      available: false
    },
    {
      title: "Newsletter Management",
      description: "Manage email campaigns and subscribers",
      icon: Mail,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      stats: adminStats?.newsletterSubscribers || 0,
      action: () => console.log("Navigate to newsletter"),
      available: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseProtectedRoute requiredRole="admin">
      <div className="pt-16">
        <section className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                      {userProfile?.first_name?.slice(0, 1)}{userProfile?.last_name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-3xl font-bold text-primary">
                        {isMasterAdmin ? 'Master Admin' : 'Admin'} Dashboard
                      </h1>
                      {isMasterAdmin && (
                        <Badge variant="destructive" className="ml-2">
                          <Shield className="w-3 h-3 mr-1" />
                          Master Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      Welcome back, {userProfile?.first_name}! Manage your platform from here.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    size="sm"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {statsLoading ? '-' : adminStats?.totalUsers}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">New Contacts</p>
                        <p className="text-2xl font-bold text-green-600">
                          {statsLoading ? '-' : adminStats?.newContacts}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-green-600/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {statsLoading ? '-' : adminStats?.activeProjects}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Newsletter Subs</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {statsLoading ? '-' : adminStats?.newsletterSubscribers}
                        </p>
                      </div>
                      <Mail className="h-8 w-8 text-purple-600/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest system activities and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">System backup completed</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user registration</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">High server load detected</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Administration Modules</CardTitle>
                  <CardDescription>
                    Access all platform management tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminModules.map((module, index) => {
                      const IconComponent = module.icon;
                      return (
                        <div
                          key={index}
                          className={`relative p-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary transition-colors cursor-pointer ${!module.available ? 'opacity-50' : ''}`}
                          onClick={module.available ? module.action : undefined}
                        >
                          <div className={`inline-flex p-3 rounded-lg ${module.bgColor} mb-4`}>
                            <IconComponent className={`h-6 w-6 ${module.color}`} />
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {module.stats}
                            </Badge>
                            {!module.available && (
                              <Badge variant="secondary" className="text-xs">
                                Coming Soon
                              </Badge>
                            )}
                          </div>

                          {module.available && (
                            <div className="absolute top-4 right-4">
                              <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>
      </div>
    </SupabaseProtectedRoute>
  );
};

export default AdminDashboard;