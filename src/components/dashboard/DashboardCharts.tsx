'use client'

import { cn } from '@/lib/utils'

type Props = {
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  projectProgress: { name: string; progress: number }[]
  completionRate: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-400' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-500' },
  review: { label: 'Revisión', color: 'bg-yellow-500' },
  completed: { label: 'Completado', color: 'bg-green-500' },
  blocked: { label: 'Bloqueado', color: 'bg-red-500' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-400' },
  medium: { label: 'Media', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  critical: { label: 'Crítica', color: 'bg-red-500' },
}

export default function DashboardCharts({ tasksByStatus, tasksByPriority, projectProgress, completionRate }: Props) {
  const totalByStatus = Object.values(tasksByStatus).reduce((a, b) => a + b, 0)
  const totalByPriority = Object.values(tasksByPriority).reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Completion Rate Ring */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 flex flex-col items-center justify-center">
        <h3 className="text-sm font-medium text-surface-500 mb-4">Tasa de Completado</h3>
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={completionRate >= 75 ? '#22c55e' : completionRate >= 50 ? '#3b82f6' : completionRate >= 25 ? '#f59e0b' : '#ef4444'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(completionRate / 100) * 314} 314`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-surface-900">{completionRate}%</span>
          </div>
        </div>
        <p className="text-xs text-surface-400 mt-3">de tareas completadas</p>
      </div>

      {/* Tasks by Status - Horizontal bars */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-medium text-surface-500 mb-4">Tareas por Estado</h3>
        <div className="space-y-3">
          {Object.entries(tasksByStatus).map(([status, count]) => {
            const config = statusConfig[status]
            const percentage = totalByStatus > 0 ? (count / totalByStatus) * 100 : 0
            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-600">{config?.label || status}</span>
                  <span className="text-xs font-medium text-surface-800">{count}</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', config?.color || 'bg-gray-400')}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks by Priority - Horizontal bars */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <h3 className="text-sm font-medium text-surface-500 mb-4">Tareas por Prioridad</h3>
        <div className="space-y-3">
          {Object.entries(tasksByPriority).map(([priority, count]) => {
            const config = priorityConfig[priority]
            const percentage = totalByPriority > 0 ? (count / totalByPriority) * 100 : 0
            return (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-surface-600">{config?.label || priority}</span>
                  <span className="text-xs font-medium text-surface-800">{count}</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', config?.color || 'bg-gray-400')}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {/* Project Progress */}
        {projectProgress.length > 0 && (
          <div className="mt-6 pt-4 border-t border-surface-100">
            <h4 className="text-xs font-medium text-surface-400 mb-3">Progreso por Proyecto</h4>
            <div className="space-y-2">
              {projectProgress.slice(0, 4).map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-surface-600 truncate max-w-[140px]">{p.name}</span>
                    <span className="text-xs font-medium">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
