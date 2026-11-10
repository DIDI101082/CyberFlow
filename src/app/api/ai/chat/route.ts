import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId, message, history } = await request.json()
    const supabase = await createClient()

    // Get project data with tasks, milestones, members
    const [projectRes, tasksRes, milestonesRes, membersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*, assigned:profiles!tasks_assigned_to_fkey(full_name)').eq('project_id', projectId),
      supabase.from('milestones').select('*').eq('project_id', projectId),
      supabase.from('project_members').select('*, profile:profiles(full_name, role)').eq('project_id', projectId),
    ])

    const project = projectRes.data
    const tasks = tasksRes.data || []
    const milestones = milestonesRes.data || []
    const members = membersRes.data || []

    const now = new Date()
    const overdueTasks = tasks.filter((t: Record<string, unknown>) => t.status !== 'completed' && t.due_date && new Date(t.due_date as string) < now)
    const blockedTasks = tasks.filter((t: Record<string, unknown>) => t.status === 'blocked')
    const completedTasks = tasks.filter((t: Record<string, unknown>) => t.status === 'completed')
    const inProgressTasks = tasks.filter((t: Record<string, unknown>) => t.status === 'in_progress')

    const systemPrompt = `Sos el asistente IA del proyecto "${project?.name}" en CyberFlow (plataforma de gestión de proyectos de Accusys Technology).

CONTEXTO DEL PROYECTO:
- Nombre: ${project?.name}
- Descripción: ${project?.description || 'Sin descripción'}
- Estado: ${project?.status}
- Progreso: ${project?.progress || 0}%
- Fecha inicio: ${project?.start_date || 'No definida'}
- Fecha fin: ${project?.end_date || 'No definida'}

TAREAS (${tasks.length} total):
- Completadas: ${completedTasks.length}
- En progreso: ${inProgressTasks.length}
- Bloqueadas: ${blockedTasks.length}
- Vencidas: ${overdueTasks.length}
${overdueTasks.length > 0 ? `\nTareas vencidas:\n${overdueTasks.map((t: Record<string, unknown>) => `  - "${t.title}" (vencía: ${t.due_date}, asignada a: ${(t.assigned as Record<string, unknown>)?.full_name || 'sin asignar'}, prioridad: ${t.priority})`).join('\n')}` : ''}
${blockedTasks.length > 0 ? `\nTareas bloqueadas:\n${blockedTasks.map((t: Record<string, unknown>) => `  - "${t.title}" (asignada a: ${(t.assigned as Record<string, unknown>)?.full_name || 'sin asignar'})`).join('\n')}` : ''}

HITOS (${milestones.length}):
${milestones.map((m: Record<string, unknown>) => `- ${m.title}: ${m.is_completed ? '✅ Completado' : `⏳ Pendiente (fecha: ${m.due_date || 'sin fecha'})`}`).join('\n')}

MIEMBROS (${members.length}):
${members.map((m: Record<string, unknown>) => `- ${(m.profile as Record<string, unknown>)?.full_name} (${(m.profile as Record<string, unknown>)?.role})`).join('\n')}

INSTRUCCIONES:
- Respondé en español, de forma clara y concisa
- Basá tus respuestas en los datos reales del proyecto
- Si detectás riesgos o problemas, mencionálos proactivamente
- Sugerí acciones concretas cuando sea posible
- Usá formato con viñetas cuando ayude a la claridad
- Si te preguntan algo que no podés determinar con los datos disponibles, decilo honestamente`

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ response: 'El asistente IA no está configurado. Agregá la OPENAI_API_KEY en las variables de entorno.' })
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((m: Record<string, string>) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7, max_tokens: 1000 }),
    })

    const data = await openaiRes.json()

    if (data.error) {
      return NextResponse.json({ response: `Error de IA: ${data.error.message}` })
    }

    return NextResponse.json({ response: data.choices?.[0]?.message?.content || 'Sin respuesta.' })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({ response: 'Error interno del asistente.' }, { status: 500 })
  }
}
