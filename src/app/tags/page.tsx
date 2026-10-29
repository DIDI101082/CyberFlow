'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { Tag } from '@/types'

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState({ nombre: '', color: '#4f8ef7' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTags() }, [])

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('nombre')
    setTags(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.nombre.trim()) return
    setSaving(true)
    await supabase.from('tags').insert([{ nombre: newTag.nombre.trim(), color: newTag.color }])
    setNewTag({ nombre: '', color: '#4f8ef7' })
    await fetchTags()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('tags').delete().eq('id', id)
    setTags(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Etiquetas</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Gestioná las etiquetas para clasificar proyectos y tareas</p>
          </div>

          {/* Create form */}
          <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>Nueva etiqueta</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nombre de la etiqueta"
                value={newTag.nombre}
                onChange={e => setNewTag(p => ({ ...p, nombre: e.target.value }))}
                style={{ flex: 1, backgroundColor: '#111114', border: '1px solid #30363d', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }}
              />
              <input
                type="color"
                value={newTag.color}
                onChange={e => setNewTag(p => ({ ...p, color: e.target.value }))}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <button type="submit" disabled={saving} style={{ backgroundColor: '#1a5ce8', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {saving ? '...' : 'Crear'}
              </button>
            </form>
          </div>

          {/* Tags list */}
          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Cargando...</p>
          ) : tags.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay etiquetas aún</p>
          ) : (
            <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', overflow: 'hidden' }}>
              {tags.map((tag, i) => (
                <div key={tag.id} style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px',
                  borderBottom: i < tags.length - 1 ? '1px solid #21262d' : 'none',
                }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: tag.color, marginRight: '12px', flexShrink: 0 }} />
                  <span style={{ color: 'white', fontSize: '14px', flex: 1 }}>{tag.nombre}</span>
                  <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', backgroundColor: tag.color + '25', color: tag.color, marginRight: '12px' }}>
                    {tag.nombre}
                  </span>
                  <button onClick={() => handleDelete(tag.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
