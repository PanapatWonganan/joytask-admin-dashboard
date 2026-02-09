// User types
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  users_by_role?: {
    role: string;
    count: number;
  }[];
}

// Sound types
export interface Sound {
  id: number;
  key: string;
  name: string;
  name_en: string | null;
  type: 'ambient' | 'effect';
  category: string;
  download_url: string | null;
  file_size: number;
  format: string;
  duration_ms: number;
  is_premium: boolean;
  sort_order: number;
}

// Activity Log types
export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ActivityLogStats {
  total_logs: number;
  recent_logs: number;
  action_distribution: Record<string, number>;
  daily_counts: Record<string, number>;
  active_users: number;
  most_active_users: Array<{
    user_id: number;
    count: number;
    user: { id: number; name: string; email: string } | null;
  }>;
  recent_action_counts: Record<string, number>;
  period_days: number;
}

// Mood types
export interface Mood {
  id: number;
  user_id: number;
  mood_type: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad' | 'anxious' | 'calm' | 'angry' | 'excited' | 'tired';
  mood_score: number;
  note: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface MoodStats {
  total_moods: number;
  average_score: number;
  recent_average_score: number;
  mood_distribution: Record<string, number>;
  daily_averages: Record<string, number>;
  daily_counts: Record<string, number>;
  score_distribution: Record<string, number>;
  active_users: number;
  positive_moods: number;
  negative_moods: number;
  neutral_moods: number;
  period_days: number;
}

// Task types
export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  cancelled_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  tasks_by_category: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  daily_created: Record<string, number>;
  daily_completed: Record<string, number>;
  active_users: number;
  period_days: number;
}

// Achievement types
export interface Achievement {
  id: number;
  user_id: number;
  achievement_id: string;
  title: string;
  description: string;
  icon_emoji: string;
  category: 'tasks' | 'streak' | 'focus' | 'special';
  required_progress: number;
  current_progress: number;
  reward_points: number;
  reward_costume_id: string | null;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AchievementStats {
  total_achievements: number;
  unlocked_achievements: number;
  locked_achievements: number;
  recent_unlocked: number;
  category_distribution: Record<string, number>;
  unlock_rate_by_category: Record<string, number>;
  daily_unlocks: Record<string, number>;
  popular_achievements: Array<{
    achievement_id: string;
    title: string;
    icon_emoji: string;
    unlock_count: number;
  }>;
  total_points_distributed: number;
  users_with_achievements: number;
  period_days: number;
}

// Focus Session types
export interface FocusSession {
  id: number;
  user_id: number;
  task_uuid: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  was_completed: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface FocusSessionStats {
  total_sessions: number;
  completed_sessions: number;
  incomplete_sessions: number;
  recent_sessions: number;
  total_minutes_planned: number;
  total_minutes_completed: number;
  avg_session_duration: number;
  completion_rate: number;
  daily_counts: Record<string, number>;
  daily_minutes: Record<string, number>;
  duration_distribution: Record<string, number>;
  active_users: number;
  top_users: Array<{
    user_id: number;
    total_minutes: number;
    session_count: number;
    user: { id: number; name: string; email: string } | null;
  }>;
  period_days: number;
}

// Daily Login types
export interface DailyLoginClaim {
  id: number;
  user_id: number;
  claim_date: string;
  day_in_cycle: number;
  points_earned: number;
  bonus_reward_given: boolean;
  bonus_costume_id: string | null;
  claimed_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DailyLoginProgress {
  id: number;
  user_id: number;
  current_day_in_cycle: number;
  weeks_completed: number;
  total_days_claimed: number;
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DailyLoginStats {
  total_claims: number;
  recent_claims: number;
  total_points_distributed: number;
  recent_points_distributed: number;
  total_users_with_progress: number;
  active_users_recent: number;
  claimed_today: number;
  avg_current_streak: number;
  max_streak: number;
  avg_longest_streak: number;
  day_distribution: Record<string, number>;
  jackpot_claims: number;
  daily_claim_counts: Record<string, number>;
  top_streak_holders: Array<{
    user_id: number;
    current_streak: number;
    longest_streak: number;
    total_days_claimed: number;
    user: { id: number; name: string; email: string } | null;
  }>;
  weeks_distribution: Record<string, number>;
  period_days: number;
}

// Form types
export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role?: string;
  status: 'active' | 'inactive';
}
