'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminFocusSessionsApi } from '@/lib/api';
import { FocusSession, FocusSessionStats, PaginatedResponse } from '@/types';
import { Timer, Search, Loader2, ChevronLeft, ChevronRight, Eye, Trash2, Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';

export default function FocusSessionsPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState<FocusSessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [completionStatus, setCompletionStatus] = useState('all');
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: 20,
      };
      if (search) params.search = search;
      if (completionStatus !== 'all') params.was_completed = completionStatus === 'completed';

      const response = await adminFocusSessionsApi.list(params as Parameters<typeof adminFocusSessionsApi.list>[0]);
      const data = response.data as { success: boolean; data: FocusSession[]; meta: PaginatedResponse<FocusSession>['meta'] };
      setSessions(data.data);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, completionStatus]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminFocusSessionsApi.stats(30);
      const data = response.data as { success: boolean; data: FocusSessionStats };
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSessions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this focus session?')) return;
    try {
      await adminFocusSessionsApi.delete(id);
      fetchSessions();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Focus Sessions</h1>
        <p className="text-muted-foreground">View and manage all user focus sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_sessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.completed_sessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completion_rate ? `${stats.completion_rate}% completion rate` : 'Sessions finished'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatDuration(stats?.total_minutes_completed || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed focus time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Duration Distribution */}
      {stats?.duration_distribution && (
        <Card>
          <CardHeader>
            <CardTitle>Session Duration Distribution</CardTitle>
            <CardDescription>Breakdown by session length</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(stats.duration_distribution).map(([range, count]) => (
                <div key={range} className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{range} min</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Users */}
      {stats?.top_users && stats.top_users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Focus Users</CardTitle>
            <CardDescription>Users with most focus time (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{user.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatDuration(user.total_minutes)}</p>
                    <p className="text-xs text-muted-foreground">{user.session_count} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Session Records</CardTitle>
          <CardDescription>Browse and filter focus session data</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={completionStatus} onValueChange={(v) => { setCompletionStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ended At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No focus sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {session.user ? (
                          <div>
                            <p className="font-medium">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground">{session.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{format(new Date(session.started_at), 'PP')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(session.started_at), 'p')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {formatDuration(session.duration_minutes)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.was_completed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Incomplete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {session.ended_at ? (
                          <span className="text-sm">{format(new Date(session.ended_at), 'Pp')}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedSession(session); setDetailOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {sessions.length} of {total} sessions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Focus Session Details
            </DialogTitle>
            <DialogDescription>Session ID: {selectedSession?.id}</DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Started At</p>
                  <p className="font-medium">{format(new Date(selectedSession.started_at), 'PPp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ended At</p>
                  <p className="font-medium">
                    {selectedSession.ended_at ? format(new Date(selectedSession.ended_at), 'PPp') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planned Duration</p>
                  <p className="font-medium">{formatDuration(selectedSession.duration_minutes)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedSession.was_completed ? (
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  ) : (
                    <Badge variant="secondary">Incomplete</Badge>
                  )}
                </div>
                {selectedSession.ended_at && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Actual Duration</p>
                    <p className="font-medium">
                      {formatDistanceStrict(new Date(selectedSession.started_at), new Date(selectedSession.ended_at))}
                    </p>
                  </div>
                )}
              </div>
              {selectedSession.task_uuid && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Associated Task</p>
                  <p className="font-mono text-sm">{selectedSession.task_uuid}</p>
                </div>
              )}
              {selectedSession.user && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">User</p>
                  <p className="font-medium">{selectedSession.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSession.user.email}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
