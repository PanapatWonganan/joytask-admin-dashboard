"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Heart,
  Smile,
  Frown,
  Meh,
  User,
  TrendingUp,
  Trash2,
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminMoodsApi } from "@/lib/api";
import { Mood, MoodStats } from "@/types";

const moodTypeLabels: Record<string, string> = {
  very_happy: "Very Happy",
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  very_sad: "Very Sad",
  anxious: "Anxious",
  calm: "Calm",
  angry: "Angry",
  excited: "Excited",
  tired: "Tired",
};

const moodTypeEmojis: Record<string, string> = {
  very_happy: "😄",
  happy: "🙂",
  neutral: "😐",
  sad: "😢",
  very_sad: "😭",
  anxious: "😰",
  calm: "😌",
  angry: "😠",
  excited: "🤩",
  tired: "😴",
};

const moodTypeColors: Record<string, string> = {
  very_happy: "bg-green-100 text-green-800 border-green-200",
  happy: "bg-emerald-100 text-emerald-800 border-emerald-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  sad: "bg-blue-100 text-blue-800 border-blue-200",
  very_sad: "bg-indigo-100 text-indigo-800 border-indigo-200",
  anxious: "bg-yellow-100 text-yellow-800 border-yellow-200",
  calm: "bg-teal-100 text-teal-800 border-teal-200",
  angry: "bg-red-100 text-red-800 border-red-200",
  excited: "bg-orange-100 text-orange-800 border-orange-200",
  tired: "bg-purple-100 text-purple-800 border-purple-200",
};

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-emerald-600";
  if (score >= 4) return "text-yellow-600";
  if (score >= 2) return "text-orange-600";
  return "text-red-600";
}

export default function MoodsPage() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [moodTypeFilter, setMoodTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog states
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 20,
      };
      if (moodTypeFilter !== "all") params.mood_type = moodTypeFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await adminMoodsApi.list(params);
      setMoods(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setTotalItems(response.data.meta.total);
    } catch (error) {
      console.error("Failed to fetch moods:", error);
      toast.error("Failed to load mood records");
    } finally {
      setIsLoading(false);
    }
  }, [moodTypeFilter, searchQuery, currentPage]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await adminMoodsApi.stats(30);
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleViewMood = (mood: Mood) => {
    setSelectedMood(mood);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteClick = (mood: Mood) => {
    setSelectedMood(mood);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMood) return;

    setIsDeleting(true);
    try {
      await adminMoodsApi.delete(selectedMood.id);
      toast.success("Mood record deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedMood(null);
      fetchMoods();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete mood:", error);
      toast.error("Failed to delete mood record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mood Analytics</h1>
        <p className="text-muted-foreground">
          View mood tracking data and wellness analytics across all users
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_moods ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className={`text-2xl font-bold ${getScoreColor(stats?.average_score ?? 0)}`}>
                {stats?.average_score ?? 0}/10
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <Smile className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats?.positive_moods ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative</CardTitle>
            <Frown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {stats?.negative_moods ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutral</CardTitle>
            <Meh className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-gray-600">
                {stats?.neutral_moods ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Mood Records</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes or users..."
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
                value={moodTypeFilter}
                onValueChange={(v) => {
                  setMoodTypeFilter(v);
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Mood Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {Object.entries(moodTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {moodTypeEmojis[key]} {label}
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
                      <TableHead>Mood</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Recorded At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moods.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No mood records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      moods.map((mood, index) => (
                        <TableRow key={mood.id}>
                          <TableCell className="text-muted-foreground">
                            {(currentPage - 1) * 20 + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {moodTypeEmojis[mood.mood_type]}
                              </span>
                              <Badge
                                variant="outline"
                                className={moodTypeColors[mood.mood_type]}
                              >
                                {moodTypeLabels[mood.mood_type]}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-lg font-semibold ${getScoreColor(mood.mood_score)}`}>
                              {mood.mood_score}/10
                            </span>
                          </TableCell>
                          <TableCell>
                            {mood.user ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">
                                    {mood.user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {mood.user.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {mood.note ? (
                              <span
                                className="text-sm line-clamp-1 max-w-[200px] cursor-pointer hover:underline"
                                onClick={() => handleViewMood(mood)}
                              >
                                {mood.note}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                No note
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDateTime(mood.recorded_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMood(mood)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(mood)}
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 20 + 1} to{" "}
                    {Math.min(currentPage * 20, totalItems)} of {totalItems} records
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

      {/* Mood Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mood Record Details</DialogTitle>
            <DialogDescription>
              View mood tracking information
            </DialogDescription>
          </DialogHeader>

          {selectedMood && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">
                  {moodTypeEmojis[selectedMood.mood_type]}
                </span>
                <div>
                  <Badge
                    variant="outline"
                    className={moodTypeColors[selectedMood.mood_type]}
                  >
                    {moodTypeLabels[selectedMood.mood_type]}
                  </Badge>
                  <p className={`text-2xl font-bold mt-1 ${getScoreColor(selectedMood.mood_score)}`}>
                    Score: {selectedMood.mood_score}/10
                  </p>
                </div>
              </div>

              {selectedMood.note && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Note</span>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedMood.note}
                  </p>
                </div>
              )}

              {selectedMood.user && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <span className="text-sm text-muted-foreground">User</span>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedMood.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMood.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Recorded At</span>
                  <p>{formatDateTime(selectedMood.recorded_at)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Created</span>
                  <p>{formatDateTime(selectedMood.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDetailDialogOpen(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mood Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mood record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
