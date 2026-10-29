'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Area } from '@/types'

const inputStyle = {
  width: '100%',
  backgroundColor: '#111114',
  border: '1px solid #30363d',
  borderRadius: '8px',
  padding: '10px 14px',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  color: '#9ca3af',
  fontSize: '13px',
  marginBottom: '6px',
  display: 'block' as const,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    area_id: '',
    estado: 'planificado',
    prioridad: 'media',
    es_transversal: false,
    fecha_inicio: '',
    fecha_fin_estimada: '',
  })

  useEffect(() => {
    supabase.from('areas').select('*').order('nombre').then(({ data }) => setAreas(data || []))
  }, [])

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const payload: any = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        area_id: form.area_id || null,
        estado: form.estado,
        prioridad: form.prioridad,
        es_transversal: form.es_transversal,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin_estimada: form.fecha_fin_estimada || null,
        ...(user ? { created_by: user.id } : {}),
      }
      const { data, error: err } = await supabase.from('projects').insert([payload]).select().single()
      if (err) throw err
      router.push(`/projects/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear el proyecto')
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <Link href="/projects" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
            ← Proyectos
          </Link>

          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Nuevo proyecto</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Completá los datos del proyecto</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 20px' }}>Información general</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nombre <span style={{ color: '#f87171' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del proyecto"
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Descripción</label>
                  <textarea
                    placeholder="Descripción del proyecto..."
                    value={form.descripcion}
                    onChange={e => set('descripcion', e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Área</label>
                  <select value={form.area_id} onChange={e => set('area_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Sin área</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="planificado">Planificado</option>
                      <option value="en_curso">En curso</option>
                      <option value="pausado">Pausado</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Prioridad</label>
                    <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.es_transversal}
                      onChange={e => set('es_transversal', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#4f8ef7', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>Proyecto transversal (involucra múltiples áreas)</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 20px' }}>Fechas</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Fecha de inicio</label>
                  <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha estimada de fin</label>
                  <input type="date" value={form.fecha_fin_estimada} onChange={e => set('fecha_fin_estimada', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link href="/projects" style={{ textDecoration: 'none' }}>
                <button type="button" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: saving ? '#1e3a8a' : '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Creando...' : 'Crear proyecto'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        select option { background-color: #1c2333; color: white; }
        input::placeholder, textarea::placeholder { color: #4b5563; }
        input:focus, textarea:focus, select:focus { border-color: #3b82f6 !important; }
      `}</style>
    </div>
  )
}
