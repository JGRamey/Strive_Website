import { SupabaseProtectedRoute, useSupabaseAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  FolderOpen,
  TestTube2,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const ClientDashboard = () => {
  const { userProfile, signOut, loading } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user's projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', userProfile?.id],
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

  // Fetch available beta programs
  const { data: betaPrograms = [], isLoading: betaLoading } = useQuery({
    queryKey: ['beta-programs'],
    queryFn: async () => {
      const response = await fetch('/api/beta-programs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch beta programs');
      const data = await response.json();
      return data.programs || [];
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseProtectedRoute requiredRole="client">
      <div className="pt-16">
        <section className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold">
                      {userProfile?.first_name?.slice(0, 1)}{userProfile?.last_name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-primary">
                      Welcome back, {userProfile?.first_name}!
                    </h1>
                    <p className="text-muted-foreground">
                      Client Dashboard - Track your projects and explore beta programs
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="mt-4 md:mt-0"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold text-primary">
                          {projects.filter(p => p.status === 'in_progress' || p.status === 'review').length}
                        </p>
                      </div>
                      <FolderOpen className="h-8 w-8 text-primary/60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                        <p className="text-2xl font-bold text-green-600">
                          {projects.filter(p => p.status === 'completed').length}
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
                        <p className="text-sm font-medium text-muted-foreground">Beta Programs</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {betaPrograms.length}
                        </p>
                      </div>
                      <TestTube2 className="h-8 w-8 text-blue-600/60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Active Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="mr-2 h-5 w-5" />
                      Your Projects
                    </CardTitle>
                    <CardDescription>
                      Track progress on your current projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No projects yet</p>
                        <p className="text-sm">Projects will appear here when assigned to you</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.slice(0, 3).map((project) => (
                          <div key={project.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium">{project.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {project.description || 'No description available'}
                                </p>
                              </div>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace('_', ' ')}
                              </Badge>
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
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View All Projects ({projects.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Beta Programs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TestTube2 className="mr-2 h-5 w-5" />
                      Beta Programs
                    </CardTitle>
                    <CardDescription>
                      Join exclusive beta testing programs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {betaLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : betaPrograms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TestTube2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>No beta programs available</p>
                        <p className="text-sm">Check back later for new opportunities</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {betaPrograms.slice(0, 2).map((program) => (
                          <div key={program.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium">{program.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {program.description || 'No description available'}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                Active
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <User className="h-4 w-4 mr-1" />
                                <span>{program.current_participants}/{program.max_participants || '∞'} participants</span>
                              </div>
                              <Button variant="outline" size="sm">
                                Learn More
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {betaPrograms.length > 2 && (
                          <Button variant="outline" className="w-full">
                            <TestTube2 className="mr-2 h-4 w-4" />
                            View All Programs ({betaPrograms.length})
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Quick Actions */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and navigation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setLocation("/solutions")}
                    >
                      <FileText className="h-6 w-6" />
                      <span>Explore Solutions</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setLocation("/contact")}
                    >
                      <MessageSquare className="h-6 w-6" />
                      <span>Contact Support</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => setLocation("/resources")}
                    >
                      <FileText className="h-6 w-6" />
                      <span>View Resources</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                    >
                      <Clock className="h-6 w-6" />
                      <span>Schedule Meeting</span>
                    </Button>
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

export default ClientDashboard;