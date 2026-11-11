'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Area, TaskPriority, ProjectStatus } from '@/lib/types'

const categories = [
  'Pentesting / Hacking Ético',
  'Hardening',
  'Migración',
  'Implementación',
  'Auditoría',
  'Infraestructura',
  'Desarrollo',
  'Otro',
]

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: '📋 Planificación' },
  { value: 'in_progress', label: '▶️ Activo' },
  { value: 'on_hold', label: '⏸️ En pausa' },
  { value: 'completed', label: '✅ Completado' },
]

export default function NewProjectManual() {
  const router = useRouter()
  const supabase = createClient()
  const [areas, setAreas] = useState<Area[]>([])
  const [members, setMembers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    area_id: '',
    category: '',
    priority: 'medium' as TaskPriority,
    status: 'planning' as ProjectStatus,
    start_date: '',
    end_date: '',
    progress: 0,
    tags: '',
  })

  useEffect(() => {
    supabase.from('areas').select('*').then(({ data }) => {
      if (data) setAreas(data)
    })
    supabase.from('profiles').select('id, full_name, email').then(({ data }) => {
      if (data) setMembers(data)
    })
  }, [])

  function updateForm(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) {
      setError('El nombre del proyecto es obligatorio')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : form.category ? [form.category] : []

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: form.name,
          description: form.description || null,
          area_id: form.area_id || null,
          owner_id: user.id,
          status: form.status,
          priority: form.priority,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          progress: form.progress,
          is_cross_area: false,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Agregar owner como lead
      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'lead',
      })

      // Log de actividad
      await supabase.from('activity_log').insert({
        project_id: project.id,
        user_id: user.id,
        action: 'creó el proyecto manualmente',
        entity_type: 'project',
        entity_id: project.id,
      })

      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Error al crear el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-600">
            <Save className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Nuevo Proyecto</h1>
            <p className="text-surface-500">Completá los datos del proyecto manualmente</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-surface-900">Información General</h2>

          <div>
            <label className="label">Nombre del proyecto *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="Ej: Migración Windows 11 - Fase 2"
            />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input min-h-[100px]"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              placeholder="Describí brevemente de qué se trata el proyecto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Área</label>
              <select
                className="input"
                value={form.area_id}
                onChange={(e) => updateForm('area_id', e.target.value)}
              >
                <option value="">Seleccioná un área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
              >
                <option value="">Seleccioná una categoría</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estado y prioridad */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-surface-900">Estado y Prioridad</h2>

          <div>
            <label className="label">Estado</label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateForm('status', s.value)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    form.status === s.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Prioridad</label>
            <div className="flex gap-2">
              {([
                { value: 'low', label: '↓ Baja' },
                { value: 'medium', label: '→ Media' },
                { value: 'high', label: '↑ Alta' },
                { value: 'critical', label: '⚡ Crítica' },
              ] as { value: TaskPriority; label: string }[]).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateForm('priority', p.value)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    form.priority === p.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Progreso: {form.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={(e) => updateForm('progress', parseInt(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        {/* Fechas */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-surface-400" />
            Fechas
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de inicio</label>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(e) => updateForm('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fecha de fin estimada</label>
              <input
                type="date"
                className="input"
                value={form.end_date}
                onChange={(e) => updateForm('end_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold text-surface-900">Etiquetas</h2>
          <div>
            <label className="label">Tags (separados por coma)</label>
            <input
              className="input"
              value={form.tags}
              onChange={(e) => updateForm('tags', e.target.value)}
              placeholder="Ej: pentesting, web, Q4-2024"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !form.name}
            className="btn-primary"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </div>
  )
}
