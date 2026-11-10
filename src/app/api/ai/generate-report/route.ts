import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Sos un Project Manager experto que genera reportes de estado de proyectos. Analizá los datos del proyecto y generá:

1. Un resumen ejecutivo del estado actual (2-3 párrafos)
2. Una lista de recomendaciones concretas (3-5 items)

Respondé SOLO con JSON válido (sin markdown, sin backticks):
{
  "summary": "resumen ejecutivo del estado",
  "recommendations": ["recomendación 1", "recomendación 2", ...]
}

Reglas:
- Sé concreto y basate en los datos
- Usá español argentino
- Si hay tareas vencidas, mencionalo como prioridad
- Si el progreso es bajo para el tiempo transcurrido, alertá
- Incluí sugerencias accionables`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { project_id } = await request.json()

    // Cargar datos del proyecto
    const { data: project } = await supabase
      .from('projects')
      .select('*, area:areas(name), owner:profiles(full_name)')
      .eq('id', project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name)')
      .eq('project_id', project_id)

    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', project_id)

    const { data: risks } = await supabase
      .from('risks')
      .select('*')
      .eq('project_id', project_id)

    const allTasks = tasks || []
    const now = new Date().toISOString().split('T')[0]
    const overdueTasks = allTasks.filter(t => t.due_date && t.due_date < now && t.status !== 'completed')
    const completedTasks = allTasks.filter(t => t.status === 'completed')
    const blockedTasks = allTasks.filter(t => t.status === 'blocked')
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress')

    const tasksSummary = {
      total: allTasks.length,
      completed: completedTasks.length,
      in_progress: inProgressTasks.length,
      blocked: blockedTasks.length,
      overdue: overdueTasks.length,
    }

    const allMilestones = milestones || []
    const milestonesSummary = {
      total: allMilestones.length,
      completed: allMilestones.filter(m => m.completed_at).length,
      upcoming: allMilestones
        .filter(m => !m.completed_at && m.due_date)
        .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))
        .slice(0, 3)
        .map(m => ({ name: m.name, due_date: m.due_date! })),
    }

    const allRisks = risks || []
    const risksSummary = {
      total: allRisks.length,
      high: allRisks.filter(r => r.level === 'high').length,
      mitigated: allRisks.filter(r => r.is_mitigated).length,
    }

    // Construir contenido del reporte
    const reportContent = {
      overview: `Proyecto "${project.name}" - Estado: ${project.status} - Progreso: ${project.progress}%`,
      progress: project.progress,
      tasks_summary: tasksSummary,
      milestones_summary: milestonesSummary,
      risks_summary: risksSummary,
      recent_activity: [],
    }

    // Intentar generar resumen con IA
    let aiSummary = ''
    let aiRecommendations: string[] = []

    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      const prompt = `Generá un reporte de estado para este proyecto:

Nombre: ${project.name}
Descripción: ${project.description || 'No especificada'}
Estado: ${project.status}
Progreso: ${project.progress}%
Fecha inicio: ${project.start_date || 'No definida'}
Fecha fin: ${project.end_date || 'No definida'}

Tareas: ${tasksSummary.total} total, ${tasksSummary.completed} completadas, ${tasksSummary.in_progress} en progreso, ${tasksSummary.blocked} bloqueadas, ${tasksSummary.overdue} vencidas
Tareas vencidas: ${overdueTasks.map(t => `"${t.title}" (asignada a ${t.assignee?.full_name || 'nadie'})`).join(', ') || 'Ninguna'}

Hitos: ${milestonesSummary.total} total, ${milestonesSummary.completed} completados
Próximos hitos: ${milestonesSummary.upcoming.map(m => `"${m.name}" (${m.due_date})`).join(', ') || 'Ninguno'}

Riesgos: ${risksSummary.total} total, ${risksSummary.high} altos, ${risksSummary.mitigated} mitigados`

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices[0]?.message?.content
          try {
            const parsed = JSON.parse(content)
            aiSummary = parsed.summary
            aiRecommendations = parsed.recommendations
          } catch {}
        }
      } catch {}
    }

    // Fallback si no hay IA
    if (!aiSummary) {
      const parts = []
      parts.push(`El proyecto "${project.name}" se encuentra en estado ${project.status} con un avance del ${project.progress}%.`)

      if (tasksSummary.overdue > 0) {
        parts.push(`⚠️ Hay ${tasksSummary.overdue} tarea(s) vencida(s) que requieren atención inmediata.`)
      }
      if (tasksSummary.blocked > 0) {
        parts.push(`Hay ${tasksSummary.blocked} tarea(s) bloqueada(s) que podrían estar frenando el avance.`)
      }
      if (risksSummary.high > 0 && risksSummary.high > risksSummary.mitigated) {
        parts.push(`Existen ${risksSummary.high} riesgo(s) de nivel alto, de los cuales ${risksSummary.mitigated} están mitigados.`)
      }

      aiSummary = parts.join(' ')
      aiRecommendations = []
      if (tasksSummary.overdue > 0) aiRecommendations.push('Priorizar la resolución de tareas vencidas')
      if (tasksSummary.blocked > 0) aiRecommendations.push('Desbloquear las tareas trabadas identificando dependencias')
      if (project.progress < 50 && project.end_date) aiRecommendations.push('Revisar el cronograma y evaluar si es necesario ajustar fechas')
      aiRecommendations.push('Mantener actualizados los estados de las tareas para tener visibilidad real')
    }

    // Guardar reporte
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        project_id,
        type: 'on_demand',
        title: `Reporte de Estado - ${new Date().toLocaleDateString('es-AR')}`,
        content: reportContent,
        ai_summary: aiSummary,
        ai_recommendations: aiRecommendations,
        generated_by: user.id,
      })
      .select()
      .single()

    if (reportError) throw reportError

    // Log
    await supabase.from('activity_log').insert({
      project_id,
      user_id: user.id,
      action: 'generó un reporte de estado con IA',
      entity_type: 'report',
      entity_id: report.id,
    })

    return NextResponse.json({
      report: {
        ...report,
        ai_summary: aiSummary,
        ai_recommendations: aiRecommendations,
      },
    })
  } catch (error) {
    console.error('Error en generate-report:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
