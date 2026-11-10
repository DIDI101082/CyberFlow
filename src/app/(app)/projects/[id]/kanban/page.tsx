'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, GripVertical, Clock, AlertTriangle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  assigned_to: string | null
  milestone_id: string | null
  ai_suggested: boolean
  assignee?: { full_name: string } | null
  milestone?: { name: string } | null
}

const COLUMNS = [
  { id: 'pending', label: 'Pendiente', color: 'bg-gray-500', bgColor: 'bg-gray-500/10 border-gray-500/30' },
  { id: 'in_progress', label: 'En Progreso', color: 'bg-blue-500', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'review', label: 'Revisión', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  { id: 'completed', label: 'Completado', color: 'bg-green-500', bgColor: 'bg-green-500/10 border-green-500/30' },
  { id: 'blocked', label: 'Bloqueado', color: 'bg-red-500', bgColor: 'bg-red-500/10 border-red-500/30' },
]

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export default function KanbanPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [tasks, setTasks] = useState<Task[]>([])
  const [project, setProject] = useState<{ name: string } | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [projectId])

  async function loadData() {
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      supabase.from('projects').select('name').eq('id', projectId).single(),
      supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), milestone:milestones(name)')
        .eq('project_id', projectId)
        .order('sort_order'),
    ])
    setProject(proj)
    setTasks(taskData || [])
    setLoading(false)
  }

  async function handleDrop(newStatus: string) {
    if (!draggedTask) return
    const task = tasks.find((t) => t.id === draggedTask)
    if (!task || task.status === newStatus) {
      setDraggedTask(null)
      setDragOverColumn(null)
      return
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask ? { ...t, status: newStatus } : t))
    )
    setDraggedTask(null)
    setDragOverColumn(null)

    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', draggedTask)
  }

  function getColumnTasks(status: string) {
    return tasks.filter((t) => t.status === status)
  }

  function isOverdue(date: string | null) {
    if (!date) return false
    return new Date(date) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Kanban Board</h1>
          <p className="text-surface-500">{project?.name}</p>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id)
          return (
            <div
              key={column.id}
              className={cn(
                'flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors',
                dragOverColumn === column.id ? 'border-brand-500 bg-brand-50/50' : 'border-surface-200 bg-surface-50'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverColumn(column.id)
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(column.id)
              }}
            >
              {/* Column Header */}
              <div className="p-3 flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', column.color)} />
                <h3 className="font-semibold text-surface-800 text-sm">{column.label}</h3>
                <span className="ml-auto text-xs bg-surface-200 text-surface-600 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                    onDragEnd={() => {
                      setDraggedTask(null)
                      setDragOverColumn(null)
                    }}
                    className={cn(
                      'bg-white rounded-lg border border-surface-200 p-3 cursor-grab active:cursor-grabbing',
                      'hover:border-brand-300 hover:shadow-sm transition-all',
                      draggedTask === task.id && 'opacity-50 rotate-2'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-surface-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-surface-800 truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priorityColors[task.priority])}>
                            {task.priority}
                          </span>
                          {task.ai_suggested && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">IA</span>
                          )}
                          {task.milestone?.name && (
                            <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                              {task.milestone.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          {task.due_date && (
                            <span className={cn('flex items-center gap-1 text-xs', isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-600' : 'text-surface-400')}>
                              {isOverdue(task.due_date) && task.status !== 'completed' ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {new Date(task.due_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          {task.assignee?.full_name && (
                            <span className="flex items-center gap-1 text-xs text-surface-400">
                              <User className="w-3 h-3" />
                              {task.assignee.full_name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-surface-400 text-xs">
                    Arrastrá tareas aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
