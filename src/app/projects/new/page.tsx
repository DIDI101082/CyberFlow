'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Area, Tag } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<Area[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    area_id: '',
    estado: 'planificado',
    prioridad: 'media',
    fecha_inicio: '',
    fecha_fin_estimada: '',
    es_transversal: false,
    selectedTags: [] as string[],
  })

  useEffect(() => {
    Promise.all([
      supabase.from('areas').select('*').order('nombre'),
      supabase.from('tags').select('*').order('nombre'),
    ]).then(([{ data: a }, { data: t }]) => {
      setAreas(a || [])
      setTags(t || [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          area_id: form.area_id || null,
          estado: form.estado,
          prioridad: form.prioridad,
          fecha_inicio: form.fecha_inicio || null,
          fecha_fin_estimada: form.fecha_fin_estimada || null,
          es_transversal: form.es_transversal,
        })
        .select()
        .single()

      if (error) throw error

      // Agregar tags
      if (form.selectedTags.length > 0 && project) {
        await supabase.from('project_tags').insert(
          form.selectedTags.map(tag_id => ({ project_id: project.id, tag_id }))
        )
      }

      router.push(`/projects/${project?.id}`)
    } catch (err) {
      console.error(err)
      alert('Error al crear el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(t => t !== tagId)
        : [...prev.selectedTags, tagId],
    }))
  }

  const inputClass = "w-full bg-[#0f1117] border border-[#2d3748] text-white placeholder-gray-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5"

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/projects" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Nuevo proyecto</h1>
              <p className="text-gray-400 text-sm">Completá los datos del proyecto</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-white mb-3">Información general</h2>

              <div>
                <label className={labelClass}>Nombre *</label>
                <input
                  required
                  type="text"
                  placeholder="Nombre del proyecto"
                  value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Descripción del proyecto..."
                  value={form.descripcion}
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  className={inputClass + ' resize-none'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Área</label>
                  <select
                    value={form.area_id}
                    onChange={e => setForm(p => ({ ...p, area_id: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Sin área</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="planificado">Planificado</option>
                    <option value="en_curso">En curso</option>
                    <option value="pausado">Pausado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm(p => ({ ...p, prioridad: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={form.es_transversal}
                      onChange={e => setForm(p => ({ ...p, es_transversal: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-600 bg-[#0f1117] text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Proyecto transversal</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fecha de inicio</label>
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha estimada de fin</label>
                  <input
                    type="date"
                    value={form.fecha_fin_estimada}
                    onChange={e => setForm(p => ({ ...p, fecha_fin_estimada: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-5">
                <h2 className="font-semibold text-white mb-3">Etiquetas</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.selectedTags.includes(tag.id)
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-[#2d3748] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {tag.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <Link
                href="/projects"
                className="flex-1 text-center border border-[#2d3748] text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Crear proyecto'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
