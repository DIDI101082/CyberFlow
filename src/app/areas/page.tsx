'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { Area } from '@/types'

const COLORES = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16']

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#3b82f6' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAreas() }, [])

  const fetchAreas = async () => {
    const { data } = await supabase.from('areas').select('*').order('nombre')
    setAreas(data || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    if (editingId) {
      await supabase.from('areas').update({ nombre: form.nombre, descripcion: form.descripcion || null, color: form.color }).eq('id', editingId)
    } else {
      await supabase.from('areas').insert([{ nombre: form.nombre, descripcion: form.descripcion || null, color: form.color }])
    }
    setForm({ nombre: '', descripcion: '', color: '#3b82f6' })
    setShowForm(false)
    setEditingId(null)
    await fetchAreas()
    setSaving(false)
  }

  const handleEdit = (area: Area) => {
    setEditingId(area.id)
    setForm({ nombre: area.nombre, descripcion: area.descripcion || '', color: area.color })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área? Los proyectos asociados quedarán sin área.')) return
    await supabase.from('areas').delete().eq('id', id)
    setAreas(prev => prev.filter(a => a.id !== id))
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ nombre: '', descripcion: '', color: '#3b82f6' })
  }

  const inp = { width: '100%', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Áreas</h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Unidades organizativas de Accusys</p>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + Nueva área
              </button>
            )}
          </div>

          {/* Formulario */}
          {showForm && (
            <form onSubmit={handleSave} style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>{editingId ? 'Editar área' : 'Nueva área'}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                  <input type="text" required placeholder="Nombre del área" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Descripción</label>
                  <input type="text" placeholder="Descripción breve" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Color</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {COLORES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))} style={{
                        width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={handleCancel} style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{saving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear área'}</button>
              </div>
            </form>
          )}

          {/* Lista */}
          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>Cargando...</p>
          ) : areas.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0' }}>No hay áreas. Creá la primera.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {areas.map(area => (
                <div key={area.id} style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: area.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: area.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>{area.nombre}</p>
                    {area.descripcion && <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{area.descripcion}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(area)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => handleDelete(area.id)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>{`input::placeholder { color: #4b5563; } input:focus { border-color: #3b82f6 !important; }`}</style>
    </div>
  )
}
