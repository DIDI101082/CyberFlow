'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Project, Task } from '@/types'

const estadoStyle: Record<string, { bg: string; color: string }> = {
  planificado: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  en_curso: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  pausado: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  completado: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  cancelado: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  alta: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

const stats = [
  { label: 'Proyectos activos', key: 'activos', accent: '#3b82f6' },
  { label: 'Tareas en curso', key: 'tareas', accent: '#10b981' },
  { label: 'Planificados', key: 'planificados', accent: '#f59e0b' },
  { label: 'Prioridad crítica', key: 'criticos', accent: '#ef4444' },
]

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const [allProjects, setAllProjects] = useState<Project[]>([])

  const fetchData = async () => {
    const [{ data: proj }, { data: task }, { data: allProj }] = await Promise.all([
      supabase.from('projects').select('*, area:areas(*)').order('created_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('*, project:projects(nombre)').eq('estado', 'en_curso').limit(5),
      supabase.from('projects').select('*').in('estado', ['en_curso', 'planificado']),
    ])
    setProjects(proj || [])
    setTasks(task || [])
    setAllProjects(allProj || [])
    setLoading(false)
  }

  const counts = {
    activos: allProjects.filter(p => p.estado === 'en_curso').length,
    tareas: tasks.length,
    planificados: allProjects.filter(p => p.estado === 'planificado').length,
    criticos: allProjects.filter(p => p.prioridad === 'critica').length,
  }

  const ragCounts = {
    verde:    allProjects.filter(p => (p as any).rag_status === 'verde' || !(p as any).rag_status).length,
    amarillo: allProjects.filter(p => (p as any).rag_status === 'amarillo').length,
    rojo:     allProjects.filter(p => (p as any).rag_status === 'rojo').length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Resumen general de proyectos y tareas</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            {stats.map(({ label, key, accent }) => (
              <div key={key} style={{
                backgroundColor: '#161b22',
                border: '1px solid #21262d',
                borderRadius: '12px',
                padding: '20px',
              }}>
                <p style={{ color: '#8b949e', fontSize: '13px', margin: '0 0 12px' }}>{label}</p>
                <p style={{ color: accent, fontSize: '32px', fontWeight: '700', margin: 0 }}>
                  {loading ? '–' : counts[key as keyof typeof counts]}
                </p>
              </div>
            ))}
          </div>

          {/* RAG Semáforos */}
          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>Estado del portfolio</h2>
              <Link href="/portfolio" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>Ver portfolio →</Link>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {([['verde','#22c55e','#34d399','En tiempo'],['amarillo','#eab308','#fbbf24','En riesgo'],['rojo','#ef4444','#f87171','Con desvío']] as const).map(([key, dot, color, label]) => (
                <div key={key} style={{ flex: 1, backgroundColor: '#0d1117', border: `1px solid ${dot}25`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}` }} />
                  <div>
                    <p style={{ color: color, fontSize: '22px', fontWeight: '700', margin: '0 0 1px' }}>{loading ? '–' : ragCounts[key as keyof typeof ragCounts]}</p>
                    <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Proyectos recientes */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>Proyectos recientes</h2>
                <Link href="/projects" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>Ver todos →</Link>
              </div>
              {loading ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
              ) : projects.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay proyectos aún</p>
              ) : (
                <div>
                  {projects.map(p => {
                    const es = estadoStyle[p.estado] || estadoStyle.planificado
                    const ps = prioridadStyle[p.prioridad] || prioridadStyle.baja
                    return (
                      <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 8px', borderRadius: '8px', marginBottom: '2px',
                          cursor: 'pointer',
                        }}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                            <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{(p as any).area?.nombre || 'Sin área'}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: es.bg, color: es.color }}>
                              {p.estado.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color }}>
                              {p.prioridad}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tareas en curso */}
            <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>Tareas en curso</h2>
                <Link href="/tasks" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none' }}>Ver todas →</Link>
              </div>
              {loading ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
              ) : tasks.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay tareas en curso</p>
              ) : (
                <div>
                  {tasks.map(t => {
                    const ps = prioridadStyle[t.prioridad] || prioridadStyle.baja
                    return (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 8px', borderRadius: '8px', marginBottom: '2px',
                      }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                          <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</p>
                          <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{(t as any).project?.nombre}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color, flexShrink: 0 }}>
                          {t.prioridad}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
