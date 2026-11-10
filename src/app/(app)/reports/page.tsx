import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileBarChart, Sparkles, ArrowRight, Calendar } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('reports')
    .select('*, project:projects(name), generator:profiles!reports_generated_by_fkey(full_name)')
    .order('created_at', { ascending: false })

  const allReports = reports || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Reportes</h1>
        <p className="text-surface-500 mt-1">Reportes de estado generados con IA</p>
      </div>

      {allReports.length === 0 ? (
        <div className="card text-center py-16">
          <FileBarChart className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-700">No hay reportes todavía</h3>
          <p className="text-surface-500 mt-1 mb-4">
            Generá un reporte desde la vista de un proyecto usando el botón "Generar Reporte IA"
          </p>
          <Link href="/projects" className="btn-primary inline-flex">
            Ir a Proyectos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allReports.map((report: any) => (
            <div key={report.id} className="card hover:border-brand-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileBarChart className="w-4 h-4 text-brand-500" />
                    <h3 className="font-semibold text-surface-900">{report.title}</h3>
                    {report.ai_summary && (
                      <span className="badge bg-brand-50 text-brand-700 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500">
                    Proyecto: <Link href={`/projects/${report.project_id}`} className="text-brand-600 hover:underline">{report.project?.name}</Link>
                    {' · '}Generado por {report.generator?.full_name || 'Sistema'}
                  </p>

                  {report.ai_summary && (
                    <div className="mt-3 rounded-lg bg-surface-50 p-3">
                      <p className="text-sm text-surface-600 line-clamp-3">{report.ai_summary}</p>
                    </div>
                  )}

                  {report.ai_recommendations && report.ai_recommendations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {report.ai_recommendations.slice(0, 3).map((rec: string, i: number) => (
                        <span key={i} className="inline-flex items-center text-xs text-surface-500 bg-surface-100 rounded-full px-2.5 py-1">
                          💡 {rec.substring(0, 60)}{rec.length > 60 ? '...' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(report.created_at)}
                  </div>
                  <p className="text-xs text-surface-300 mt-0.5">{timeAgo(report.created_at)}</p>

                  {report.content?.progress !== undefined && (
                    <div className="mt-2">
                      <span className="text-lg font-bold text-surface-900">{report.content.progress}%</span>
                      <p className="text-xs text-surface-400">progreso</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
