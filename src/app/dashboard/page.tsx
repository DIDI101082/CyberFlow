'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Project, Task } from '@/types'

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
  planificado: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Planificado' },
  en_curso:    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: 'En curso' },
  pausado:     { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: 'Pausado' },
  completado:  { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', label: 'Completado' },
  cancelado:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Cancelado' },
}
const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja:    { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  alta:    { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: { user: u } }, { data: proj }, { data: task }, { data: allProj }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('projects').select('*, area:areas(*)').order('created_at', { ascending: false }).limit(6),
      supabase.from('tasks').select('*, project:projects(nombre)').eq('estado', 'en_curso').limit(5),
      supabase.from('projects').select('*').in('estado', ['en_curso', 'planificado']),
    ])
    setUser(u)
    setProjects(proj || [])
    setTasks(task || [])
    setAllProjects(allProj || [])
    setLoading(false)
  }

  const now = new Date()
  const hora = now.getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const fechaStr = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  const counts = {
    activos:     allProjects.filter(p => p.estado === 'en_curso').length,
    planificados: allProjects.filter(p => p.estado === 'planificado').length,
    criticos:    allProjects.filter(p => p.prioridad === 'critica').length,
    tareas:      tasks.length,
  }
  const ragCounts = {
    verde:    allProjects.filter(p => (p as any).rag_status === 'verde' || !(p as any).rag_status).length,
    amarillo: allProjects.filter(p => (p as any).rag_status === 'amarillo').length,
    rojo:     allProjects.filter(p => (p as any).rag_status === 'rojo').length,
  }

  const card = {
    backgroundColor: '#1a1a1f',
    border: '1px solid #222228',
    borderRadius: '14px',
    padding: '22px 24px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Saludo */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: '700', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {saludo}, {user?.email?.split('@')[0] || 'Alejandro'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)} · resumen general de proyectos
          </p>
        </div>

        {/* Stats principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Proyectos activos',   value: counts.activos,     color: '#4f8ef7' },
            { label: 'Tareas en curso',      value: counts.tareas,      color: '#34d399' },
            { label: 'Planificados',         value: counts.planificados, color: '#fbbf24' },
            { label: 'Prioridad crítica',    value: counts.criticos,    color: '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} style={card}>
              <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 10px', fontWeight: '500' }}>{label}</p>
              <p style={{ color, fontSize: '36px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1 }}>
                {loading ? '–' : value}
              </p>
              <div style={{ height: '3px', backgroundColor: '#222228', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: loading ? '0%' : `${Math.min((value / Math.max(allProjects.length, 1)) * 100, 100)}%`, backgroundColor: color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* RAG Portfolio */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>Estado del portfolio</h2>
            <Link href="/portfolio" style={{ color: '#4f8ef7', fontSize: '12px', textDecoration: 'none' }}>Ver portfolio →</Link>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {([
              ['verde',    '#22c55e', '#34d399', 'En tiempo'],
              ['amarillo', '#eab308', '#fbbf24', 'En riesgo'],
              ['rojo',     '#ef4444', '#f87171', 'Con desvío'],
            ] as const).map(([key, dot, color, label]) => (
              <div key={key} style={{ flex: 1, backgroundColor: '#111114', border: `1px solid ${dot}20`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}` }} />
                <div>
                  <p style={{ color, fontSize: '24px', fontWeight: '700', margin: '0 0 1px', lineHeight: 1 }}>{loading ? '–' : ragCounts[key as keyof typeof ragCounts]}</p>
                  <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dos columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          {/* Proyectos recientes */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>Proyectos recientes</h2>
              <Link href="/projects" style={{ color: '#4f8ef7', fontSize: '12px', textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            {loading ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
            ) : projects.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay proyectos</p>
            ) : (
              <div>
                {projects.map((p, i) => {
                  const es = estadoStyle[p.estado] || estadoStyle.planificado
                  const rag = (p as any).rag_status || 'verde'
                  const ragDot: Record<string, string> = { verde: '#22c55e', amarillo: '#eab308', rojo: '#ef4444' }
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                        borderBottom: i < projects.length - 1 ? '1px solid #1a1a1f' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ragDot[rag], flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                            <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{(p as any).area?.nombre || 'Sin área'}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: es.bg, color: es.color, flexShrink: 0 }}>{es.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tareas en curso */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>Tareas en curso</h2>
              <Link href="/tasks" style={{ color: '#4f8ef7', fontSize: '12px', textDecoration: 'none' }}>Ver todas →</Link>
            </div>
            {loading ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
            ) : tasks.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay tareas en curso</p>
            ) : (
              <div>
                {tasks.map((t, i) => {
                  const ps = prioridadStyle[t.prioridad] || prioridadStyle.baja
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                      borderBottom: i < tasks.length - 1 ? '1px solid #1a1a1f' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</p>
                        <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>{(t as any).project?.nombre}</p>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color, flexShrink: 0 }}>{t.prioridad}</span>
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
