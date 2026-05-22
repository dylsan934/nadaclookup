import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Crown,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  MailX,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface Stats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalSavedDrugs: number;
  totalAlertsSent: number;
  adminCount: number;
  activeProCount: number;
  mrrCents: number;
  activeTrials: number;
  trialConversionRate: number;
}

interface UserData {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  lastActivityAt: string | null;
  emailConfirmedAt: string | null;
  savedDrugsCount: number;
  lifetimeSavesCount: number;
  alertsReceivedCount: number;
  notifyWeeklyMovers: boolean;
  notifySavedDrugs: boolean;
  roles: string[];
  isAdmin: boolean;
  trialEndsAt: string | null;
  isTrialActive: boolean;
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

type FilterKey = "all" | "pro" | "trial" | "free" | "unverified" | "admin";
type SortKey =
  | "createdAt"
  | "lastSignInAt"
  | "lastActivityAt"
  | "savedDrugsCount"
  | "lifetimeSavesCount"
  | "alertsReceivedCount";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pro", label: "Pro" },
  { key: "trial", label: "Trial" },
  { key: "free", label: "Free" },
  { key: "unverified", label: "Unverified" },
  { key: "admin", label: "Admin" },
];

const formatUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const Admin = () => {
  const { user, session, isAdmin, isLoading: authLoading, isRoleCheckComplete } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/");
      return;
    }
    if (isRoleCheckComplete && !isAdmin) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, isRoleCheckComplete, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.access_token) return;
      setIsLoadingStats(true);
      try {
        const { data, error } = await supabase.functions.invoke("admin-dashboard", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: null,
        });
        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load statistics");
      } finally {
        setIsLoadingStats(false);
      }
    };
    if (isAdmin && session) fetchStats();
  }, [isAdmin, session]);

  const fetchUsers = async () => {
    if (!session?.access_token) return;
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        action: "users",
        search,
        page: page.toString(),
        limit: "20",
        filter,
        sort,
        order,
      });
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-dashboard?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch users");
      const usersResult = await response.json();
      setUsersData(usersResult);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && session) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, session, search, page, filter, sort, order]);




  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sort !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  if (authLoading || !isRoleCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const userStatCards = [
    { title: "Total Users", value: stats?.totalUsers ?? "-", icon: Users, color: "text-primary" },
    { title: "New (7d)", value: stats?.newUsersLast7Days ?? "-", icon: UserPlus, color: "text-emerald-500" },
    { title: "New (30d)", value: stats?.newUsersLast30Days ?? "-", icon: UserPlus, color: "text-blue-500" },
    { title: "Saved Drugs", value: stats?.totalSavedDrugs ?? "-", icon: Bookmark, color: "text-amber-500" },
    { title: "Alerts Sent", value: stats?.totalAlertsSent ?? "-", icon: Bell, color: "text-purple-500" },
    { title: "Admins", value: stats?.adminCount ?? "-", icon: Shield, color: "text-red-500" },
  ];

  const revenueStatCards = [
    {
      title: "MRR",
      value: stats ? formatUSD(stats.mrrCents) : "-",
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Active Pro",
      value: stats?.activeProCount ?? "-",
      icon: Crown,
      color: "text-amber-600",
    },
    {
      title: "Active Trials",
      value: stats?.activeTrials ?? "-",
      icon: Sparkles,
      color: "text-blue-500",
    },
    {
      title: "Trial → Paid",
      value: stats ? `${stats.trialConversionRate}%` : "-",
      icon: TrendingUp,
      color: "text-purple-500",
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

        {/* Revenue */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Revenue
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {revenueStatCards.map((stat) => (
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
        </div>

        {/* Users / Engagement */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Users
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {userStatCards.map((stat) => (
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
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
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
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFilter(f.key);
                      setPage(1);
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
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
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("createdAt")}
                          >
                            Joined <SortIcon k="createdAt" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("lastSignInAt")}
                          >
                            Last Sign In <SortIcon k="lastSignInAt" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("lastActivityAt")}
                          >
                            Last Activity <SortIcon k="lastActivityAt" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("savedDrugsCount")}
                          >
                            Saved <SortIcon k="savedDrugsCount" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("lifetimeSavesCount")}
                          >
                            Lifetime <SortIcon k="lifetimeSavesCount" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort("alertsReceivedCount")}
                          >
                            Alerts <SortIcon k="alertsReceivedCount" />
                          </button>
                        </TableHead>
                        <TableHead>Notify</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Pro</TableHead>
                        <TableHead>Trial</TableHead>
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
                          <TableCell>{format(new Date(userData.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {userData.lastSignInAt
                              ? format(new Date(userData.lastSignInAt), "MMM d, yyyy")
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            {userData.lastActivityAt ? (
                              <span title={format(new Date(userData.lastActivityAt), "PPpp")}>
                                {formatDistanceToNow(new Date(userData.lastActivityAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>{userData.savedDrugsCount}</TableCell>
                          <TableCell>{userData.lifetimeSavesCount}</TableCell>
                          <TableCell>{userData.alertsReceivedCount}</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <span
                                title={`Weekly movers: ${userData.notifyWeeklyMovers ? "on" : "off"}`}
                              >
                                {userData.notifyWeeklyMovers ? (
                                  <Mail className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <MailX className="h-4 w-4 text-muted-foreground" />
                                )}
                              </span>
                              <span
                                title={`Saved drug alerts: ${userData.notifySavedDrugs ? "on" : "off"}`}
                              >
                                {userData.notifySavedDrugs ? (
                                  <Bell className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Bell className="h-4 w-4 text-muted-foreground opacity-40" />
                                )}
                              </span>
                            </div>
                          </TableCell>
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
                                    until {format(new Date(userData.subscriptionEnd), "MMM d")}
                                  </span>
                                )}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {userData.isTrialActive ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Until {format(new Date(userData.trialEndsAt!), "MMM d, yyyy")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!userData.isAdmin &&
                              (processingTrialUserId === userData.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : userData.isTrialActive ? (
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
                              ))}
                          </TableCell>
                        </TableRow>
                      ))}
                      {usersData?.users?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * 20 + 1} to{" "}
                      {Math.min(page * 20, usersData.totalCount)} of {usersData.totalCount} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(usersData.totalPages, p + 1))}
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
