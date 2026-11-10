'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Task = {
  id: string; title: string; status: string; priority: string
  start_date: string | null; due_date: string | null
  assigned_to: string | null
  assigned?: { full_name: string } | null
}

type Milestone = {
  id: string; title: string; due_date: string | null; is_completed: boolean
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-400', in_progress: 'bg-blue-500', review: 'bg-yellow-500',
  completed: 'bg-green-500', blocked: 'bg-red-500',
}

const priorityBorder: Record<string, string> = {
  critical: 'border-l-red-500', high: 'border-l-orange-500',
  medium: 'border-l-yellow-500', low: 'border-l-green-500',
}

export default function GanttPage() {
  const params = useParams()
  const projectId = params.id as string
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [project, setProject] = useState<{ name: string; start_date: string; end_date: string } | null>(null)
  const [viewOffset, setViewOffset] = useState(0)

  useEffect(() => {
    async function load() {
      const [pRes, tRes, mRes] = await Promise.all([
        supabase.from('projects').select('name, start_date, end_date').eq('id', projectId).single(),
        supabase.from('tasks').select('*, assigned:profiles!tasks_assigned_to_fkey(full_name)').eq('project_id', projectId).order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('milestones').select('*').eq('project_id', projectId),
      ])
      if (pRes.data) setProject(pRes.data)
      if (tRes.data) setTasks(tRes.data as Task[])
      if (mRes.data) setMilestones(mRes.data)
    }
    load()
  }, [projectId])

  const DAYS_VISIBLE = 30

  const { startDate, days } = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + viewOffset)
    base.setHours(0, 0, 0, 0)
    const ds = Array.from({ length: DAYS_VISIBLE }, (_, i) => {
      const d = new Date(base)
      d.setDate(d.getDate() + i)
      return d
    })
    return { startDate: base, days: ds }
  }, [viewOffset])

  function daysBetween(a: Date, b: Date) {
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  }

  function getBarStyle(task: Task) {
    if (!task.due_date) return null
    const taskStart = task.start_date ? new Date(task.start_date) : new Date(new Date(task.due_date).getTime() - 7 * 24 * 60 * 60 * 1000)
    const taskEnd = new Date(task.due_date)
    const left = Math.max(0, daysBetween(startDate, taskStart))
    const right = Math.min(DAYS_VISIBLE, daysBetween(startDate, taskEnd) + 1)
    if (right <= 0 || left >= DAYS_VISIBLE) return null
    const clampedLeft = Math.max(0, left)
    const width = Math.max(1, right - clampedLeft)
    return { left: `${(clampedLeft / DAYS_VISIBLE) * 100}%`, width: `${(width / DAYS_VISIBLE) * 100}%` }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOffset = daysBetween(startDate, today)
  const todayPercent = todayOffset >= 0 && todayOffset < DAYS_VISIBLE ? (todayOffset / DAYS_VISIBLE) * 100 : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`} className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-surface-900">Gantt Chart</h1>
            <p className="text-sm text-surface-500">{project?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewOffset((v) => v - 14)} className="p-2 hover:bg-surface-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setViewOffset(0)} className="px-3 py-1.5 text-sm font-medium hover:bg-surface-100 rounded-lg">
            Hoy
          </button>
          <button onClick={() => setViewOffset((v) => v + 14)} className="p-2 hover:bg-surface-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(statusColors).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded', v)} />
            <span className="text-surface-600 capitalize">{k.replace('_', ' ')}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <Flag className="w-3 h-3 text-purple-500" />
          <span className="text-surface-600">Hito</span>
        </div>
      </div>

      <div className="border border-surface-200 rounded-xl bg-white overflow-hidden">
        {/* Header with days */}
        <div className="flex border-b border-surface-200">
          <div className="w-64 flex-shrink-0 px-4 py-2 bg-surface-50 border-r border-surface-200">
            <span className="text-xs font-medium text-surface-500">Tarea</span>
          </div>
          <div className="flex-1 flex relative">
            {days.map((d, i) => {
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isToday = d.getTime() === today.getTime()
              return (
                <div key={i} className={cn(
                  'flex-1 text-center py-1 border-r border-surface-100 text-[10px]',
                  isWeekend && 'bg-surface-50',
                  isToday && 'bg-brand-50'
                )}>
                  <div className="text-surface-400">{d.toLocaleDateString('es-AR', { weekday: 'short' }).charAt(0).toUpperCase()}</div>
                  <div className={cn('font-medium', isToday ? 'text-brand-600' : 'text-surface-700')}>{d.getDate()}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Month label */}
        <div className="flex border-b border-surface-100">
          <div className="w-64 flex-shrink-0 border-r border-surface-200" />
          <div className="flex-1 px-2 py-1">
            <span className="text-xs font-medium text-surface-500">
              {days[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              {days[0].getMonth() !== days[DAYS_VISIBLE - 1].getMonth() && ` — ${days[DAYS_VISIBLE - 1].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`}
            </span>
          </div>
        </div>

        {/* Milestones */}
        {milestones.filter((m) => m.due_date).map((m) => {
          const mDate = new Date(m.due_date!)
          const offset = daysBetween(startDate, mDate)
          if (offset < 0 || offset >= DAYS_VISIBLE) return null
          return (
            <div key={m.id} className="flex border-b border-surface-100 hover:bg-surface-50">
              <div className="w-64 flex-shrink-0 px-4 py-2 border-r border-surface-200 flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-medium text-purple-700 truncate">{m.title}</span>
                {m.is_completed && <span className="text-[10px] text-green-600">✅</span>}
              </div>
              <div className="flex-1 relative h-8">
                <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${(offset / DAYS_VISIBLE) * 100}%` }}>
                  <div className="w-4 h-4 bg-purple-500 rotate-45 transform -translate-x-1/2" />
                </div>
              </div>
            </div>
          )
        })}

        {/* Tasks */}
        {tasks.map((task) => {
          const bar = getBarStyle(task)
          return (
            <div key={task.id} className="flex border-b border-surface-100 hover:bg-surface-50">
              <div className={cn('w-64 flex-shrink-0 px-4 py-2 border-r border-surface-200 border-l-4', priorityBorder[task.priority] || 'border-l-transparent')}>
                <p className="text-xs font-medium text-surface-800 truncate">{task.title}</p>
                <p className="text-[10px] text-surface-400 truncate">{task.assigned?.full_name || 'Sin asignar'}</p>
              </div>
              <div className="flex-1 relative h-10">
                {/* Weekend/today backgrounds */}
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return isWeekend ? (
                    <div key={i} className="absolute top-0 bottom-0 bg-surface-50"
                      style={{ left: `${(i / DAYS_VISIBLE) * 100}%`, width: `${100 / DAYS_VISIBLE}%` }} />
                  ) : null
                })}
                {todayPercent !== null && (
                  <div className="absolute top-0 bottom-0 w-px bg-brand-400 z-10" style={{ left: `${todayPercent}%` }} />
                )}
                {bar && (
                  <div className={cn('absolute top-2 h-6 rounded-md shadow-sm', statusColors[task.status] || 'bg-gray-400')}
                    style={{ left: bar.left, width: bar.width, opacity: 0.85 }}
                    title={`${task.title} — ${task.status}`}>
                    <span className="text-[9px] text-white px-1.5 leading-6 truncate block">{task.title}</span>
                  </div>
                )}
                {!bar && (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[10px] text-surface-300">Sin fecha</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {tasks.length === 0 && (
          <div className="py-12 text-center text-sm text-surface-400">No hay tareas en este proyecto</div>
        )}
      </div>
    </div>
  )
}
