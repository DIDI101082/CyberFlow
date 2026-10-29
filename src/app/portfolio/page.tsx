'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Project } from '@/types'

const RAG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  verde:    { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  label: 'En tiempo',   dot: '#22c55e' },
  amarillo: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'En riesgo',   dot: '#eab308' },
  rojo:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  label: 'Con desvío',  dot: '#ef4444' },
}

const estadoLabel: Record<string, string> = {
  planificado: 'Planificado', en_curso: 'En curso', pausado: 'Pausado',
  completado: 'Completado', cancelado: 'Cancelado',
}

const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja:    { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  alta:    { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterArea, setFilterArea] = useState('todas')
  const [filterRAG, setFilterRAG] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('activos')
  const [areas, setAreas] = useState<{ id: string; nombre: string }[]>([])
  const [updatingRAG, setUpdatingRAG] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: proj }, { data: areaData }] = await Promise.all([
      supabase.from('projects').select('*, area:areas(*)').order('prioridad', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('areas').select('id, nombre').order('nombre'),
    ])
    setProjects(proj || [])
    setAreas(areaData || [])
    setLoading(false)
  }

  const handleRAGChange = async (projectId: string, rag: string) => {
    setUpdatingRAG(projectId)
    await supabase.from('projects').update({ rag_status: rag }).eq('id', projectId)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, rag_status: rag } as any : p))
    setUpdatingRAG(null)
  }

  const filtered = projects.filter(p => {
    const ragOk = filterRAG === 'todos' || (p as any).rag_status === filterRAG
    const areaOk = filterArea === 'todas' || (p as any).area_id === filterArea
    const estadoOk = filterEstado === 'todos'
      || (filterEstado === 'activos' && ['en_curso', 'planificado'].includes(p.estado))
      || p.estado === filterEstado
    return ragOk && areaOk && estadoOk
  })

  const counts = {
    verde: projects.filter(p => (p as any).rag_status === 'verde' && ['en_curso','planificado'].includes(p.estado)).length,
    amarillo: projects.filter(p => (p as any).rag_status === 'amarillo' && ['en_curso','planificado'].includes(p.estado)).length,
    rojo: projects.filter(p => (p as any).rag_status === 'rojo' && ['en_curso','planificado'].includes(p.estado)).length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Portfolio</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Vista ejecutiva de todos los proyectos</p>
          </div>

          {/* Semáforos resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {(['verde','amarillo','rojo'] as const).map(rag => {
              const r = RAG[rag]
              return (
                <div key={rag} style={{ backgroundColor: '#161b22', border: `1px solid ${r.color}30`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: r.dot, flexShrink: 0, boxShadow: `0 0 8px ${r.dot}` }} />
                  <div>
                    <p style={{ color: r.color, fontSize: '28px', fontWeight: '700', margin: '0 0 2px' }}>{counts[rag]}</p>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>{r.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Estado */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['activos','Activos'],['todos','Todos'],['completado','Completados']].map(([k, l]) => (
                <button key={k} onClick={() => setFilterEstado(k)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', backgroundColor: filterEstado === k ? '#1d4ed8' : 'rgba(255,255,255,0.06)', color: filterEstado === k ? 'white' : '#9ca3af' }}>{l}</button>
              ))}
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#21262d' }} />
            {/* RAG */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setFilterRAG('todos')} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', backgroundColor: filterRAG === 'todos' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color: filterRAG === 'todos' ? 'white' : '#9ca3af' }}>Todos</button>
              {(['verde','amarillo','rojo'] as const).map(rag => (
                <button key={rag} onClick={() => setFilterRAG(rag)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', border: 'none', cursor: 'pointer', backgroundColor: filterRAG === rag ? RAG[rag].bg : 'rgba(255,255,255,0.04)', color: filterRAG === rag ? RAG[rag].color : '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: RAG[rag].dot, display: 'inline-block' }} />{RAG[rag].label}
                </button>
              ))}
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#21262d' }} />
            {/* Área */}
            <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '6px 12px', color: '#9ca3af', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
              <option value="todas">Todas las áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          {/* Tabla de proyectos */}
          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>No hay proyectos con estos filtros</p>
          ) : (
            <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Cabecera */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 130px 110px 100px', gap: '0', padding: '10px 20px', borderBottom: '1px solid #21262d', backgroundColor: '#0d1117' }}>
                {['Proyecto','Área','Estado','Semáforo','Prioridad','Progreso'].map(h => (
                  <p key={h} style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
                ))}
              </div>

              {filtered.map((p, i) => {
                const rag = (p as any).rag_status || 'verde'
                const r = RAG[rag]
                const ps = prioridadStyle[p.prioridad] || prioridadStyle.baja
                // Progreso ficticio por ahora (sin tareas cargadas aquí)
                return (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 120px 130px 110px 100px',
                    gap: '0', padding: '14px 20px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid #21262d' : 'none',
                  }}>
                    {/* Proyecto */}
                    <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                      <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 2px' }}>{p.nombre}</p>
                      {p.fecha_fin_estimada && <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Fin: {new Date(p.fecha_fin_estimada).toLocaleDateString('es-AR')}</p>}
                    </Link>

                    {/* Área */}
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{(p as any).area?.nombre || '—'}</p>

                    {/* Estado */}
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{estadoLabel[p.estado] || p.estado}</p>

                    {/* Semáforo RAG — clickeable */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['verde','amarillo','rojo'] as const).map(s => (
                        <button key={s} onClick={() => handleRAGChange(p.id, s)} disabled={updatingRAG === p.id} title={RAG[s].label} style={{
                          width: '22px', height: '22px', borderRadius: '50%', border: rag === s ? `2px solid ${RAG[s].dot}` : '2px solid transparent',
                          backgroundColor: rag === s ? RAG[s].dot : RAG[s].dot + '30',
                          cursor: 'pointer', padding: 0, transition: 'all 0.15s',
                          boxShadow: rag === s ? `0 0 6px ${RAG[s].dot}` : 'none',
                        }} />
                      ))}
                      <span style={{ color: r.color, fontSize: '11px', alignSelf: 'center', marginLeft: '2px' }}>{r.label}</span>
                    </div>

                    {/* Prioridad */}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color, display: 'inline-block' }}>{p.prioridad}</span>

                    {/* Progreso placeholder */}
                    <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', color: '#6b7280', fontSize: '12px' }}>
                      Ver →
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ color: '#374151', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
            {filtered.length} proyectos · Hacé clic en el semáforo para cambiar el estado RAG
          </p>
        </div>
      </main>
      <style>{`select option { background-color: #1c2333; color: white; }`}</style>
    </div>
  )
}
