import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId')
    const format = request.nextUrl.searchParams.get('format') || 'csv'
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const supabase = await createClient()

    const [projectRes, tasksRes, milestonesRes, membersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*, assigned:profiles!tasks_assigned_to_fkey(full_name)').eq('project_id', projectId).order('created_at'),
      supabase.from('milestones').select('*').eq('project_id', projectId),
      supabase.from('project_members').select('*, profile:profiles(full_name, role)').eq('project_id', projectId),
    ])

    const project = projectRes.data
    const tasks = tasksRes.data || []
    const milestones = milestonesRes.data || []
    const members = membersRes.data || []

    if (format === 'csv') {
      const header = 'Tarea,Estado,Prioridad,Asignado,Fecha Inicio,Fecha Límite,Hito\n'
      const rows = tasks.map((t: Record<string, unknown>) => {
        const assigned = t.assigned as Record<string, unknown> | null
        return `"${(t.title as string || '').replace(/"/g, '""')}","${t.status}","${t.priority}","${assigned?.full_name || 'Sin asignar'}","${t.start_date || ''}","${t.due_date || ''}","${t.milestone_id || ''}"`
      }).join('\n')

      return new NextResponse(header + rows, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${project?.name || 'reporte'}_tareas.csv"`,
        },
      })
    }

    // HTML report (can be printed as PDF from browser)
    const now = new Date()
    const overdue = tasks.filter((t: Record<string, unknown>) => t.status !== 'completed' && t.due_date && new Date(t.due_date as string) < now)
    const completed = tasks.filter((t: Record<string, unknown>) => t.status === 'completed')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte — ${project?.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; max-width: 900px; margin: auto; }
    h1 { font-size: 24px; color: #0f3460; margin-bottom: 4px; }
    h2 { font-size: 16px; color: #0f3460; margin: 24px 0 12px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; }
    .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #0f3460; }
    .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { background: #0f3460; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f8f9fa; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .badge-completed { background: #d4edda; color: #155724; }
    .badge-in_progress { background: #cce5ff; color: #004085; }
    .badge-pending { background: #e2e3e5; color: #383d41; }
    .badge-blocked { background: #f8d7da; color: #721c24; }
    .badge-review { background: #fff3cd; color: #856404; }
    .badge-critical { background: #f8d7da; color: #721c24; }
    .badge-high { background: #ffe0cc; color: #8b4513; }
    .badge-medium { background: #fff3cd; color: #856404; }
    .badge-low { background: #d4edda; color: #155724; }
    .overdue { color: #dc3545; font-weight: 600; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>📊 Reporte del Proyecto: ${project?.name}</h1>
  <p class="subtitle">Generado el ${now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — CyberFlow by Accusys Technology</p>

  <div class="stats">
    <div class="stat"><div class="stat-value">${tasks.length}</div><div class="stat-label">Total Tareas</div></div>
    <div class="stat"><div class="stat-value">${completed.length}</div><div class="stat-label">Completadas</div></div>
    <div class="stat"><div class="stat-value">${overdue.length}</div><div class="stat-label">Vencidas</div></div>
    <div class="stat"><div class="stat-value">${project?.progress || 0}%</div><div class="stat-label">Progreso</div></div>
  </div>

  <h2>📋 Tareas</h2>
  <table>
    <thead><tr><th>Tarea</th><th>Estado</th><th>Prioridad</th><th>Asignado</th><th>Fecha Límite</th></tr></thead>
    <tbody>
      ${tasks.map((t: Record<string, unknown>) => {
        const assigned = t.assigned as Record<string, unknown> | null
        const isOverdue = t.status !== 'completed' && t.due_date && new Date(t.due_date as string) < now
        return `<tr>
          <td>${t.title}</td>
          <td><span class="badge badge-${t.status}">${(t.status as string).replace('_', ' ')}</span></td>
          <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
          <td>${assigned?.full_name || '—'}</td>
          <td class="${isOverdue ? 'overdue' : ''}">${t.due_date ? new Date(t.due_date as string).toLocaleDateString('es-AR') : '—'}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  ${milestones.length > 0 ? `
  <h2>🏁 Hitos</h2>
  <table>
    <thead><tr><th>Hito</th><th>Estado</th><th>Fecha</th></tr></thead>
    <tbody>
      ${milestones.map((m: Record<string, unknown>) => `<tr>
        <td>${m.title}</td>
        <td>${m.is_completed ? '✅ Completado' : '⏳ Pendiente'}</td>
        <td>${m.due_date ? new Date(m.due_date as string).toLocaleDateString('es-AR') : '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <h2>👥 Equipo</h2>
  <table>
    <thead><tr><th>Nombre</th><th>Rol</th></tr></thead>
    <tbody>
      ${members.map((m: Record<string, unknown>) => {
        const profile = m.profile as Record<string, unknown>
        return `<tr><td>${profile?.full_name}</td><td>${profile?.role}</td></tr>`
      }).join('')}
    </tbody>
  </table>

  <div class="footer">CyberFlow — Accusys Technology &copy; ${now.getFullYear()}</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('Report export error:', error)
    return NextResponse.json({ error: 'Error generating report' }, { status: 500 })
  }
}
