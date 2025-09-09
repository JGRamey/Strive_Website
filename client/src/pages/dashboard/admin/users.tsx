import { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Shield, 
  Users, 
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Mail
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'master_admin' | 'admin' | 'employee' | 'client';
  company?: string;
  job_title?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

export default function UserManagement() {
  const { state, userRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  const isMasterAdmin = userRole === 'master_admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(user => user.is_active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(user => !user.is_active);
      } else if (statusFilter === "verified") {
        filtered = filtered.filter(user => user.email_confirmed_at);
      } else if (statusFilter === "unverified") {
        filtered = filtered.filter(user => !user.email_confirmed_at);
      }
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!isMasterAdmin) {
      toast({
        title: "Permission denied",
        description: "Only Master Admin can change user roles",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      toast({
        title: "Role updated",
        description: "User role has been successfully updated",
      });

      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: isActive ? "User deactivated" : "User activated",
        description: `User has been ${isActive ? 'deactivated' : 'activated'} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchActivityLogs = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/activity`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      
      const data = await response.json();
      setActivityLogs(data);
    } catch (error: any) {
      toast({
        title: "Error fetching activity",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resendVerificationEmail = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to send verification email');

      toast({
        title: "Verification email sent",
        description: `Verification email has been sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      master_admin: { icon: Shield, color: 'bg-red-500', label: 'Master Admin' },
      admin: { icon: Shield, color: 'bg-orange-500', label: 'Admin' },
      employee: { icon: Briefcase, color: 'bg-blue-500', label: 'Employee' },
      client: { icon: Users, color: 'bg-green-500', label: 'Client' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.client;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Inactive</Badge>;
    }
    if (!user.email_confirmed_at) {
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Unverified</Badge>;
    }
    return <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
  };

  const exportUsers = () => {
    const csv = [
      ['ID', 'Email', 'Username', 'Full Name', 'Role', 'Company', 'Job Title', 'Status', 'Created At'],
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.username,
        user.full_name,
        user.role,
        user.company || '',
        user.job_title || '',
        user.is_active ? 'Active' : 'Inactive',
        format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.email_confirmed_at).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {users.filter(u => u.role === 'admin' || u.role === 'master_admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-gray-900 border-gray-800 mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchUsers}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={exportUsers}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Company</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Joined</TableHead>
                <TableHead className="text-gray-400">Last Sign In</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-400">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-800">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                          {user.username && (
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-white">{user.company || '-'}</div>
                        {user.job_title && (
                          <div className="text-gray-400 text-xs">{user.job_title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                          <DropdownMenuLabel className="text-gray-400">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          
                          {isMasterAdmin && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-gray-300 hover:text-white cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className="text-gray-300 hover:text-white cursor-pointer"
                          >
                            {user.is_active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          {!user.email_confirmed_at && (
                            <DropdownMenuItem
                              onClick={() => resendVerificationEmail(user.id, user.email)}
                              className="text-gray-300 hover:text-white cursor-pointer"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Verification
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              fetchActivityLogs(user.id);
                              setIsActivityDialogOpen(true);
                            }}
                            className="text-gray-300 hover:text-white cursor-pointer"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            View Activity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Change the role for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right text-gray-300">
                Role
              </Label>
              <Select
                value={selectedUser?.role}
                onValueChange={(value) => {
                  if (selectedUser) {
                    updateUserRole(selectedUser.id, value);
                    setIsEditDialogOpen(false);
                  }
                }}
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">User Activity</DialogTitle>
            <DialogDescription className="text-gray-400">
              Activity logs for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-gray-400">No activity logs found</p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-4 py-2">
                    <div className="text-sm text-white">{log.action}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}