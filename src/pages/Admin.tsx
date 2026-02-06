import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Users, 
  UserPlus, 
  Bookmark, 
  Bell, 
  Shield, 
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Gift,
  X,
  Crown,
  Database,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nadacApi, FulSyncStatus } from "@/lib/nadac-api";

interface Stats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalSavedDrugs: number;
  totalAlertsSent: number;
  adminCount: number;
}

interface UserData {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  savedDrugsCount: number;
  lifetimeSavesCount: number;
  roles: string[];
  isAdmin: boolean;
  trialEndsAt: string | null;
  isProMember: boolean;
  subscriptionEnd: string | null;
}

interface UsersResponse {
  users: UserData[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const Admin = () => {
  const { user, session, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [processingTrialUserId, setProcessingTrialUserId] = useState<string | null>(null);
  
  // FUL data management state
  const [fulStatus, setFulStatus] = useState<FulSyncStatus | null>(null);
  const [isLoadingFulStatus, setIsLoadingFulStatus] = useState(true);
  const [isUploadingFul, setIsUploadingFul] = useState(false);
  const [isSyncingFul, setIsSyncingFul] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect non-admins (client-side UX guard - real protection is backend)
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.access_token) return;
      
      setIsLoadingStats(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-dashboard', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: null,
        });

        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to load statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isAdmin && session) {
      fetchStats();
    }
  }, [isAdmin, session]);

  // Fetch FUL sync status
  useEffect(() => {
    const fetchFulStatus = async () => {
      setIsLoadingFulStatus(true);
      try {
        const status = await nadacApi.getFulSyncStatus();
        setFulStatus(status);
      } catch (error) {
        console.error('Error fetching FUL status:', error);
      } finally {
        setIsLoadingFulStatus(false);
      }
    };

    if (isAdmin) {
      fetchFulStatus();
    }
  }, [isAdmin]);

  // Fetch users function
  const fetchUsers = async () => {
    if (!session?.access_token) return;
    
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        action: 'users',
        search,
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersResult = await response.json();
      setUsersData(usersResult);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch users on mount and when search/page changes
  useEffect(() => {
    if (isAdmin && session) {
      fetchUsers();
    }
  }, [isAdmin, session, search, page]);

  // Manual FUL sync trigger
  const handleManualFulSync = async () => {
    if (!session?.access_token) return;
    
    setIsSyncingFul(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-ful', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`FUL sync complete: ${data.totalRecords} records`);
        // Refresh status
        const status = await nadacApi.getFulSyncStatus();
        setFulStatus(status);
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (error) {
      console.error('FUL sync error:', error);
      toast.error(`FUL sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncingFul(false);
    }
  };

  // Handle FUL CSV file upload
  const handleFulFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.access_token) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploadingFul(true);
    try {
      const csvContent = await file.text();
      const result = await nadacApi.uploadFulCsv(csvContent, undefined, session.access_token);

      if (result.success) {
        toast.success(`FUL upload complete: ${result.totalRecords} records`);
        // Refresh status
        const status = await nadacApi.getFulSyncStatus();
        setFulStatus(status);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('FUL upload error:', error);
      toast.error(`FUL upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingFul(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTrialAction = async (userId: string, grant: boolean) => {
    if (!session?.access_token) return;
    
    setProcessingTrialUserId(userId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard?action=grant-trial`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId, grant }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update trial');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(grant ? 'Trial granted successfully' : 'Trial revoked');
        // Refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating trial:', error);
      toast.error('Failed to update trial');
    } finally {
      setProcessingTrialUserId(null);
    }
  };

  const isTrialActive = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt) > new Date();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers ?? "-", 
      icon: Users, 
      color: "text-primary" 
    },
    { 
      title: "New (7 days)", 
      value: stats?.newUsersLast7Days ?? "-", 
      icon: UserPlus, 
      color: "text-emerald-500" 
    },
    { 
      title: "New (30 days)", 
      value: stats?.newUsersLast30Days ?? "-", 
      icon: UserPlus, 
      color: "text-blue-500" 
    },
    { 
      title: "Total Saved Drugs", 
      value: stats?.totalSavedDrugs ?? "-", 
      icon: Bookmark, 
      color: "text-amber-500" 
    },
    { 
      title: "Alerts Sent", 
      value: stats?.totalAlertsSent ?? "-", 
      icon: Bell, 
      color: "text-purple-500" 
    },
    { 
      title: "Admins", 
      value: stats?.adminCount ?? "-", 
      icon: Shield, 
      color: "text-red-500" 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and view platform statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FUL Data Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>FUL Price Data</CardTitle>
                <CardDescription>Federal Upper Limit pricing data for Louisiana Medicaid reimbursement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingFulStatus ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {fulStatus?.status === 'active' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-emerald-600">Active</span>
                        </>
                      ) : fulStatus?.status === 'stale' ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-amber-600">Stale</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="font-medium text-destructive">Empty</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Records</p>
                    <p className="text-xl font-bold">{fulStatus?.recordCount?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Last Sync</p>
                    <p className="font-medium">
                      {fulStatus?.lastSync 
                        ? format(new Date(fulStatus.lastSync), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Source File Date</p>
                    <p className="font-medium">
                      {fulStatus?.sourceFileDate 
                        ? format(new Date(fulStatus.sourceFileDate), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleManualFulSync}
                    disabled={isSyncingFul}
                    className="flex items-center gap-2"
                  >
                    {isSyncingFul ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {isSyncingFul ? 'Syncing...' : 'Sync from CMS'}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv"
                      onChange={handleFulFileUpload}
                      className="hidden"
                      id="ful-csv-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFul}
                      className="flex items-center gap-2"
                    >
                      {isUploadingFul ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isUploadingFul ? 'Uploading...' : 'Upload CSV'}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Expected CSV format: ndc, ful_unit_price, package_size (optional), effective_date (optional). Max 5MB.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Users</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Sign In</TableHead>
                        <TableHead>Saved Drugs</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Pro Status</TableHead>
                        <TableHead>Trial Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell className="font-medium">
                            {userData.email}
                            {!userData.emailConfirmedAt && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Unverified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(userData.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {userData.lastSignInAt 
                              ? format(new Date(userData.lastSignInAt), 'MMM d, yyyy')
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>{userData.savedDrugsCount}</TableCell>
                          <TableCell>
                            {userData.isAdmin ? (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {userData.isProMember ? (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <Crown className="h-3 w-3 mr-1" />
                                Pro
                                {userData.subscriptionEnd && (
                                  <span className="ml-1 text-xs opacity-75">
                                    until {format(new Date(userData.subscriptionEnd), 'MMM d')}
                                  </span>
                                )}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isTrialActive(userData.trialEndsAt) ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Until {format(new Date(userData.trialEndsAt!), 'MMM d, yyyy')}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!userData.isAdmin && (
                              processingTrialUserId === userData.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isTrialActive(userData.trialEndsAt) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTrialAction(userData.id, false)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTrialAction(userData.id, true)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                >
                                  <Gift className="h-4 w-4 mr-1" />
                                  Grant Trial
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {usersData?.users?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, usersData.totalCount)} of {usersData.totalCount} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(usersData.totalPages, p + 1))}
                        disabled={page === usersData.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
