import { createClient } from '@/lib/supabase/server'
import { Bell, Info, AlertTriangle, Clock, Sparkles } from 'lucide-react'
import { timeAgo, cn } from '@/lib/utils'
import Link from 'next/link'

const typeConfig = {
  info:          { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  warning:       { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  overdue:       { icon: Clock, color: 'text-red-500', bg: 'bg-red-50' },
  ai_suggestion: { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50' },
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const allNotifications = notifications || []

  // Marcar como leídas
  if (allNotifications.some(n => !n.is_read)) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Notificaciones</h1>
        <p className="text-surface-500 mt-1">
          {allNotifications.filter(n => !n.is_read).length} sin leer
        </p>
      </div>

      {allNotifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-700">Sin notificaciones</h3>
          <p className="text-surface-500 mt-1">Las alertas de tareas vencidas y sugerencias de IA aparecerán acá</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allNotifications.map((notif: any) => {
            const cfg = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.info
            const Icon = cfg.icon
            return (
              <div
                key={notif.id}
                className={cn(
                  'card !p-4 flex items-start gap-3',
                  !notif.is_read && 'border-brand-200 bg-brand-50/20'
                )}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900">{notif.title}</p>
                  {notif.message && <p className="text-sm text-surface-500 mt-0.5">{notif.message}</p>}
                  <p className="text-xs text-surface-400 mt-1">{timeAgo(notif.created_at)}</p>
                </div>
                {notif.project_id && (
                  <Link href={`/projects/${notif.project_id}`} className="text-xs text-brand-600 hover:underline shrink-0">
                    Ver proyecto →
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
