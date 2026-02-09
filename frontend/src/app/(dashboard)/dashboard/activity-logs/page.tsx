"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Activity,
  User,
  Users,
  Clock,
  Globe,
  Monitor,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import { adminActivityLogsApi } from "@/lib/api";
import { ActivityLog, ActivityLogStats } from "@/types";

const actionLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  create_task: "Create Task",
  complete_task: "Complete Task",
  record_mood: "Record Mood",
  start_focus: "Start Focus",
  end_focus: "End Focus",
  claim_reward: "Claim Reward",
  update_profile: "Update Profile",
  register: "Register",
};

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-800 border-green-200",
  logout: "bg-gray-100 text-gray-800 border-gray-200",
  create_task: "bg-blue-100 text-blue-800 border-blue-200",
  complete_task: "bg-emerald-100 text-emerald-800 border-emerald-200",
  record_mood: "bg-pink-100 text-pink-800 border-pink-200",
  start_focus: "bg-yellow-100 text-yellow-800 border-yellow-200",
  end_focus: "bg-orange-100 text-orange-800 border-orange-200",
  claim_reward: "bg-purple-100 text-purple-800 border-purple-200",
  update_profile: "bg-indigo-100 text-indigo-800 border-indigo-200",
  register: "bg-teal-100 text-teal-800 border-teal-200",
};

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatActionLabel(action: string): string {
  return actionLabels[action] || action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActionColor(action: string): string {
  return actionColors[action] || "bg-gray-100 text-gray-800 border-gray-200";
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [stats, setStats] = useState<ActivityLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog state
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 20,
      };
      if (actionFilter !== "all") params.action = actionFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await adminActivityLogsApi.list(params);
      setLogs(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setTotalItems(response.data.meta.total);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, searchQuery, currentPage]);

  const fetchActions = useCallback(async () => {
    try {
      const response = await adminActivityLogsApi.actions();
      setActions(response.data.data);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await adminActivityLogsApi.stats(30);
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchActions();
    fetchStats();
  }, [fetchActions, fetchStats]);

  const handleViewLog = (log: ActivityLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          Monitor user activity and actions across the JoyTask app
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_logs ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent (30d)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.recent_logs ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.active_users ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {Object.keys(stats?.action_distribution ?? {}).length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user or IP..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={actionFilter}
                onValueChange={(v) => {
                  setActionFilter(v);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatActionLabel(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No activity logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {(currentPage - 1) * 20 + index + 1}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getActionColor(log.action)}
                            >
                              {formatActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">
                                    {log.user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {log.user.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.ip_address ? (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-mono">
                                  {log.ip_address}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.details ? (
                              <span
                                className="text-sm line-clamp-1 max-w-[150px] cursor-pointer hover:underline text-muted-foreground"
                                onClick={() => handleViewLog(log)}
                              >
                                {JSON.stringify(log.details).slice(0, 40)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDateTime(log.created_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLog(log)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 20 + 1} to{" "}
                    {Math.min(currentPage * 20, totalItems)} of {totalItems} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Log Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>
              View activity log information and details
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`text-base px-3 py-1 ${getActionColor(selectedLog.action)}`}
                >
                  {formatActionLabel(selectedLog.action)}
                </Badge>
              </div>

              {selectedLog.user && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <span className="text-sm text-muted-foreground">User</span>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedLog.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedLog.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Details</span>
                  <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">IP Address</span>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-mono">
                      {selectedLog.ip_address || "-"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Timestamp</span>
                  <p>{formatDateTime(selectedLog.created_at)}</p>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">User Agent</span>
                  <div className="flex items-start gap-2">
                    <Monitor className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
