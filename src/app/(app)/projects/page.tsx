import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderKanban, Wand2, Plus, Search } from 'lucide-react'
import { projectStatusConfig, priorityConfig, formatDate } from '@/lib/utils'
import type { Project } from '@/lib/types'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, area:areas(name), owner:profiles(full_name), project_members(count)')
    .order('updated_at', { ascending: false })

  const allProjects = (projects || []) as any[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Proyectos</h1>
          <p className="text-surface-500 mt-1">{allProjects.length} proyectos en total</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects/new" className="btn-primary">
            <Wand2 className="w-4 h-4" />
            Nuevo con IA
          </Link>
        </div>
      </div>

      {/* Lista */}
      {allProjects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-700">No hay proyectos todavía</h3>
          <p className="text-surface-500 mt-1 mb-4">Creá tu primer proyecto usando el Wizard con IA</p>
          <Link href="/projects/new" className="btn-primary inline-flex">
            <Wand2 className="w-4 h-4" />
            Crear Proyecto con IA
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {allProjects.map((project) => {
            const statusCfg = projectStatusConfig[project.status as keyof typeof projectStatusConfig] || projectStatusConfig.draft
            const priorityCfg = priorityConfig[project.priority as keyof typeof priorityConfig] || priorityConfig.medium
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card hover:border-brand-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-surface-900 group-hover:text-brand-700 transition-colors">
                        {project.name}
                      </h3>
                      <span className={`badge ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className={`badge ${priorityCfg.bg} ${priorityCfg.color}`}>
                        {priorityCfg.icon} {priorityCfg.label}
                      </span>
                      {project.is_cross_area && (
                        <span className="badge bg-purple-50 text-purple-700">Transversal</span>
                      )}
                    </div>
                    <p className="text-sm text-surface-500 line-clamp-1">{project.description || 'Sin descripción'}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-surface-400">
                      <span>{project.area?.name || 'Sin área'}</span>
                      <span>·</span>
                      <span>Owner: {project.owner?.full_name || '—'}</span>
                      <span>·</span>
                      <span>{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
                      {project.tags?.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{project.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-surface-900">{project.progress || 0}%</p>
                      <p className="text-xs text-surface-400">progreso</p>
                    </div>
                    <div className="w-2 h-16 rounded-full bg-surface-100 overflow-hidden">
                      <div
                        className="w-full rounded-full bg-brand-500 transition-all"
                        style={{ height: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
