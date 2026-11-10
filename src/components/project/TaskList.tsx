'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { taskStatusConfig, priorityConfig, formatDate, isOverdue, cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, AlertTriangle, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { Task, TaskStatus } from '@/lib/types'

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="w-4 h-4 text-surface-300" />,
  in_progress: <Clock className="w-4 h-4 text-brand-500" />,
  review: <AlertTriangle className="w-4 h-4 text-purple-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  blocked: <AlertTriangle className="w-4 h-4 text-red-500" />,
}

export default function TaskList({ tasks, projectId }: { tasks: any[]; projectId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    setUpdatingTask(taskId)
    await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    router.refresh()
    setUpdatingTask(null)
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-surface-400 text-center py-4">Sin tareas</p>
  }

  return (
    <div className="divide-y divide-surface-100">
      {tasks.map((task: any) => {
        const statusCfg = taskStatusConfig[task.status as TaskStatus]
        const priorityCfg = priorityConfig[task.priority as keyof typeof priorityConfig]
        const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'completed'
        const isExpanded = expandedTask === task.id

        return (
          <div key={task.id} className={cn('py-3', overdue && 'bg-red-50/30')}>
            <div className="flex items-center gap-3">
              {/* Status toggle */}
              <button
                onClick={() => updateTaskStatus(
                  task.id,
                  task.status === 'completed' ? 'pending' : 'completed'
                )}
                disabled={updatingTask === task.id}
                className="shrink-0"
              >
                {updatingTask === task.id ? (
                  <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                ) : (
                  statusIcons[task.status as TaskStatus]
                )}
              </button>

              {/* Task info */}
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    task.status === 'completed' ? 'text-surface-400 line-through' : 'text-surface-800'
                  )}>
                    {task.title}
                  </span>
                  {task.ai_suggested && <Sparkles className="w-3 h-3 text-brand-400" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs ${priorityCfg.color}`}>{priorityCfg.icon} {priorityCfg.label}</span>
                  {task.assignee && (
                    <span className="text-xs text-surface-400">→ {task.assignee.full_name}</span>
                  )}
                  {task.due_date && (
                    <span className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-surface-400')}>
                      {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
                    </span>
                  )}
                  {task.estimated_hours && (
                    <span className="text-xs text-surface-300">{task.estimated_hours}h</span>
                  )}
                </div>
              </div>

              {/* Status select */}
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                className="text-xs border border-surface-200 rounded-lg px-2 py-1 text-surface-600 bg-white"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="review">En Revisión</option>
                <option value="completed">Completada</option>
                <option value="blocked">Bloqueada</option>
              </select>

              <button
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="shrink-0 text-surface-300 hover:text-surface-500"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Expandido */}
            {isExpanded && task.description && (
              <div className="ml-7 mt-2 rounded-lg bg-surface-50 p-3">
                <p className="text-sm text-surface-600">{task.description}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
