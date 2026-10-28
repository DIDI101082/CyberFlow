'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { Task } from '@/types'

const estadoStyle: Record<string, { bg: string; color: string; label: string }> = {
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(nombre)')
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  const filtered = filter === 'todos' ? tasks : tasks.filter(t => t.estado === filter)

  const filters = [
    { key: 'todos', label: 'Todas' },
    { key: 'en_curso', label: 'En curso' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'bloqueada', label: 'Bloqueadas' },
    { key: 'completada', label: 'Completadas' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Mis Tareas</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{tasks.length} tareas en total</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none',
                backgroundColor: filter === f.key ? '#1d4ed8' : 'rgba(255,255,255,0.06)',
                color: filter === f.key ? 'white' : '#9ca3af',
              }}>{f.label}</button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>Cargando...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>No hay tareas</p>
          ) : (
            <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', overflow: 'hidden' }}>
              {filtered.map((t, i) => {
                const es = estadoStyle[t.estado] || estadoStyle.pendiente
                const ps = prioridadStyle[t.prioridad] || prioridadStyle.baja
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #21262d' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }}>{t.titulo}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{(t as any).project?.nombre || 'Sin proyecto'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {t.fecha_vencimiento && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color }}>{t.prioridad}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: es.bg, color: es.color }}>{es.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
