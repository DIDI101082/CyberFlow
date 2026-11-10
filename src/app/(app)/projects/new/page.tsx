'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Wand2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  ListChecks,
  Milestone as MilestoneIcon,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Area, WizardFormData, AIPlan, TaskPriority } from '@/lib/types'

const steps = [
  { id: 1, label: 'Información', icon: Target },
  { id: 2, label: 'Detalles', icon: ListChecks },
  { id: 3, label: 'IA Genera Plan', icon: Sparkles },
  { id: 4, label: 'Revisar & Crear', icon: CheckCircle2 },
]

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

const durations = [
  '1 semana',
  '2 semanas',
  '1 mes',
  '2 meses',
  '3 meses',
  '6 meses',
  'Más de 6 meses',
]

export default function NewProjectWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState<WizardFormData>({
    name: '',
    description: '',
    area_id: '',
    category: '',
    objectives: '',
    constraints: '',
    estimated_duration: '',
    team_size: '',
    priority: 'medium',
  })

  useEffect(() => {
    supabase.from('areas').select('*').then(({ data }) => {
      if (data) setAreas(data)
    })
  }, [])

  function updateForm(field: keyof WizardFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function generatePlan() {
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Error generando plan')

      const data = await res.json()
      setAiPlan(data.plan)
      setCurrentStep(4)
    } catch (err) {
      setError('Error al generar el plan con IA. Intentá de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  async function createProject() {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // 1. Crear proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: form.name,
          description: form.description,
          area_id: form.area_id || null,
          owner_id: user.id,
          status: 'planning',
          priority: form.priority,
          is_cross_area: false,
          ai_generated_plan: aiPlan,
          tags: [form.category],
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 2. Agregar owner como miembro
      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'lead',
      })

      // 3. Crear milestones y tareas del plan IA
      if (aiPlan) {
        for (let i = 0; i < aiPlan.milestones.length; i++) {
          const ms = aiPlan.milestones[i]

          const { data: milestone } = await supabase
            .from('milestones')
            .insert({
              project_id: project.id,
              name: ms.name,
              description: ms.description,
              sort_order: i,
            })
            .select()
            .single()

          if (milestone && ms.tasks) {
            for (let j = 0; j < ms.tasks.length; j++) {
              const task = ms.tasks[j]
              await supabase.from('tasks').insert({
                project_id: project.id,
                milestone_id: milestone.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                estimated_hours: task.estimated_hours,
                sort_order: j,
                ai_suggested: true,
              })
            }
          }
        }

        // 4. Crear riesgos
        if (aiPlan.risks) {
          for (const risk of aiPlan.risks) {
            await supabase.from('risks').insert({
              project_id: project.id,
              title: risk.title,
              description: risk.description,
              level: risk.level,
              mitigation: risk.mitigation,
              ai_suggested: true,
            })
          }
        }
      }

      // 5. Log de actividad
      await supabase.from('activity_log').insert({
        project_id: project.id,
        user_id: user.id,
        action: 'creó el proyecto con Wizard IA',
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

  function canAdvance() {
    if (currentStep === 1) return form.name && form.area_id && form.category
    if (currentStep === 2) return form.objectives
    return true
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Nuevo Proyecto con IA</h1>
            <p className="text-surface-500">El asistente genera automáticamente tareas, hitos y riesgos</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isDone = currentStep > step.id
          return (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex-1',
                isActive && 'bg-brand-50 text-brand-700 border border-brand-200',
                isDone && 'bg-emerald-50 text-emerald-700',
                !isActive && !isDone && 'text-surface-400'
              )}>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600' : 'text-surface-300')} />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-px w-6 shrink-0', isDone ? 'bg-emerald-300' : 'bg-surface-200')} />
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Información básica */}
      {currentStep === 1 && (
        <div className="card space-y-5">
          <h2 className="text-lg font-semibold">Información del Proyecto</h2>

          <div>
            <label className="label">Nombre del proyecto *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              placeholder="Ej: Pentesting App Web Q4 2024"
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
              <label className="label">Área *</label>
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
              <label className="label">Categoría *</label>
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

          <div>
            <label className="label">Prioridad</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateForm('priority', p)}
                  className={cn(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    form.priority === p
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {p === 'low' ? '↓ Baja' : p === 'medium' ? '→ Media' : p === 'high' ? '↑ Alta' : '⚡ Crítica'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Detalles para la IA */}
      {currentStep === 2 && (
        <div className="card space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Detalles para el Asistente IA</h2>
              <p className="text-sm text-surface-500">Cuanto más detalle le des, mejor será el plan generado</p>
            </div>
          </div>

          <div>
            <label className="label">Objetivos principales *</label>
            <textarea
              className="input min-h-[120px]"
              value={form.objectives}
              onChange={(e) => updateForm('objectives', e.target.value)}
              placeholder="¿Qué querés lograr con este proyecto? Ej: Evaluar la seguridad de la aplicación web corporativa, identificar vulnerabilidades OWASP Top 10, generar un reporte ejecutivo..."
            />
          </div>

          <div>
            <label className="label">Restricciones o consideraciones</label>
            <textarea
              className="input min-h-[80px]"
              value={form.constraints}
              onChange={(e) => updateForm('constraints', e.target.value)}
              placeholder="¿Hay algo que la IA deba tener en cuenta? Ej: Solo se puede hacer en horario no productivo, no se pueden hacer pruebas destructivas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duración estimada</label>
              <select
                className="input"
                value={form.estimated_duration}
                onChange={(e) => updateForm('estimated_duration', e.target.value)}
              >
                <option value="">Seleccioná</option>
                {durations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tamaño del equipo</label>
              <input
                className="input"
                value={form.team_size}
                onChange={(e) => updateForm('team_size', e.target.value)}
                placeholder="Ej: 3 personas"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generando */}
      {currentStep === 3 && (
        <div className="card text-center py-16">
          <div className="relative inline-flex mb-6">
            <div className="ai-pulse relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
              <Sparkles className="h-8 w-8 text-brand-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-surface-900 mb-2">
            {generating ? 'Generando tu plan de proyecto...' : 'Listo para generar'}
          </h2>
          <p className="text-surface-500 mb-6 max-w-md mx-auto">
            {generating
              ? 'La IA está analizando tu proyecto y creando un plan con tareas, hitos y riesgos identificados.'
              : 'Hacé clic para que la IA genere automáticamente el plan de tu proyecto.'}
          </p>
          {!generating && (
            <button onClick={generatePlan} className="btn-primary">
              <Sparkles className="w-4 h-4" />
              Generar Plan con IA
            </button>
          )}
          {generating && (
            <div className="ai-shimmer h-2 w-64 mx-auto rounded-full bg-surface-100" />
          )}
        </div>
      )}

      {/* Step 4: Revisar Plan */}
      {currentStep === 4 && aiPlan && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-2">Plan Generado por IA</h2>
            <p className="text-sm text-surface-500 mb-4">Revisá el plan y editá lo que necesites antes de crear el proyecto.</p>

            <div className="rounded-lg bg-brand-50 border border-brand-100 p-4 mb-4">
              <p className="text-sm font-medium text-brand-700 mb-1">Objetivo</p>
              <p className="text-sm text-brand-900">{aiPlan.objective}</p>
            </div>

            {aiPlan.scope && (
              <div className="rounded-lg bg-surface-50 border border-surface-200 p-4">
                <p className="text-sm font-medium text-surface-700 mb-1">Alcance</p>
                <p className="text-sm text-surface-600">{aiPlan.scope}</p>
              </div>
            )}
          </div>

          {/* Milestones y Tareas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <MilestoneIcon className="w-5 h-5 text-brand-600" />
              Hitos y Tareas ({aiPlan.milestones.length} hitos)
            </h3>

            <div className="space-y-4">
              {aiPlan.milestones.map((ms, i) => (
                <div key={i} className="border border-surface-200 rounded-lg overflow-hidden">
                  <div className="bg-surface-50 px-4 py-3 border-b border-surface-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-surface-900">
                        Hito {i + 1}: {ms.name}
                      </h4>
                      <span className="text-xs text-surface-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{ms.estimated_days} días
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-0.5">{ms.description}</p>
                  </div>
                  <div className="divide-y divide-surface-100">
                    {ms.tasks.map((task, j) => (
                      <div key={j} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-medium text-surface-500">
                          {j + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-surface-800">{task.title}</p>
                          <p className="text-xs text-surface-400">{task.description}</p>
                        </div>
                        <span className="text-xs text-surface-400">{task.estimated_hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Riesgos */}
          {aiPlan.risks && aiPlan.risks.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Riesgos Identificados ({aiPlan.risks.length})
              </h3>
              <div className="space-y-3">
                {aiPlan.risks.map((risk, i) => (
                  <div key={i} className={cn(
                    'rounded-lg border p-4',
                    risk.level === 'high' ? 'border-red-200 bg-red-50/50' :
                    risk.level === 'medium' ? 'border-amber-200 bg-amber-50/50' :
                    'border-surface-200 bg-surface-50'
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={cn('w-4 h-4',
                        risk.level === 'high' ? 'text-red-500' :
                        risk.level === 'medium' ? 'text-amber-500' :
                        'text-surface-400'
                      )} />
                      <span className="font-medium text-sm text-surface-900">{risk.title}</span>
                      <span className={cn('badge text-xs',
                        risk.level === 'high' ? 'bg-red-100 text-red-700' :
                        risk.level === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-surface-100 text-surface-600'
                      )}>
                        {risk.level === 'high' ? 'Alto' : risk.level === 'medium' ? 'Medio' : 'Bajo'}
                      </span>
                    </div>
                    <p className="text-sm text-surface-600">{risk.description}</p>
                    <p className="text-sm text-surface-500 mt-1">
                      <span className="font-medium">Mitigación:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {aiPlan.recommendations && aiPlan.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-surface-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                Recomendaciones de la IA
              </h3>
              <ul className="space-y-2">
                {aiPlan.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-600">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </button>

        {currentStep < 3 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canAdvance()}
            className="btn-primary"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {currentStep === 2 && (
          <button
            onClick={() => {
              setCurrentStep(3)
              setTimeout(generatePlan, 500)
            }}
            disabled={!canAdvance()}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4" />
            Generar Plan con IA
          </button>
        )}

        {currentStep === 4 && (
          <button onClick={createProject} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Creando...' : 'Crear Proyecto'}
          </button>
        )}
      </div>
    </div>
  )
}
