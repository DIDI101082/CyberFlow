import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { cn, formatDate, timeAgo, getProgressColor } from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: projects },
    { data: allTasks },
    { data: recentActivity },
    { data: profile },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    supabase.from('tasks').select('*, project:projects(name)'),
    supabase.from('activity_log').select('*, project:projects(name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
  ])

  const activeProjects = projects?.filter((p) => p.status === 'active') || []
  const completedProjects = projects?.filter((p) => p.status === 'completed') || []
  const overdueTasks = allTasks?.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ) || []
  const blockedTasks = allTasks?.filter((t) => t.status === 'blocked') || []
  const totalTasks = allTasks?.length || 0
  const completedTasks = allTasks?.filter((t) => t.status === 'completed').length || 0

  const tasksByStatus = {
    pending: allTasks?.filter((t) => t.status === 'pending').length || 0,
    in_progress: allTasks?.filter((t) => t.status === 'in_progress').length || 0,
    review: allTasks?.filter((t) => t.status === 'review').length || 0,
    completed: completedTasks,
    blocked: blockedTasks.length,
  }

  const tasksByPriority = {
    low: allTasks?.filter((t) => t.priority === 'low').length || 0,
    medium: allTasks?.filter((t) => t.priority === 'medium').length || 0,
    high: allTasks?.filter((t) => t.priority === 'high').length || 0,
    critical: allTasks?.filter((t) => t.priority === 'critical').length || 0,
  }

  const projectProgress = activeProjects.map((p) => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    progress: p.progress || 0,
  }))

  const stats = [
    { label: 'Proyectos Activos', value: activeProjects.length, icon: FolderKanban, color: 'text-blue-600 bg-blue-100' },
    { label: 'Completados', value: completedProjects.length, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
    { label: 'Tareas Vencidas', value: overdueTasks.length, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    { label: 'Total Tareas', value: totalTasks, icon: BarChart3, color: 'text-purple-600 bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Hola, {profile?.full_name || 'Usuario'} 👋
        </h1>
        <p className="text-surface-500 mt-1">Resumen de tus proyectos y tareas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DashboardCharts
        tasksByStatus={tasksByStatus}
        tasksByPriority={tasksByPriority}
        projectProgress={projectProgress}
        completionRate={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Proyectos Activos
            </h2>
            <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                <p className="text-surface-500">No hay proyectos activos</p>
                <Link href="/projects/new" className="text-sm text-brand-600 hover:text-brand-700 mt-1 inline-block">
                  Crear proyecto con IA →
                </Link>
              </div>
            ) : (
              activeProjects.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 truncate group-hover:text-brand-600">{project.name}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(project.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-surface-100 rounded-full h-2">
                      <div className={cn('h-2 rounded-full transition-all', getProgressColor(project.progress || 0))}
                        style={{ width: `${project.progress || 0}%` }} />
                    </div>
                    <span className="text-sm font-medium text-surface-600 w-10 text-right">{project.progress || 0}%</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-500" />
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-surface-400 text-sm text-center py-4">Sin actividad reciente</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-surface-700">{activity.action}</p>
                    <p className="text-xs text-surface-400">{timeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            Tareas Vencidas ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                <div>
                  <p className="font-medium text-surface-800 text-sm">{task.title}</p>
                  <p className="text-xs text-surface-500">{(task as any).project?.name}</p>
                </div>
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
