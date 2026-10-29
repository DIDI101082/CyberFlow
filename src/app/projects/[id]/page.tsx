'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Project, Task, Area } from '@/types'

const ESTADO_PROYECTO = ['planificado', 'en_curso', 'pausado', 'completado', 'cancelado']
const PRIORIDAD = ['baja', 'media', 'alta', 'critica']
const ESTADO_TAREA = ['pendiente', 'en_curso', 'bloqueada', 'completada']

const estadoProyStyle: Record<string, { bg: string; color: string; label: string }> = {
  planificado: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Planificado' },
  en_curso:    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: 'En curso' },
  pausado:     { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: 'Pausado' },
  completado:  { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', label: 'Completado' },
  cancelado:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Cancelado' },
}
const estadoTareaStyle: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Pendiente' },
  en_curso:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: 'En curso' },
  bloqueada:  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', label: 'Bloqueada' },
  completada: { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', label: 'Completada' },
}
const prioridadStyle: Record<string, { bg: string; color: string }> = {
  baja:    { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  media:   { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
  alta:    { bg: 'rgba(249,115,22,0.15)',  color: '#fb923c' },
  critica: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
}

const input = {
  width: '100%', backgroundColor: '#111114', border: '1px solid #30363d',
  borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box' as const,
}
const sel = { ...input, cursor: 'pointer' }

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Nueva tarea
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({ titulo: '', descripcion: '', prioridad: 'media', fecha_vencimiento: '' })
  const [savingTask, setSavingTask] = useState(false)

  // Editar tarea
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskForm, setEditTaskForm] = useState<any>({})

  useEffect(() => { if (id) fetchAll() }, [id])

  const fetchAll = async () => {
    const [{ data: proj }, { data: taskData }, { data: areaData }] = await Promise.all([
      supabase.from('projects').select('*, area:areas(*)').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('project_id', id).order('orden'),
      supabase.from('areas').select('*').order('nombre'),
    ])
    setProject(proj)
    setTasks(taskData || [])
    setAreas(areaData || [])
    if (proj) setEditForm({
      nombre: proj.nombre,
      descripcion: proj.descripcion || '',
      area_id: proj.area_id || '',
      estado: proj.estado,
      prioridad: proj.prioridad,
      es_transversal: proj.es_transversal,
      fecha_inicio: proj.fecha_inicio || '',
      fecha_fin_estimada: proj.fecha_fin_estimada || '',
      rag_status: (proj as any).rag_status || 'verde',
      rag_nota: (proj as any).rag_nota || '',
    })
    setLoading(false)
  }

  const handleSaveProject = async () => {
    setSaving(true)
    const { error } = await supabase.from('projects').update({
      nombre: editForm.nombre,
      descripcion: editForm.descripcion || null,
      area_id: editForm.area_id || null,
      estado: editForm.estado,
      prioridad: editForm.prioridad,
      es_transversal: editForm.es_transversal,
      fecha_inicio: editForm.fecha_inicio || null,
      fecha_fin_estimada: editForm.fecha_fin_estimada || null,
      rag_status: editForm.rag_status || 'verde',
      rag_nota: editForm.rag_nota || null,
    }).eq('id', id)
    if (!error) { await fetchAll(); setEditMode(false) }
    setSaving(false)
  }

  const handleDeleteProject = async () => {
    setDeleting(true)
    await supabase.from('tasks').delete().eq('project_id', id)
    await supabase.from('projects').delete().eq('id', id)
    router.push('/projects')
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.titulo.trim()) return
    setSavingTask(true)
    await supabase.from('tasks').insert([{
      project_id: id,
      titulo: newTask.titulo.trim(),
      descripcion: newTask.descripcion.trim() || null,
      prioridad: newTask.prioridad,
      estado: 'pendiente',
      fecha_vencimiento: newTask.fecha_vencimiento || null,
      orden: tasks.length,
    }])
    setNewTask({ titulo: '', descripcion: '', prioridad: 'media', fecha_vencimiento: '' })
    setShowNewTask(false)
    await fetchAll()
    setSavingTask(false)
  }

  const handleToggleTask = async (task: Task) => {
    const nuevoEstado = task.estado === 'completada' ? 'pendiente' : 'completada'
    await supabase.from('tasks').update({ estado: nuevoEstado }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, estado: nuevoEstado } : t))
  }

  const handleSaveTask = async (taskId: string) => {
    await supabase.from('tasks').update({
      titulo: editTaskForm.titulo,
      descripcion: editTaskForm.descripcion || null,
      prioridad: editTaskForm.prioridad,
      estado: editTaskForm.estado,
      fecha_vencimiento: editTaskForm.fecha_vencimiento || null,
    }).eq('id', taskId)
    setEditingTask(null)
    await fetchAll()
  }

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task.id)
    setEditTaskForm({
      titulo: task.titulo,
      descripcion: task.descripcion || '',
      prioridad: task.prioridad,
      estado: task.estado,
      fecha_vencimiento: task.fecha_vencimiento || '',
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      </div>
    </div>
  )

  if (!project) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'white', fontSize: '18px', marginBottom: '8px' }}>Proyecto no encontrado</p>
          <Link href="/projects" style={{ color: '#4f8ef7', fontSize: '14px' }}>← Volver a proyectos</Link>
        </div>
      </div>
    </div>
  )

  const es = estadoProyStyle[project.estado] || estadoProyStyle.planificado
  const ps = prioridadStyle[project.prioridad] || prioridadStyle.baja
  const completadas = tasks.filter(t => t.estado === 'completada').length
  const progreso = tasks.length > 0 ? Math.round((completadas / tasks.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div>

          <Link href="/projects" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            ← Proyectos
          </Link>

          {/* ── HEADER DEL PROYECTO ── */}
          <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #222228', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            {!editMode ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0, flex: 1, marginRight: '16px' }}>{project.nombre}</h1>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: es.bg, color: es.color }}>{es.label}</span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', backgroundColor: ps.bg, color: ps.color }}>{project.prioridad}</span>
                    <button onClick={() => setEditMode(true)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', marginLeft: '8px' }}>
                      Editar
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {project.descripcion && <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 16px', lineHeight: '1.6' }}>{project.descripcion}</p>}

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div><p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Área</p><p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{(project as any).area?.nombre || 'Sin área'}</p></div>
                  {project.fecha_inicio && <div><p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Inicio</p><p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{new Date(project.fecha_inicio).toLocaleDateString('es-AR')}</p></div>}
                  {project.fecha_fin_estimada && <div><p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Fin estimado</p><p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{new Date(project.fecha_fin_estimada).toLocaleDateString('es-AR')}</p></div>}
                  <div><p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 2px' }}>Progreso</p><p style={{ color: 'white', fontSize: '13px', margin: 0 }}>{completadas}/{tasks.length} tareas · {progreso}%</p></div>
                </div>

                {/* RAG Semáforo */}
                {(() => {
                  const rag = (project as any).rag_status || 'verde'
                  const ragCfg: Record<string, { dot: string; color: string; label: string }> = {
                    verde:    { dot: '#22c55e', color: '#34d399', label: 'En tiempo' },
                    amarillo: { dot: '#eab308', color: '#fbbf24', label: 'En riesgo' },
                    rojo:     { dot: '#ef4444', color: '#f87171', label: 'Con desvío' },
                  }
                  const r = ragCfg[rag]
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', padding: '10px 14px', backgroundColor: r.dot + '10', borderRadius: '8px', border: `1px solid ${r.dot}30` }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: r.dot, boxShadow: `0 0 6px ${r.dot}` }} />
                      <span style={{ color: r.color, fontSize: '13px', fontWeight: '600' }}>Semáforo: {r.label}</span>
                      {(project as any).rag_nota && <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>— {(project as any).rag_nota}</span>}
                    </div>
                  )
                })()}

                {tasks.length > 0 && (
                  <div style={{ marginTop: '16px', height: '6px', backgroundColor: '#222228', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progreso}%`, backgroundColor: '#4f8ef7', borderRadius: '3px' }} />
                  </div>
                )}
              </>
            ) : (
              /* ── FORMULARIO EDICIÓN ── */
              <div>
                <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 20px' }}>Editar proyecto</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nombre</label>
                    <input type="text" value={editForm.nombre} onChange={e => setEditForm((p: any) => ({ ...p, nombre: e.target.value }))} style={input} />
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Descripción</label>
                    <textarea value={editForm.descripcion} onChange={e => setEditForm((p: any) => ({ ...p, descripcion: e.target.value }))} rows={3} style={{ ...input, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Área</label>
                      <select value={editForm.area_id} onChange={e => setEditForm((p: any) => ({ ...p, area_id: e.target.value }))} style={sel}>
                        <option value="">Sin área</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Estado</label>
                      <select value={editForm.estado} onChange={e => setEditForm((p: any) => ({ ...p, estado: e.target.value }))} style={sel}>
                        {ESTADO_PROYECTO.map(s => <option key={s} value={s}>{estadoProyStyle[s].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Prioridad</label>
                      <select value={editForm.prioridad} onChange={e => setEditForm((p: any) => ({ ...p, prioridad: e.target.value }))} style={sel}>
                        {PRIORIDAD.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Fecha inicio</label>
                      <input type="date" value={editForm.fecha_inicio} onChange={e => setEditForm((p: any) => ({ ...p, fecha_inicio: e.target.value }))} style={{ ...input, colorScheme: 'dark' }} />
                    </div>
                    <div>
                      <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Fecha fin estimada</label>
                      <input type="date" value={editForm.fecha_fin_estimada} onChange={e => setEditForm((p: any) => ({ ...p, fecha_fin_estimada: e.target.value }))} style={{ ...input, colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.es_transversal} onChange={e => setEditForm((p: any) => ({ ...p, es_transversal: e.target.checked }))} style={{ accentColor: '#4f8ef7' }} />
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>Proyecto transversal</span>
                  </label>
                  {/* RAG */}
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Semáforo RAG</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {[['verde','#22c55e','En tiempo'],['amarillo','#eab308','En riesgo'],['rojo','#ef4444','Con desvío']].map(([v, dot, lbl]) => (
                        <button key={v} type="button" onClick={() => setEditForm((p: any) => ({ ...p, rag_status: v }))} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', border: editForm.rag_status === v ? `2px solid ${dot}` : '2px solid transparent', backgroundColor: editForm.rag_status === v ? dot + '20' : 'rgba(255,255,255,0.04)', color: editForm.rag_status === v ? dot : '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dot, display: 'inline-block' }} />{lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nota RAG (opcional)</label>
                    <input type="text" placeholder="Ej: pendiente aprobación cliente" value={editForm.rag_nota} onChange={e => setEditForm((p: any) => ({ ...p, rag_nota: e.target.value }))} style={input} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button onClick={() => setEditMode(false)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleSaveProject} disabled={saving} style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              </div>
            )}
          </div>

          {/* ── TAREAS ── */}
          <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #222228', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                Tareas <span style={{ color: '#6b7280', fontWeight: '400' }}>({tasks.length})</span>
              </h2>
              <button onClick={() => setShowNewTask(!showNewTask)} style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                + Nueva tarea
              </button>
            </div>

            {/* Formulario nueva tarea */}
            {showNewTask && (
              <form onSubmit={handleAddTask} style={{ backgroundColor: '#111114', border: '1px solid #30363d', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" required placeholder="Título de la tarea *" value={newTask.titulo} onChange={e => setNewTask(p => ({ ...p, titulo: e.target.value }))} style={input} />
                  <textarea placeholder="Descripción (opcional)" value={newTask.descripcion} onChange={e => setNewTask(p => ({ ...p, descripcion: e.target.value }))} rows={2} style={{ ...input, resize: 'vertical' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Prioridad</label>
                      <select value={newTask.prioridad} onChange={e => setNewTask(p => ({ ...p, prioridad: e.target.value }))} style={sel}>
                        {PRIORIDAD.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Fecha de vencimiento</label>
                      <input type="date" value={newTask.fecha_vencimiento} onChange={e => setNewTask(p => ({ ...p, fecha_vencimiento: e.target.value }))} style={{ ...input, colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowNewTask(false)} style={{ backgroundColor: 'transparent', color: '#6b7280', border: 'none', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                    <button type="submit" disabled={savingTask} style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{savingTask ? 'Guardando...' : 'Agregar tarea'}</button>
                  </div>
                </div>
              </form>
            )}

            {tasks.length === 0 && !showNewTask ? (
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay tareas — hacé clic en "+ Nueva tarea" para agregar</p>
            ) : (
              <div>
                {tasks.map((t, i) => {
                  const ts = estadoTareaStyle[t.estado] || estadoTareaStyle.pendiente
                  const tps = prioridadStyle[t.prioridad] || prioridadStyle.baja
                  const isEditing = editingTask === t.id

                  return (
                    <div key={t.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #222228' : 'none' }}>
                      {!isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', gap: '12px' }}>
                          {/* Checkbox */}
                          <button onClick={() => handleToggleTask(t)} style={{
                            width: '20px', height: '20px', borderRadius: '50%', border: '2px solid',
                            borderColor: t.estado === 'completada' ? '#34d399' : '#4b5563',
                            backgroundColor: t.estado === 'completada' ? '#34d399' : 'transparent',
                            flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {t.estado === 'completada' && <span style={{ color: '#111114', fontSize: '10px', fontWeight: '700' }}>✓</span>}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: t.estado === 'completada' ? '#6b7280' : 'white', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', textDecoration: t.estado === 'completada' ? 'line-through' : 'none' }}>{t.titulo}</p>
                            {t.descripcion && <p style={{ color: '#6b7280', fontSize: '11px', margin: '0 0 2px' }}>{t.descripcion}</p>}
                            {t.fecha_vencimiento && <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}</p>}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: tps.bg, color: tps.color }}>{t.prioridad}</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ts.bg, color: ts.color }}>{ts.label}</span>
                            <button onClick={() => startEditTask(t)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>✎</button>
                            <button onClick={() => handleDeleteTask(t.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', padding: '4px 6px', borderRadius: '6px' }}>×</button>
                          </div>
                        </div>
                      ) : (
                        /* Edición inline de tarea */
                        <div style={{ padding: '12px 8px', backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" value={editTaskForm.titulo} onChange={e => setEditTaskForm((p: any) => ({ ...p, titulo: e.target.value }))} style={input} />
                            <textarea value={editTaskForm.descripcion} onChange={e => setEditTaskForm((p: any) => ({ ...p, descripcion: e.target.value }))} rows={2} style={{ ...input, resize: 'vertical' }} placeholder="Descripción" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ color: '#6b7280', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Estado</label>
                                <select value={editTaskForm.estado} onChange={e => setEditTaskForm((p: any) => ({ ...p, estado: e.target.value }))} style={sel}>
                                  {ESTADO_TAREA.map(s => <option key={s} value={s}>{estadoTareaStyle[s].label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ color: '#6b7280', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Prioridad</label>
                                <select value={editTaskForm.prioridad} onChange={e => setEditTaskForm((p: any) => ({ ...p, prioridad: e.target.value }))} style={sel}>
                                  {PRIORIDAD.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ color: '#6b7280', fontSize: '11px', display: 'block', marginBottom: '3px' }}>Vencimiento</label>
                                <input type="date" value={editTaskForm.fecha_vencimiento} onChange={e => setEditTaskForm((p: any) => ({ ...p, fecha_vencimiento: e.target.value }))} style={{ ...input, colorScheme: 'dark' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingTask(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '13px', padding: '6px 12px' }}>Cancelar</button>
                              <button onClick={() => handleSaveTask(t.id)} style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Guardar</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── MODAL ELIMINAR PROYECTO ── */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #222228', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>¿Eliminar proyecto?</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>
              Se eliminará <strong style={{ color: 'white' }}>{project.nombre}</strong> y todas sus tareas. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleDeleteProject} disabled={deleting} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{deleting ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      </div>
      </main>
      <style>{`
        select option { background-color: #111114; color: white; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        input:focus, textarea:focus, select:focus { border-color: #4f8ef7 !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      `}</style>
    </div>
  )
}
