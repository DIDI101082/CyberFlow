'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Zap, LayoutDashboard, FolderKanban, CheckSquare, Tag, Users, Settings, LogOut } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Proyectos' },
  { href: '/tasks', icon: CheckSquare, label: 'Mis Tareas' },
  { href: '/tags', icon: Tag, label: 'Etiquetas' },
  { href: '/users', icon: Users, label: 'Usuarios' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('cyberflow_user')
    window.location.href = '/login'
  }

  return (
    <aside className="w-60 min-h-screen bg-[#1a1f2e] border-r border-[#2d3748] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[#2d3748]">
        <div className="relative">
          <Shield className="w-7 h-7 text-blue-500" />
          <Zap className="w-3 h-3 text-yellow-400 absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">CyberFlow</p>
          <p className="text-[10px] text-gray-500">Accusys Technology</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#2d3748] space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
