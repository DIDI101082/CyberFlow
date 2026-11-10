// ============================================================
// TIPOS TypeScript - Accusys CyberFlow
// ============================================================

export type UserRole = 'admin' | 'area_lead' | 'member'
export type ProjectStatus = 'draft' | 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type RiskLevel = 'low' | 'medium' | 'high'
export type ReportType = 'weekly' | 'monthly' | 'on_demand' | 'milestone'

export interface Area {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  area_id: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  area?: Area
}

export interface Project {
  id: string
  name: string
  description: string | null
  area_id: string | null
  owner_id: string | null
  status: ProjectStatus
  priority: TaskPriority
  start_date: string | null
  end_date: string | null
  progress: number
  is_cross_area: boolean
  ai_generated_plan: AIPlan | null
  tags: string[]
  created_at: string
  updated_at: string
  area?: Area
  owner?: Profile
  members?: ProjectMember[]
  tasks?: Task[]
  milestones?: Milestone[]
  risks?: Risk[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  profile?: Profile
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  estimated_hours: number | null
  actual_hours: number | null
  depends_on: string | null
  sort_order: number
  tags: string[]
  ai_suggested: boolean
  created_at: string
  updated_at: string
  assignee?: Profile
  milestone?: Milestone
  comments?: TaskComment[]
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string | null
  content: string
  created_at: string
  user?: Profile
}

export interface Risk {
  id: string
  project_id: string
  title: string
  description: string | null
  level: RiskLevel
  mitigation: string | null
  is_mitigated: boolean
  ai_suggested: boolean
  created_at: string
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  area_id: string | null
  template_data: {
    milestones: Partial<Milestone>[]
    tasks: Partial<Task>[]
    risks: Partial<Risk>[]
  }
  is_global: boolean
  created_by: string | null
  created_at: string
}

export interface Report {
  id: string
  project_id: string
  type: ReportType
  title: string
  content: ReportContent
  ai_summary: string | null
  ai_recommendations: string[] | null
  generated_by: string | null
  created_at: string
  project?: Project
}

export interface ReportContent {
  overview: string
  progress: number
  tasks_summary: {
    total: number
    completed: number
    in_progress: number
    blocked: number
    overdue: number
  }
  milestones_summary: {
    total: number
    completed: number
    upcoming: { name: string; due_date: string }[]
  }
  risks_summary: {
    total: number
    high: number
    mitigated: number
  }
  recent_activity: { action: string; date: string; user: string }[]
}

export interface ActivityLog {
  id: string
  project_id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: 'info' | 'warning' | 'overdue' | 'ai_suggestion'
  project_id: string | null
  is_read: boolean
  created_at: string
}

// IA Types
export interface AIPlan {
  objective: string
  scope: string
  milestones: {
    name: string
    description: string
    estimated_days: number
    tasks: {
      title: string
      description: string
      estimated_hours: number
      priority: TaskPriority
    }[]
  }[]
  risks: {
    title: string
    description: string
    level: RiskLevel
    mitigation: string
  }[]
  recommendations: string[]
}

export interface WizardFormData {
  name: string
  description: string
  area_id: string
  category: string
  objectives: string
  constraints: string
  estimated_duration: string
  team_size: string
  priority: TaskPriority
}

// Dashboard stats
export interface DashboardStats {
  total_projects: number
  active_projects: number
  completed_projects: number
  overdue_tasks: number
  total_tasks: number
  completed_tasks: number
  upcoming_milestones: (Milestone & { project_name: string })[]
  recent_activity: (ActivityLog & { project_name: string })[]
  projects_by_status: { status: ProjectStatus; count: number }[]
}
