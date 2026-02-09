"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Music,
  Volume2,
  VolumeX,
  Search,
  Filter,
  FileAudio,
  Crown,
  Loader2,
  CheckCircle2,
  Play,
  Square,
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
import { Label } from "@/components/ui/label";
import { soundsApi } from "@/lib/api";
import { Sound } from "@/types";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(ms: number): string {
  if (ms === 0) return "-";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const categoryLabels: Record<string, string> = {
  nature: "Nature",
  weather: "Weather",
  environment: "Environment",
  music: "Music",
  task: "Task",
  achievement: "Achievement",
  timer: "Timer",
  ui: "UI",
  mascot: "Mascot",
  wardrobe: "Wardrobe",
  notification: "Notification",
};

export default function SoundsPage() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingSound, setUploadingSound] = useState<Sound | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio preview
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchSounds = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { type?: string; category?: string } = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const response = await soundsApi.list(params);
      setSounds(response.data.data);
    } catch (error) {
      console.error("Failed to fetch sounds:", error);
      toast.error("Failed to load sounds");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, categoryFilter]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredSounds = sounds.filter((sound) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sound.key.toLowerCase().includes(query) ||
      sound.name.toLowerCase().includes(query) ||
      (sound.name_en && sound.name_en.toLowerCase().includes(query))
    );
  });

  const ambientCount = sounds.filter((s) => s.type === "ambient").length;
  const effectCount = sounds.filter((s) => s.type === "effect").length;
  const uploadedCount = sounds.filter((s) => s.file_size > 0).length;

  const handleUploadClick = (sound: Sound) => {
    setUploadingSound(sound);
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
        "audio/x-m4a",
      ];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        toast.error("Invalid file type. Please upload MP3, WAV, OGG, or M4A files.");
        return;
      }
      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 20MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadingSound || !selectedFile) return;

    setIsUploading(true);
    try {
      await soundsApi.upload(uploadingSound.key, selectedFile);
      toast.success(`Sound "${uploadingSound.name_en || uploadingSound.name}" uploaded successfully`);
      setIsUploadDialogOpen(false);
      setUploadingSound(null);
      setSelectedFile(null);
      fetchSounds();
    } catch (error: unknown) {
      console.error("Failed to upload sound:", error);
      const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = axiosError.response?.data?.message || "Failed to upload sound file";
      const fieldErrors = axiosError.response?.data?.errors;
      if (fieldErrors) {
        const details = Object.values(fieldErrors).flat().join(", ");
        toast.error(`${msg}: ${details}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPreview = (sound: Sound) => {
    if (!sound.download_url) {
      toast.error("No audio file uploaded yet");
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same sound, just stop
    if (playingKey === sound.key) {
      setPlayingKey(null);
      return;
    }

    const audio = new Audio(sound.download_url);
    audio.onended = () => setPlayingKey(null);
    audio.onerror = () => {
      setPlayingKey(null);
      toast.error("Failed to play audio");
    };
    audio.play();
    audioRef.current = audio;
    setPlayingKey(sound.key);
  };

  const availableCategories =
    typeFilter === "ambient"
      ? ["nature", "weather", "environment", "music"]
      : typeFilter === "effect"
        ? ["task", "achievement", "timer", "ui", "mascot", "wardrobe", "notification"]
        : Object.keys(categoryLabels);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sound Management</h1>
        <p className="text-muted-foreground">
          Manage ambient sounds and sound effects for the JoyTask app
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sounds</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sounds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambient</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effects</CardTitle>
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uploadedCount}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {sounds.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Sounds</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCategoryFilter("all"); }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="effect">Effect</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Sound</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSounds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No sounds found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSounds.map((sound, index) => (
                      <TableRow key={sound.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                              <FileAudio className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {sound.name_en || sound.name}
                                {sound.is_premium && (
                                  <Crown className="h-3.5 w-3.5 text-yellow-500" />
                                )}
                              </div>
                              {sound.name_en && (
                                <div className="text-xs text-muted-foreground">
                                  {sound.name}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground font-mono">
                                {sound.key}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sound.type === "ambient" ? "default" : "secondary"}>
                            {sound.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {categoryLabels[sound.category] || sound.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {sound.file_size > 0 ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {sound.format.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              No file
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(sound.file_size)}
                        </TableCell>
                        <TableCell>
                          {sound.download_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePlayPreview(sound)}
                            >
                              {playingKey === sound.key ? (
                                <Square className="h-3.5 w-3.5" />
                              ) : (
                                <Play className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadClick(sound)}
                          >
                            <Upload className="mr-1 h-3.5 w-3.5" />
                            {sound.file_size > 0 ? "Replace" : "Upload"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload Sound File
            </DialogTitle>
            <DialogDescription>
              Upload an audio file for &quot;{uploadingSound?.name_en || uploadingSound?.name}&quot; ({uploadingSound?.key})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sound-file">Audio File</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileAudio className="h-10 w-10 mx-auto text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, OGG, M4A (max 20MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="sound-file"
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploadingSound && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Key:</span>
                  <span className="font-mono">{uploadingSound.key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={uploadingSound.type === "ambient" ? "default" : "secondary"}>
                    {uploadingSound.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{categoryLabels[uploadingSound.category]}</span>
                </div>
                {uploadingSound.file_size > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Current file:</span>
                    <span>{formatFileSize(uploadingSound.file_size)} ({uploadingSound.format})</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
