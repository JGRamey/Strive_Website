import { useAuth, ProtectedRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Calendar, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
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
    <ProtectedRoute>
      <div className="pt-16">
        <section className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold">
                      {user?.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
                      Welcome back, {user?.username}!
                    </h1>
                    <p className="text-muted-foreground">
                      Manage your account and preferences
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="mt-4 md:mt-0"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Profile Card */}
                <Card className="lg:col-span-2" data-testid="card-user-profile">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Your account details and verification status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Username:</span>
                        <span data-testid="text-username">{user?.username}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span data-testid="text-email">{user?.email}</span>
                        <Badge 
                          variant={user?.emailVerified === "true" ? "default" : "secondary"}
                          className="ml-2"
                          data-testid="badge-email-verification"
                        >
                          {user?.emailVerified === "true" ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Unverified
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Member since:</span>
                        <span data-testid="text-member-since">
                          {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {user?.emailVerified !== "true" && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Email Verification Required
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Please check your email and click the verification link to activate your account.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card data-testid="card-quick-actions">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks and navigation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/solutions")}
                      data-testid="button-explore-solutions"
                    >
                      Explore Solutions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/contact")}
                      data-testid="button-contact-support"
                    >
                      Contact Support
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setLocation("/resources")}
                      data-testid="button-view-resources"
                    >
                      View Resources
                    </Button>
                    
                    <Separator />
                    
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start"
                      onClick={handleLogout}
                      data-testid="button-logout-sidebar"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {/* Account Stats */}
              <div className="mt-8">
                <Card data-testid="card-account-stats">
                  <CardHeader>
                    <CardTitle>Account Overview</CardTitle>
                    <CardDescription>
                      Your activity and account status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary" data-testid="text-account-status">
                          {user?.emailVerified === "true" ? "Active" : "Pending"}
                        </div>
                        <div className="text-sm text-muted-foreground">Account Status</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-security-score">
                          Good
                        </div>
                        <div className="text-sm text-muted-foreground">Security Score</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-plan">
                          Free
                        </div>
                        <div className="text-sm text-muted-foreground">Current Plan</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;