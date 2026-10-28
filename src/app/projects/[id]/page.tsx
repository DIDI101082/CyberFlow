'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Project, Task } from '@/types'

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
  planificado: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Planificado' },
  en_curso: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'En curso' },
  pausado: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Pausado' },
  completado: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Completado' },
  cancelado: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Cancelado' },
}
const estadoTareaStyle: Record<string, { bg: string; color: string; label: string }> = {
  pendiente: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Pendiente' },
  en_curso: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'En curso' },
  bloqueada: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Bloqueada' },
  completada: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Completada' },
}
const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  alta: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchProject()
  }, [id])

  const fetchProject = async () => {
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      supabase.from('projects').select('*, area:areas(*)').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('orden'),
    ])
    setProject(proj)
    setTasks(taskData || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      </main>
    </div>
  )

  if (!project) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>Proyecto no encontrado</p>
          <Link href="/projects" style={{ color: '#3b82f6', fontSize: '14px' }}>← Volver a proyectos</Link>
        </div>
      </main>
    </div>
  )

  const es = estadoStyle[project.estado] || estadoStyle.planificado
  const ps = prioridadStyle[project.prioridad] || prioridadStyle.baja
  const completadas = tasks.filter(t => t.estado === 'completada').length
  const progreso = tasks.length > 0 ? Math.round((completadas / tasks.length) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Back */}
          <Link href="/projects" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            ← Proyectos
          </Link>

          {/* Header */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, flex: 1, marginRight: '16px' }}>{project.nombre}</h1>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: es.bg, color: es.color }}>{es.label}</span>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color }}>{project.prioridad}</span>
              </div>
            </div>

            {project.descripcion && (
              <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px', lineHeight: '1.6' }}>{project.descripcion}</p>
            )}

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Área</p>
                <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{(project as any).area?.nombre || 'Sin área'}</p>
              </div>
              {project.fecha_inicio && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Inicio</p>
                  <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{new Date(project.fecha_inicio).toLocaleDateString('es-AR')}</p>
                </div>
              )}
              {project.fecha_fin_estimada && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Fin estimado</p>
                  <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{new Date(project.fecha_fin_estimada).toLocaleDateString('es-AR')}</p>
                </div>
              )}
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Progreso</p>
                <p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{completadas}/{tasks.length} tareas · {progreso}%</p>
              </div>
            </div>

            {tasks.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ height: '6px', backgroundColor: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progreso}%`, backgroundColor: '#3b82f6', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Tasks */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>
              Tareas <span style={{ color: '#6b7280', fontWeight: '400' }}>({tasks.length})</span>
            </h2>

            {tasks.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay tareas en este proyecto</p>
            ) : (
              <div>
                {tasks.map((t, i) => {
                  const ts = estadoTareaStyle[t.estado] || estadoTareaStyle.pendiente
                  const tps = prioridadStyle[t.prioridad] || prioridadStyle.baja
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', padding: '12px 8px',
                      borderBottom: i < tasks.length - 1 ? '1px solid #21262d' : 'none',
                    }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', border: '2px solid',
                        borderColor: t.estado === 'completada' ? '#34d399' : '#30363d',
                        backgroundColor: t.estado === 'completada' ? '#34d399' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginRight: '14px',
                      }}>
                        {t.estado === 'completada' && <span style={{ color: '#0d1117', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                        <p style={{ color: t.estado === 'completada' ? '#6b7280' : 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', textDecoration: t.estado === 'completada' ? 'line-through' : 'none' }}>{t.titulo}</p>
                        {t.fecha_vencimiento && (
                          <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: tps.bg, color: tps.color }}>{t.prioridad}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ts.bg, color: ts.color }}>{ts.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
