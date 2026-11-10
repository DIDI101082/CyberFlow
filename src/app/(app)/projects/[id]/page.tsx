import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  CalendarDays,
  Target,
  ShieldAlert,
  Sparkles,
  Columns3,
  FolderOpen,
  Bot,
  GanttChart,
  FileDown,
  History,
} from 'lucide-react'
import {
  projectStatusConfig,
  taskStatusConfig,
  priorityConfig,
  riskLevelConfig,
  formatDate,
  formatDateFull,
  isOverdue,
  cn,
} from '@/lib/utils'
import GenerateReportButton from '@/components/project/GenerateReportButton'
import TaskList from '@/components/project/TaskList'
import AISuggestions from '@/components/projects/AISuggestions'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      area:areas(name),
      owner:profiles!projects_owner_id_fkey(full_name, email),
      milestones(*, tasks(*, assignee:profiles!tasks_assigned_to_fkey(full_name, email))),
      risks(*),
      project_members(*, profile:profiles(full_name, email, role))
    `)
    .eq('id', id)
    .single()

  if (!project) notFound()

  const allTasks = (project.milestones || []).flatMap((m: any) => m.tasks || [])
  const tasksWithoutMilestone = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name, email)')
    .eq('project_id', id)
    .is('milestone_id', null)

  const orphanTasks = tasksWithoutMilestone.data || []
  const totalTasks = allTasks.length + orphanTasks.length
  const completedTasks = [...allTasks, ...orphanTasks].filter((t: any) => t.status === 'completed').length
  const overdueTasks = [...allTasks, ...orphanTasks].filter((t: any) => t.due_date && isOverdue(t.due_date) && t.status !== 'completed').length
  const blockedTasks = [...allTasks, ...orphanTasks].filter((t: any) => t.status === 'blocked').length

  const statusCfg = projectStatusConfig[project.status as keyof typeof projectStatusConfig] || projectStatusConfig.draft
  const priorityCfg = priorityConfig[project.priority as keyof typeof priorityConfig] || priorityConfig.medium

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects" className="btn-ghost mb-4 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Proyectos
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-surface-900">{project.name}</h1>
              <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
              <span className={`badge ${priorityCfg.bg} ${priorityCfg.color}`}>{priorityCfg.icon} {priorityCfg.label}</span>
              {project.ai_generated_plan && (
                <span className="badge bg-brand-50 text-brand-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Plan IA
                </span>
              )}
            </div>
            <p className="text-surface-500">{project.description || 'Sin descripción'}</p>
          </div>

          <GenerateReportButton projectId={project.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card flex items-center gap-3 !p-4">
          <Target className="w-8 h-8 text-brand-500" />
          <div>
            <p className="text-2xl font-bold">{project.progress}%</p>
            <p className="text-xs text-surface-500">Progreso</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !p-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <div>
            <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
            <p className="text-xs text-surface-500">Tareas completas</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !p-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold">{overdueTasks}</p>
            <p className="text-xs text-surface-500">Vencidas</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !p-4">
          <Clock className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-2xl font-bold">{blockedTasks}</p>
            <p className="text-xs text-surface-500">Bloqueadas</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 !p-4">
          <Users className="w-8 h-8 text-surface-400" />
          <div>
            <p className="text-2xl font-bold">{project.project_members?.length || 0}</p>
            <p className="text-xs text-surface-500">Miembros</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso grande */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-700">Progreso general</span>
          <span className="text-sm font-bold text-surface-900">{project.progress}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              project.progress >= 75 ? 'bg-emerald-500' :
              project.progress >= 40 ? 'bg-brand-500' :
              'bg-amber-500'
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-surface-400">
          <span>{formatDate(project.start_date)}</span>
          <span>{formatDate(project.end_date)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link href={`/projects/${id}/kanban`} className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <Columns3 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">Kanban</span>
        </Link>
        <Link href={`/projects/${id}/gantt`} className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <GanttChart className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">Gantt</span>
        </Link>
        <Link href={`/projects/${id}/files`} className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <FolderOpen className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">Archivos</span>
        </Link>
        <Link href={`/projects/${id}/chat`} className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <Bot className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">Chat IA</span>
        </Link>
        <a href={`/api/reports/export?projectId=${id}&format=html`} target="_blank" className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <FileDown className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">Reporte</span>
        </a>
        <a href={`/api/reports/export?projectId=${id}&format=csv`} className="card !p-3 flex items-center gap-2 hover:border-brand-300 transition-colors group">
          <History className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-surface-700">CSV</span>
        </a>
      </div>

      {/* AI Suggestions */}
      <AISuggestions projectId={id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones con tareas */}
          {(project.milestones || []).map((milestone: any) => (
            <div key={milestone.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                    {milestone.completed_at ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <CalendarDays className="w-5 h-5 text-brand-500" />
                    )}
                    {milestone.name}
                  </h3>
                  {milestone.description && (
                    <p className="text-sm text-surface-500 mt-0.5">{milestone.description}</p>
                  )}
                </div>
                {milestone.due_date && (
                  <span className={cn(
                    'text-xs',
                    milestone.completed_at ? 'text-emerald-600' :
                    isOverdue(milestone.due_date) ? 'text-red-600 font-medium' :
                    'text-surface-400'
                  )}>
                    {milestone.completed_at ? '✓ Completado' : formatDate(milestone.due_date)}
                  </span>
                )}
              </div>

              <TaskList tasks={milestone.tasks || []} projectId={project.id} />
            </div>
          ))}

          {/* Tareas sin milestone */}
          {orphanTasks.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-surface-900 mb-4">Tareas sin hito asignado</h3>
              <TaskList tasks={orphanTasks} projectId={project.id} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-surface-900">Información</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Área</span>
                <span className="font-medium">{project.area?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Owner</span>
                <span className="font-medium">{project.owner?.full_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Inicio</span>
                <span className="font-medium">{formatDate(project.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Fin estimado</span>
                <span className="font-medium">{formatDate(project.end_date)}</span>
              </div>
              {project.tags?.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-surface-500">Tags</span>
                  <span className="font-medium">{project.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Miembros */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-surface-900">Equipo</h3>
            {project.project_members?.length > 0 ? (
              <div className="space-y-2">
                {project.project_members.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {member.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-800 truncate">{member.profile?.full_name}</p>
                    </div>
                    <span className="text-xs text-surface-400">{member.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400">Sin miembros asignados</p>
            )}
          </div>

          {/* Riesgos */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Riesgos
            </h3>
            {project.risks?.length > 0 ? (
              <div className="space-y-2">
                {project.risks.map((risk: any) => {
                  const cfg = riskLevelConfig[risk.level as keyof typeof riskLevelConfig]
                  return (
                    <div key={risk.id} className={cn('rounded-lg border p-3', risk.is_mitigated ? 'opacity-60' : '')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        {risk.ai_suggested && <Sparkles className="w-3 h-3 text-brand-400" />}
                        {risk.is_mitigated && <span className="text-xs text-emerald-600">✓ Mitigado</span>}
                      </div>
                      <p className="text-sm font-medium text-surface-800">{risk.title}</p>
                      {risk.mitigation && (
                        <p className="text-xs text-surface-500 mt-1">{risk.mitigation}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-surface-400">Sin riesgos registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

