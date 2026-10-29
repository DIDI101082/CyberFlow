'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/tasks', label: 'Mis Tareas' },
  { href: '/areas', label: 'Áreas' },
  { href: '/tags', label: 'Etiquetas' },
  { href: '/users', label: 'Usuarios' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      backgroundColor: '#111827',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#1d4ed8',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>⚡</div>
        <div>
          <p style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: 0 }}>CyberFlow</p>
          <p style={{ color: '#6b7280', fontSize: '10px', margin: 0 }}>Accusys Technology</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                backgroundColor: isActive ? 'rgba(29,78,216,0.2)' : 'transparent',
                color: isActive ? '#60a5fa' : '#9ca3af',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 8px 16px', borderTop: '1px solid #1f2937' }}>
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '9px 12px',
            borderRadius: '8px',
            color: '#9ca3af',
            fontSize: '13px',
            marginBottom: '2px',
            cursor: 'pointer',
          }}>
            Configuración
          </div>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
