'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Project } from '@/types'

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
  planificado: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Planificado' },
  en_curso: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'En curso' },
  pausado: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Pausado' },
  completado: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Completado' },
  cancelado: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Cancelado' },
}
const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  alta: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, area:areas(*)')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = filter === 'todos' ? projects : projects.filter(p => p.estado === filter)

  const filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'en_curso', label: 'En curso' },
    { key: 'planificado', label: 'Planificados' },
    { key: 'pausado', label: 'Pausados' },
    { key: 'completado', label: 'Completados' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Proyectos</h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{projects.length} proyectos en total</p>
            </div>
            <Link href="/projects/new" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + Nuevo proyecto
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none',
                backgroundColor: filter === f.key ? '#1a5ce8' : 'rgba(255,255,255,0.06)',
                color: filter === f.key ? 'white' : '#9ca3af',
              }}>{f.label}</button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>No hay proyectos</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filtered.map(p => {
                const es = estadoStyle[p.estado] || estadoStyle.planificado
                const ps = prioridadStyle[p.prioridad] || prioridadStyle.baja
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', padding: '20px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0, flex: 1, marginRight: '8px' }}>{p.nombre}</h3>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: es.bg, color: es.color }}>{es.label}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color }}>{p.prioridad}</span>
                        </div>
                      </div>
                      {p.descripcion && (
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{p.descripcion}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                          {(p as any).area?.nombre || 'Sin área'}
                        </span>
                        {p.fecha_fin_estimada && (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            hasta {new Date(p.fecha_fin_estimada).toLocaleDateString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
