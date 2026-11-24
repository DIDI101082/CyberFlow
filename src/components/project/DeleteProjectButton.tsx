'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, X } from 'lucide-react'

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
}

export default function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canConfirm = confirmText.trim() === projectName.trim()

  async function handleDelete() {
    if (!canConfirm) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al eliminar el proyecto')
        setLoading(false)
        return
      }
      router.push('/projects')
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar proyecto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setOpen(false); setConfirmText(''); setError('') }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-surface-900">Eliminar proyecto</h2>
              </div>
              <button
                onClick={() => { setOpen(false); setConfirmText(''); setError('') }}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Esta acción es <strong>irreversible</strong>. Se eliminarán todas las tareas, hitos, riesgos y archivos asociados al proyecto.
            </div>

            {/* Confirm input */}
            <div>
              <label className="block text-sm text-surface-600 mb-1.5">
                Escribí el nombre del proyecto para confirmar:
                <span className="font-semibold text-surface-900 ml-1">{projectName}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={projectName}
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setOpen(false); setConfirmText(''); setError('') }}
                className="flex-1 btn-ghost"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!canConfirm || loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
