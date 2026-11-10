import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wand2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { projectStatusConfig, taskStatusConfig, formatDate, timeAgo, priorityConfig } from '@/lib/utils'
import type { Project, Task, ActivityLog } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Cargar proyectos
  const { data: projects } = await supabase
    .from('projects')
    .select('*, area:areas(name), owner:profiles(full_name)')
    .order('updated_at', { ascending: false })

  // Cargar tareas vencidas
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*, project:projects(name), assignee:profiles!tasks_assigned_to_fkey(full_name)')
    .lt('due_date', new Date().toISOString().split('T')[0])
    .neq('status', 'completed')
    .order('due_date')
    .limit(10)

  // Cargar actividad reciente
  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*, user:profiles(full_name), project:projects(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  const allProjects = (projects || []) as (Project & { area: { name: string } | null; owner: { full_name: string } | null })[]
  const activeProjects = allProjects.filter(p => p.status === 'in_progress')
  const completedProjects = allProjects.filter(p => p.status === 'completed')

  // Stats
  const stats = [
    { label: 'Proyectos Activos', value: activeProjects.length, icon: FolderKanban, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Completados', value: completedProjects.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tareas Vencidas', value: overdueTasks?.length || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Proyectos', value: allProjects.length, icon: TrendingUp, color: 'text-surface-600', bg: 'bg-surface-100' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 mt-1">Resumen general de tus proyectos</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Wand2 className="w-4 h-4" />
          Nuevo Proyecto con IA
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proyectos Activos */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900">Proyectos Activos</h2>
            <Link href="/projects" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No hay proyectos activos</p>
              <Link href="/projects/new" className="text-sm text-brand-600 hover:underline mt-1 inline-block">
                Creá uno con el Wizard IA
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map((project) => {
                const statusCfg = projectStatusConfig[project.status]
                const priorityCfg = priorityConfig[project.priority]
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 rounded-lg border border-surface-200 p-4 hover:border-brand-200 hover:bg-brand-50/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-surface-900 truncate">{project.name}</h3>
                        <span className={`badge ${priorityCfg.bg} ${priorityCfg.color}`}>
                          {priorityCfg.icon} {priorityCfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {project.area?.name || 'Sin área'} · {formatDate(project.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-surface-900">{project.progress}%</p>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-surface-100">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Tareas Vencidas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Tareas Vencidas
            </span>
          </h2>

          {!overdueTasks || overdueTasks.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">¡Todo al día!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map((task: any) => (
                <div key={task.id} className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                  <p className="text-sm font-medium text-surface-900">{task.title}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    {task.project?.name} · Venció {formatDate(task.due_date)}
                  </p>
                  {task.assignee && (
                    <p className="text-xs text-surface-400 mt-0.5">
                      → {task.assignee.full_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Actividad Reciente</h2>
        {!recentActivity || recentActivity.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">Sin actividad reciente</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100">
                  <Clock className="h-4 w-4 text-surface-400" />
                </div>
                <div>
                  <p className="text-sm text-surface-700">
                    <span className="font-medium">{activity.user?.full_name || 'Sistema'}</span>{' '}
                    {activity.action}
                    {activity.project?.name && (
                      <> en <span className="font-medium">{activity.project.name}</span></>
                    )}
                  </p>
                  <p className="text-xs text-surface-400">{timeAgo(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
