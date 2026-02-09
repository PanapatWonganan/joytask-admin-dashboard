'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { adminAchievementsApi } from '@/lib/api';
import { Achievement, AchievementStats, PaginatedResponse } from '@/types';
import { Trophy, Search, Loader2, ChevronLeft, ChevronRight, Eye, Trash2, Award, Lock, Unlock, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [unlockStatus, setUnlockStatus] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: 20,
      };
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (unlockStatus !== 'all') params.is_unlocked = unlockStatus === 'unlocked';

      const response = await adminAchievementsApi.list(params as Parameters<typeof adminAchievementsApi.list>[0]);
      const data = response.data as { success: boolean; data: Achievement[]; meta: PaginatedResponse<Achievement>['meta'] };
      setAchievements(data.data);
      setTotalPages(data.meta.last_page);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, unlockStatus]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminAchievementsApi.stats(30);
      const data = response.data as { success: boolean; data: AchievementStats };
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAchievements();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    try {
      await adminAchievementsApi.delete(id);
      fetchAchievements();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete achievement:', error);
    }
  };

  const getCategoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      tasks: 'bg-blue-100 text-blue-800',
      streak: 'bg-orange-100 text-orange-800',
      focus: 'bg-purple-100 text-purple-800',
      special: 'bg-yellow-100 text-yellow-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">View and manage all user achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total_achievements || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unlocked</CardTitle>
            <Unlock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.unlocked_achievements || 0}
            </div>
            <p className="text-xs text-muted-foreground">Achievements completed</p>
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
            <p className="text-xs text-muted-foreground">Total reward points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.users_with_achievements || 0}
            </div>
            <p className="text-xs text-muted-foreground">Users with achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Achievements */}
      {stats?.popular_achievements && stats.popular_achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Achievements</CardTitle>
            <CardDescription>Top achievements unlocked by users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {stats.popular_achievements.slice(0, 5).map((ach, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-2xl">{ach.icon_emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{ach.title}</p>
                    <p className="text-xs text-muted-foreground">{ach.unlock_count} unlocks</p>
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
          <CardTitle>Achievement Records</CardTitle>
          <CardDescription>Browse and filter achievement data</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="streak">Streak</SelectItem>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="special">Special</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unlockStatus} onValueChange={(v) => { setUnlockStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unlocked">Unlocked</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Achievement</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : achievements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No achievements found
                    </TableCell>
                  </TableRow>
                ) : (
                  achievements.map((ach) => (
                    <TableRow key={ach.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{ach.icon_emoji}</span>
                          <div>
                            <p className="font-medium">{ach.title}</p>
                            <p className="text-xs text-muted-foreground">{ach.achievement_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ach.user ? (
                          <div>
                            <p className="font-medium">{ach.user.name}</p>
                            <p className="text-xs text-muted-foreground">{ach.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadge(ach.category)}>
                          {ach.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${Math.min(100, (ach.current_progress / ach.required_progress) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{ach.current_progress}/{ach.required_progress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ach.is_unlocked ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Unlock className="h-3 w-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-yellow-600">{ach.reward_points}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedAchievement(ach); setDetailOpen(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => handleDelete(ach.id)}
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
              Showing {achievements.length} of {total} achievements
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
              <span className="text-3xl">{selectedAchievement?.icon_emoji}</span>
              {selectedAchievement?.title}
            </DialogTitle>
            <DialogDescription>{selectedAchievement?.description}</DialogDescription>
          </DialogHeader>
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Achievement ID</p>
                  <p className="font-medium">{selectedAchievement.achievement_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge className={getCategoryBadge(selectedAchievement.category)}>
                    {selectedAchievement.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-medium">{selectedAchievement.current_progress} / {selectedAchievement.required_progress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reward Points</p>
                  <p className="font-medium text-yellow-600">{selectedAchievement.reward_points}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedAchievement.is_unlocked ? (
                    <Badge className="bg-green-100 text-green-800">Unlocked</Badge>
                  ) : (
                    <Badge variant="secondary">Locked</Badge>
                  )}
                </div>
                {selectedAchievement.unlocked_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unlocked At</p>
                    <p className="font-medium">{format(new Date(selectedAchievement.unlocked_at), 'PPp')}</p>
                  </div>
                )}
              </div>
              {selectedAchievement.user && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">User</p>
                  <p className="font-medium">{selectedAchievement.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAchievement.user.email}</p>
                </div>
              )}
              {selectedAchievement.reward_costume_id && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Reward Costume</p>
                  <p className="font-medium">{selectedAchievement.reward_costume_id}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
