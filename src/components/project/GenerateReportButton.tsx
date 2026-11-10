'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileBarChart, Sparkles, Loader2, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GenerateReportButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState('')

  async function generateReport() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!res.ok) throw new Error('Error generando reporte')
      const data = await res.json()
      setReport(data.report)
      router.refresh()
    } catch {
      setError('Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={generateReport} disabled={loading} className="btn-secondary">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileBarChart className="w-4 h-4" />
        )}
        <Sparkles className="w-3 h-3" />
        {loading ? 'Generando...' : 'Generar Reporte IA'}
      </button>

      {/* Modal del reporte */}
      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-semibold">{report.title}</h2>
              </div>
              <button onClick={() => setReport(null)} className="text-surface-400 hover:text-surface-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Resumen IA */}
              <div>
                <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  Resumen del Asistente IA
                </h3>
                <div className="rounded-lg bg-brand-50 border border-brand-100 p-4">
                  <p className="text-sm text-brand-900 whitespace-pre-line">{report.ai_summary}</p>
                </div>
              </div>

              {/* Métricas */}
              {report.content && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Métricas</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-surface-50 p-3 text-center">
                      <p className="text-xl font-bold text-surface-900">{report.content.tasks_summary?.total || 0}</p>
                      <p className="text-xs text-surface-500">Total tareas</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-center">
                      <p className="text-xl font-bold text-emerald-700">{report.content.tasks_summary?.completed || 0}</p>
                      <p className="text-xs text-surface-500">Completadas</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-xl font-bold text-red-700">{report.content.tasks_summary?.overdue || 0}</p>
                      <p className="text-xs text-surface-500">Vencidas</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              {report.ai_recommendations && report.ai_recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Recomendaciones</h3>
                  <div className="space-y-2">
                    {report.ai_recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-surface-600">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-surface-200 px-6 py-4 flex justify-end">
              <button onClick={() => setReport(null)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}
    </>
  )
}
