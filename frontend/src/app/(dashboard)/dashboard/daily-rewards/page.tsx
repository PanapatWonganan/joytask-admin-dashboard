'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminDailyLoginsApi } from '@/lib/api';
import { DailyLoginClaim, DailyLoginProgress, DailyLoginStats, PaginatedResponse } from '@/types';
import { Gift, Search, Loader2, ChevronLeft, ChevronRight, Trash2, Calendar, Flame, Trophy, Star, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyRewardsPage() {
  const [claims, setClaims] = useState<DailyLoginClaim[]>([]);
  const [progress, setProgress] = useState<DailyLoginProgress[]>([]);
  const [stats, setStats] = useState<DailyLoginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [progressPage, setProgressPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [progressTotalPages, setProgressTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [progressSearch, setProgressSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('all');

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: 20,
      };
      if (search) params.search = search;
      if (dayFilter !== 'all') params.day_in_cycle = parseInt(dayFilter);

      const response = await adminDailyLoginsApi.list(params as Parameters<typeof adminDailyLoginsApi.list>[0]);
      const data = response.data as { success: boolean; data: DailyLoginClaim[]; meta: PaginatedResponse<DailyLoginClaim>['meta'] };
      setClaims(data.data);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, dayFilter]);

  const fetchProgress = useCallback(async () => {
    try {
      setProgressLoading(true);
      const params: Record<string, unknown> = {
        page: progressPage,
        per_page: 20,
      };
      if (progressSearch) params.search = progressSearch;

      const response = await adminDailyLoginsApi.progress(params as Parameters<typeof adminDailyLoginsApi.progress>[0]);
      const data = response.data as { success: boolean; data: DailyLoginProgress[]; meta: PaginatedResponse<DailyLoginProgress>['meta'] };
      setProgress(data.data);
      setProgressTotalPages(data.meta.last_page);
      setProgressTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setProgressLoading(false);
    }
  }, [progressPage, progressSearch]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminDailyLoginsApi.stats(30);
      const data = response.data as { success: boolean; data: DailyLoginStats };
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchClaims = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchClaims();
  };

  const handleSearchProgress = (e: React.FormEvent) => {
    e.preventDefault();
    setProgressPage(1);
    fetchProgress();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this claim record?')) return;
    try {
      await adminDailyLoginsApi.delete(id);
      fetchClaims();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete claim:', error);
    }
  };

  const getDayBadge = (day: number) => {
    if (day === 7) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (day >= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const dailyPoints: Record<number, number> = {
    1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 40, 7: 100
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Login Rewards</h1>
        <p className="text-muted-foreground">View and manage daily login claims and user streaks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_claims || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.claimed_today || 0} claimed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Distributed</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_points_distributed?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recent_points_distributed?.toLocaleString() || 0} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jackpot Claims</CardTitle>
            <Trophy className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.jackpot_claims || 0}
            </div>
            <p className="text-xs text-muted-foreground">Day 7 rewards (100 pts)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Streak</CardTitle>
            <Flame className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.max_streak || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats?.avg_longest_streak || 0} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Day Distribution */}
      {stats?.day_distribution && Object.keys(stats.day_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Cycle Distribution</CardTitle>
            <CardDescription>Claims by day in the weekly cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className={`text-center p-4 rounded-lg ${day === 7 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-muted'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Day {day}</p>
                  <p className="text-2xl font-bold">{stats.day_distribution[day] || 0}</p>
                  <p className="text-xs text-muted-foreground">+{dailyPoints[day]} pts</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Streak Holders */}
      {stats?.top_streak_holders && stats.top_streak_holders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Streak Holders</CardTitle>
            <CardDescription>Users with the longest login streaks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_streak_holders.map((holder, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-white' :
                      idx === 1 ? 'bg-gray-400 text-white' :
                      idx === 2 ? 'bg-orange-600 text-white' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{holder.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{holder.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-red-600">
                      <Flame className="h-4 w-4" />
                      <span className="font-bold">{holder.longest_streak}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{holder.total_days_claimed} days claimed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Claims and Progress */}
      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims">Claims History</TabsTrigger>
          <TabsTrigger value="progress">User Progress</TabsTrigger>
        </TabsList>

        {/* Claims Tab */}
        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Daily Login Claims</CardTitle>
              <CardDescription>All reward claim records</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchClaims} className="flex flex-wrap gap-4 mb-6">
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
                <Select value={dayFilter} onValueChange={(v) => { setDayFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <SelectItem key={d} value={d.toString()}>Day {d} {d === 7 && '(Jackpot)'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">Search</Button>
              </form>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Claim Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Bonus</TableHead>
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
                    ) : claims.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No claims found
                        </TableCell>
                      </TableRow>
                    ) : (
                      claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell>
                            {claim.user ? (
                              <div>
                                <p className="font-medium">{claim.user.name}</p>
                                <p className="text-xs text-muted-foreground">{claim.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(claim.claim_date), 'PP')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDayBadge(claim.day_in_cycle)}>
                              Day {claim.day_in_cycle}
                              {claim.day_in_cycle === 7 && ' - Jackpot!'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-yellow-600">+{claim.points_earned}</span>
                          </TableCell>
                          <TableCell>
                            {claim.bonus_reward_given ? (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Gift className="h-3 w-3 mr-1" />
                                {claim.bonus_costume_id || 'Bonus'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => handleDelete(claim.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {claims.length} of {total} claims
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
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>User Progress</CardTitle>
              <CardDescription>Track user login streaks and weekly cycles</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchProgress} className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user..."
                      value={progressSearch}
                      onChange={(e) => setProgressSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Button type="submit">Search</Button>
              </form>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Day</TableHead>
                      <TableHead>Current Streak</TableHead>
                      <TableHead>Longest Streak</TableHead>
                      <TableHead>Total Days</TableHead>
                      <TableHead>Weeks Completed</TableHead>
                      <TableHead>Last Claim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : progress.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No progress records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      progress.map((prog) => (
                        <TableRow key={prog.id}>
                          <TableCell>
                            {prog.user ? (
                              <div>
                                <p className="font-medium">{prog.user.name}</p>
                                <p className="text-xs text-muted-foreground">{prog.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getDayBadge(prog.current_day_in_cycle)}>
                              Day {prog.current_day_in_cycle}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Flame className={`h-4 w-4 ${prog.current_streak > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
                              <span className="font-bold">{prog.current_streak}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-yellow-600" />
                              <span className="font-bold">{prog.longest_streak}</span>
                            </div>
                          </TableCell>
                          <TableCell>{prog.total_days_claimed}</TableCell>
                          <TableCell>{prog.weeks_completed}</TableCell>
                          <TableCell>
                            {prog.last_claim_date ? (
                              format(new Date(prog.last_claim_date), 'PP')
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {progress.length} of {progressTotal} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={progressPage === 1}
                    onClick={() => setProgressPage(progressPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {progressPage} of {progressTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={progressPage === progressTotalPages}
                    onClick={() => setProgressPage(progressPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
