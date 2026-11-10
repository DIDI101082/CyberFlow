'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { History, Clock } from 'lucide-react'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Activity = {
  id: string
  action: string
  entity_type: string
  entity_name: string
  created_at: string
  profiles: { full_name: string } | null
}

const actionIcons: Record<string, string> = {
  created: '➕', updated: '✏️', deleted: '🗑️', completed: '✅',
  assigned: '👤', status_change: '🔄', comment: '💬',
}

export default function ActivityLog({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('activity_log')
        .select('*, profiles(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (data) setActivities(data as unknown as Activity[])
    }
    load()
  }, [projectId, limit])

  return (
    <div className="border border-surface-200 rounded-xl bg-white">
      <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2">
        <History className="w-4 h-4 text-surface-400" />
        <span className="text-sm font-medium text-surface-700">Historial de Actividad</span>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 && (
          <p className="text-sm text-surface-400 text-center py-4">Sin actividad registrada</p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="flex gap-3 group">
            <div className="text-sm mt-0.5">{actionIcons[a.action] || '📝'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-700">
                <span className="font-medium">{a.profiles?.full_name || 'Sistema'}</span>{' '}
                {a.action === 'created' && 'creó'}
                {a.action === 'updated' && 'actualizó'}
                {a.action === 'deleted' && 'eliminó'}
                {a.action === 'completed' && 'completó'}
                {a.action === 'assigned' && 'asignó'}
                {a.action === 'status_change' && 'cambió el estado de'}
                {a.action === 'comment' && 'comentó en'}
                {!['created', 'updated', 'deleted', 'completed', 'assigned', 'status_change', 'comment'].includes(a.action) && a.action}{' '}
                <span className="font-medium text-brand-600">{a.entity_name}</span>
              </p>
              <div className="flex items-center gap-1 text-xs text-surface-400 mt-0.5">
                <Clock className="w-3 h-3" />
                {new Date(a.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length >= limit && (
        <div className="px-4 py-3 border-t border-surface-100 text-center">
          <button onClick={() => setLimit((l) => l + 20)} className="text-xs text-brand-600 hover:underline">
            Cargar más
          </button>
        </div>
      )}
    </div>
  )
}
