import { SupabaseProtectedRoute, useSupabaseAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Users, 
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  Edit,
  UserCheck,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const EmployeeDashboard = () => {
  const { userProfile, signOut, loading } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch assigned projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['employee-projects', userProfile?.id],
    queryFn: async () => {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data.projects || [];
    },
    enabled: !!userProfile,
  });

  // Fetch assigned CRM contacts (when CRM is implemented)
  const { data: assignedContacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['employee-contacts', userProfile?.id],
    queryFn: async () => {
      // This will be implemented when CRM module is ready
      return [];
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'planning': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const employeeModules = [
    {
      title: "Project Management",
      description: "Update assigned projects and track progress",
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      stats: `${projects.length} assigned`,
      action: () => console.log("Navigate to project management"),
      available: true
    },
    {
      title: "Content Creation",
      description: "Create and edit website content",
      icon: FileText,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      stats: "CMS Access",
      action: () => console.log("Navigate to content creation"),
      available: true
    },
    {
      title: "CRM Tasks",
      description: "Manage assigned client contacts",
      icon: UserCheck,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      stats: "Coming Soon",
      action: () => console.log("Navigate to CRM"),
      available: false
    },
    {
      title: "Task Management", 
      description: "View and manage your daily tasks",
      icon: CheckCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      stats: "Coming Soon",
      action: () => console.log("Navigate to tasks"),
      available: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading employee dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseProtectedRoute requiredRole="employee">
      <div className="pt-16">
        <section className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {userProfile?.first_name?.slice(0, 1)}{userProfile?.last_name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-3xl font-bold text-primary">
                        Employee Dashboard
                      </h1>
                      <Badge variant="secondary">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Employee
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Welcome back, {userProfile?.first_name}! Manage your assigned work here.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assigned Projects</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {projects.length}
                        </p>
                      </div>
                      <Briefcase className="h-8 w-8 text-blue-600/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                        <p className="text-2xl font-bold text-green-600">
                          {projects.filter(p => p.status === 'in_progress').length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed This Week</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {projects.filter(p => p.status === 'completed').length}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* Assigned Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Assigned Projects
                    </CardTitle>
                    <CardDescription>
                      Projects you're currently working on
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No projects assigned</p>
                        <p className="text-sm">New projects will appear here when assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.slice(0, 3).map((project) => (
                          <div key={project.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium">{project.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Client: {project.client?.first_name} {project.client?.last_name}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status.replace('_', ' ')}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{project.progress_percentage}%</span>
                              </div>
                              <Progress value={project.progress_percentage} className="h-2" />
                            </div>

                            {project.estimated_completion_date && (
                              <div className="flex items-center mt-3 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Due: {formatDate(project.estimated_completion_date)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {projects.length > 3 && (
                          <Button variant="outline" className="w-full">
                            <Briefcase className="mr-2 h-4 w-4" />
                            View All Projects ({projects.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Your latest work and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Edit className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Updated project milestone</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Completed design review</p>
                          <p className="text-xs text-muted-foreground">Yesterday</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Created content draft</p>
                          <p className="text-xs text-muted-foreground">2 days ago</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <Users className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Team meeting scheduled</p>
                          <p className="text-xs text-muted-foreground">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Employee Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Modules</CardTitle>
                  <CardDescription>
                    Access your work tools and assigned responsibilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {employeeModules.map((module, index) => {
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

export default EmployeeDashboard;