'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Wand2,
  FileBarChart,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Shield,
  Users,
  LayoutTemplate,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'area_lead', 'member'] },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban, roles: ['admin', 'area_lead', 'member'] },
  { href: '/projects/new', label: 'Nuevo Proyecto (IA)', icon: Wand2, roles: ['admin', 'area_lead'] },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate, roles: ['admin', 'area_lead', 'member'] },
  { href: '/reports', label: 'Reportes', icon: FileBarChart, roles: ['admin', 'area_lead', 'member'] },
  { href: '/team', label: 'Equipo', icon: Users, roles: ['admin', 'area_lead', 'member'] },
  { href: '/notifications', label: 'Notificaciones', icon: Bell, roles: ['admin', 'area_lead', 'member'] },
  { href: '/settings', label: 'Configuración', icon: Settings, roles: ['admin'] },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-surface-200 bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-surface-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-surface-900">CyberFlow</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems
          .filter((item) => item.roles.includes(profile.role || 'member'))
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-600' : 'text-surface-400')} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.href === '/projects/new' && (
                  <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                    IA
                  </span>
                )}
              </Link>
            )
          })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {profile.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-surface-900">{profile.full_name}</p>
              <p className="truncate text-xs text-surface-500">{profile.role === 'admin' ? 'Administrador' : profile.role === 'area_lead' ? 'Líder de área' : 'Miembro'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-red-600"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
