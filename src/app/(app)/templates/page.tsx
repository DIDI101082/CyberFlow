import { createClient } from '@/lib/supabase/server'
import { LayoutTemplate, Plus } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('project_templates')
    .select('*, area:areas(name), creator:profiles!project_templates_created_by_fkey(full_name)')
    .order('created_at', { ascending: false })

  const allTemplates = templates || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Templates</h1>
          <p className="text-surface-500 mt-1">Plantillas de proyectos reutilizables</p>
        </div>
      </div>

      {allTemplates.length === 0 ? (
        <div className="card text-center py-16">
          <LayoutTemplate className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-700">Sin templates todavía</h3>
          <p className="text-surface-500 mt-1">
            Cuando crees un proyecto con el Wizard IA, podés guardar el plan como template para reutilizarlo
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template: any) => (
            <div key={template.id} className="card hover:border-brand-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                  <LayoutTemplate className="w-5 h-5 text-brand-600" />
                </div>
                {template.category && (
                  <span className="badge bg-surface-100 text-surface-600">{template.category}</span>
                )}
              </div>
              <h3 className="font-semibold text-surface-900">{template.name}</h3>
              <p className="text-sm text-surface-500 mt-1">{template.description || 'Sin descripción'}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-surface-400">
                <span>{template.template_data?.milestones?.length || 0} hitos</span>
                <span>·</span>
                <span>{template.template_data?.tasks?.length || 0} tareas</span>
                {template.area?.name && (
                  <>
                    <span>·</span>
                    <span>{template.area.name}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
