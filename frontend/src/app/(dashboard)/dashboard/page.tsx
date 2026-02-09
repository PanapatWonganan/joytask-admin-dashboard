"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardStats } from "@/types";
import { dashboardApi } from "@/lib/api";
import { toast } from "sonner";

// Mock data for the charts
const userGrowthData = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 150 },
  { month: "Mar", users: 180 },
  { month: "Apr", users: 220 },
  { month: "May", users: 280 },
  { month: "Jun", users: 350 },
  { month: "Jul", users: 420 },
];

const activityData = [
  { day: "Mon", active: 45, new: 12 },
  { day: "Tue", active: 52, new: 18 },
  { day: "Wed", active: 49, new: 15 },
  { day: "Thu", active: 63, new: 22 },
  { day: "Fri", active: 58, new: 19 },
  { day: "Sat", active: 35, new: 8 },
  { day: "Sun", active: 28, new: 5 },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "#8b5cf6",
  manager: "#3b82f6",
  user: "#22c55e",
  guest: "#f59e0b",
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && (
            <span
              className={`inline-flex items-center mr-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 mr-0.5 ${
                  !trend.isPositive ? "rotate-180" : ""
                }`}
              />
              {trend.value}%
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

interface RoleDistribution {
  name: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await dashboardApi.stats();
        const data = response.data.data;

        // Map new API structure to existing state structure
        setStats({
          total_users: data.users?.total ?? 0,
          active_users: data.users?.active ?? 0,
          inactive_users: data.users?.inactive ?? 0,
          new_users_today: data.users?.new_today ?? 0,
          new_users_this_week: data.users?.new_this_week ?? 0,
          new_users_this_month: data.users?.new_this_month ?? 0,
        });

        // Transform users.by_role to role distribution data
        if (data.users?.by_role) {
          const distribution = data.users.by_role.map((item: { role: string; count: number }) => ({
            name: item.role.charAt(0).toUpperCase() + item.role.slice(1),
            value: item.count,
            color: ROLE_COLORS[item.role] || "#94a3b8",
          }));
          setRoleDistribution(distribution);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          description="from last month"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users ?? 0}
          description="currently active"
          icon={<UserCheck className="h-4 w-4" />}
          trend={{ value: 8, isPositive: true }}
          isLoading={isLoading}
        />
        <StatCard
          title="Inactive Users"
          value={stats?.inactive_users ?? 0}
          description="need attention"
          icon={<UserX className="h-4 w-4" />}
          trend={{ value: 3, isPositive: false }}
          isLoading={isLoading}
        />
        <StatCard
          title="New Today"
          value={stats?.new_users_today ?? 0}
          description="new registrations"
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: 15, isPositive: true }}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* User Growth Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Monthly user registration trends over the past 7 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>User breakdown by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>
            Daily active users and new registrations this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="active"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Active Users"
                />
                <Bar
                  dataKey="new"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                  name="New Users"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
