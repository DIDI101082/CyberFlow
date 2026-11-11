import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Wand2, ClipboardEdit, Sparkles, FileEdit } from 'lucide-react'

export default async function NewProjectChoice() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role === 'member') {
    redirect('/projects')
  }
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/projects" className="btn-ghost mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Volver a Proyectos
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">Nuevo Proyecto</h1>
        <p className="text-surface-500 mt-1">Elegí cómo querés crear el proyecto</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual */}
        <Link
          href="/projects/new/manual"
          className="card group hover:border-brand-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 group-hover:bg-brand-50 transition-colors">
              <FileEdit className="w-8 h-8 text-surface-500 group-hover:text-brand-600 transition-colors" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
                Crear Manualmente
              </h2>
              <p className="text-sm text-surface-500 mt-1 max-w-xs">
                Completá nombre, estado, fechas y prioridad vos mismo. Ideal para proyectos simples o cuando ya tenés todo definido.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <ClipboardEdit className="w-4 h-4" />
              Empezar
            </span>
          </div>
        </Link>

        {/* Con IA */}
        <Link
          href="/projects/new/wizard"
          className="card group hover:border-brand-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
              <Wand2 className="w-8 h-8 text-brand-600 group-hover:text-brand-700 transition-colors" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
                Crear con IA
              </h2>
              <p className="text-sm text-surface-500 mt-1 max-w-xs">
                El asistente genera automáticamente tareas, hitos y riesgos basándose en los objetivos del proyecto.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4" />
              Empezar
            </span>
          </div>
          {/* AI badge */}
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs font-medium text-brand-600">
            <Sparkles className="w-3 h-3" />
            IA
          </div>
        </Link>
      </div>
    </div>
  )
}
