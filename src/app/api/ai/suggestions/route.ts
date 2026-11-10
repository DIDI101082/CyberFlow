import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ suggestions: [] })

    const supabase = await createClient()

    const [tasksRes, milestonesRes] = await Promise.all([
      supabase.from('tasks').select('*, assigned:profiles!tasks_assigned_to_fkey(full_name)').eq('project_id', projectId),
      supabase.from('milestones').select('*').eq('project_id', projectId),
    ])

    const tasks = tasksRes.data || []
    const milestones = milestonesRes.data || []
    const now = new Date()
    const suggestions: { type: string; icon: string; title: string; description: string; priority: string }[] = []

    // Overdue tasks
    const overdue = tasks.filter((t: Record<string, unknown>) => t.status !== 'completed' && t.due_date && new Date(t.due_date as string) < now)
    if (overdue.length > 0) {
      suggestions.push({
        type: 'warning',
        icon: '⚠️',
        title: `${overdue.length} tarea${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}`,
        description: `Las tareas ${overdue.map((t: Record<string, unknown>) => `"${t.title}"`).join(', ')} están vencidas. Considerá reasignar o extender plazos.`,
        priority: 'high',
      })
    }

    // Blocked tasks
    const blocked = tasks.filter((t: Record<string, unknown>) => t.status === 'blocked')
    if (blocked.length > 0) {
      suggestions.push({
        type: 'danger',
        icon: '🚫',
        title: `${blocked.length} tarea${blocked.length > 1 ? 's' : ''} bloqueada${blocked.length > 1 ? 's' : ''}`,
        description: `Revisá las dependencias o impedimentos de: ${blocked.map((t: Record<string, unknown>) => `"${t.title}"`).join(', ')}.`,
        priority: 'high',
      })
    }

    // Unassigned tasks
    const unassigned = tasks.filter((t: Record<string, unknown>) => !t.assigned_to && t.status !== 'completed')
    if (unassigned.length > 0) {
      suggestions.push({
        type: 'info',
        icon: '👤',
        title: `${unassigned.length} tarea${unassigned.length > 1 ? 's' : ''} sin asignar`,
        description: 'Asigná responsables para mantener el avance del proyecto.',
        priority: 'medium',
      })
    }

    // Tasks without due date
    const noDueDate = tasks.filter((t: Record<string, unknown>) => !t.due_date && t.status !== 'completed')
    if (noDueDate.length > 0) {
      suggestions.push({
        type: 'info',
        icon: '📅',
        title: `${noDueDate.length} tarea${noDueDate.length > 1 ? 's' : ''} sin fecha límite`,
        description: 'Definí fechas para poder hacer seguimiento del progreso.',
        priority: 'medium',
      })
    }

    // Upcoming milestone
    const upcomingMilestones = milestones
      .filter((m: Record<string, unknown>) => !m.is_completed && m.due_date)
      .filter((m: Record<string, unknown>) => {
        const diff = (new Date(m.due_date as string).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 7
      })
    if (upcomingMilestones.length > 0) {
      suggestions.push({
        type: 'warning',
        icon: '🏁',
        title: `Hito próximo: "${upcomingMilestones[0].title}"`,
        description: `Vence en los próximos 7 días. Asegurate de completar las tareas asociadas.`,
        priority: 'high',
      })
    }

    // High completion — positive feedback
    const completed = tasks.filter((t: Record<string, unknown>) => t.status === 'completed')
    if (tasks.length > 0 && completed.length / tasks.length >= 0.8) {
      suggestions.push({
        type: 'success',
        icon: '🎉',
        title: '¡Excelente progreso!',
        description: `El ${Math.round((completed.length / tasks.length) * 100)}% de las tareas están completadas. ¡El equipo va por buen camino!`,
        priority: 'low',
      })
    }

    // Critical tasks not started
    const criticalPending = tasks.filter((t: Record<string, unknown>) => t.priority === 'critical' && t.status === 'pending')
    if (criticalPending.length > 0) {
      suggestions.push({
        type: 'danger',
        icon: '🔴',
        title: `${criticalPending.length} tarea${criticalPending.length > 1 ? 's' : ''} crítica${criticalPending.length > 1 ? 's' : ''} sin iniciar`,
        description: `Las tareas críticas deberían priorizarse: ${criticalPending.map((t: Record<string, unknown>) => `"${t.title}"`).join(', ')}.`,
        priority: 'high',
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('AI Suggestions error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
