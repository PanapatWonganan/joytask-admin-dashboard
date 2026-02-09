"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, Settings2, Mail, Palette, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

interface SettingValue {
  value: string | boolean | number;
  type: string;
}

interface SettingsData {
  general?: Record<string, SettingValue>;
  email?: Record<string, SettingValue>;
  appearance?: Record<string, SettingValue>;
  features?: Record<string, SettingValue>;
}

export default function AppSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // General
    app_name: "",
    app_description: "",
    app_timezone: "Asia/Bangkok",
    date_format: "Y-m-d",
    time_format: "H:i:s",
    // Email
    mail_from_name: "",
    mail_from_address: "",
    // Appearance
    primary_color: "#3b82f6",
    default_theme: "system",
    // Features
    registration_enabled: true,
    google_login_enabled: true,
  });

  // Check if user is admin
  const isAdmin = user?.roles?.some(
    (role) => role.name === "admin" || role.name === "super-admin"
  );

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await settingsApi.getAll();
      const data = response.data.data as SettingsData;
      setSettings(data);

      // Populate form with fetched settings
      setFormData({
        app_name: (data.general?.app_name?.value as string) || "",
        app_description: (data.general?.app_description?.value as string) || "",
        app_timezone: (data.general?.app_timezone?.value as string) || "Asia/Bangkok",
        date_format: (data.general?.date_format?.value as string) || "Y-m-d",
        time_format: (data.general?.time_format?.value as string) || "H:i:s",
        mail_from_name: (data.email?.mail_from_name?.value as string) || "",
        mail_from_address: (data.email?.mail_from_address?.value as string) || "",
        primary_color: (data.appearance?.primary_color?.value as string) || "#3b82f6",
        default_theme: (data.appearance?.default_theme?.value as string) || "system",
        registration_enabled: data.features?.registration_enabled?.value as boolean ?? true,
        google_login_enabled: data.features?.google_login_enabled?.value as boolean ?? true,
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard/settings");
      return;
    }
    fetchSettings();
  }, [isAdmin, router, fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToUpdate = [
        // General
        { key: "app_name", value: formData.app_name, type: "string", group: "general" },
        { key: "app_description", value: formData.app_description, type: "string", group: "general" },
        { key: "app_timezone", value: formData.app_timezone, type: "string", group: "general" },
        { key: "date_format", value: formData.date_format, type: "string", group: "general" },
        { key: "time_format", value: formData.time_format, type: "string", group: "general" },
        // Email
        { key: "mail_from_name", value: formData.mail_from_name, type: "string", group: "email" },
        { key: "mail_from_address", value: formData.mail_from_address, type: "string", group: "email" },
        // Appearance
        { key: "primary_color", value: formData.primary_color, type: "string", group: "appearance" },
        { key: "default_theme", value: formData.default_theme, type: "string", group: "appearance" },
        // Features
        { key: "registration_enabled", value: formData.registration_enabled, type: "boolean", group: "features" },
        { key: "google_login_enabled", value: formData.google_login_enabled, type: "boolean", group: "features" },
      ];

      await settingsApi.update(settingsToUpdate);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground">
            Configure application settings (Admin only)
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Configure basic application settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app_name">Application Name</Label>
                <Input
                  id="app_name"
                  value={formData.app_name}
                  onChange={(e) =>
                    setFormData({ ...formData, app_name: e.target.value })
                  }
                  placeholder="Admin Dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_timezone">Timezone</Label>
                <Select
                  value={formData.app_timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, app_timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="app_description">Application Description</Label>
              <Input
                id="app_description"
                value={formData.app_description}
                onChange={(e) =>
                  setFormData({ ...formData, app_description: e.target.value })
                }
                placeholder="Admin Dashboard for managing users and settings"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={formData.date_format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, date_format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Y-m-d">2024-01-15</SelectItem>
                    <SelectItem value="d/m/Y">15/01/2024</SelectItem>
                    <SelectItem value="m/d/Y">01/15/2024</SelectItem>
                    <SelectItem value="d M Y">15 Jan 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_format">Time Format</Label>
                <Select
                  value={formData.time_format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, time_format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="H:i:s">24-hour (14:30:00)</SelectItem>
                    <SelectItem value="h:i:s A">12-hour (02:30:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email sender information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mail_from_name">From Name</Label>
                <Input
                  id="mail_from_name"
                  value={formData.mail_from_name}
                  onChange={(e) =>
                    setFormData({ ...formData, mail_from_name: e.target.value })
                  }
                  placeholder="Admin Dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail_from_address">From Email Address</Label>
                <Input
                  id="mail_from_address"
                  type="email"
                  value={formData.mail_from_address}
                  onChange={(e) =>
                    setFormData({ ...formData, mail_from_address: e.target.value })
                  }
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: SMTP configuration should be set in environment variables for security.
            </p>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Configure application appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_theme">Default Theme</Label>
                <Select
                  value={formData.default_theme}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5" />
              <CardTitle>Feature Flags</CardTitle>
            </div>
            <CardDescription>
              Enable or disable application features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="registration_enabled">User Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register accounts
                </p>
              </div>
              <Switch
                id="registration_enabled"
                checked={formData.registration_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, registration_enabled: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="google_login_enabled">Google Login</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to sign in with Google
                </p>
              </div>
              <Switch
                id="google_login_enabled"
                checked={formData.google_login_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, google_login_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
