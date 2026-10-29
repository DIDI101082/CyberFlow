'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

// Tabs principales con sus subtabs
const navItems = [
  {
    href: '/dashboard',
    label: 'Inicio',
    subtabs: [],
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    subtabs: [],
  },
  {
    href: '/projects',
    label: 'Proyectos',
    subtabs: [
      { href: '/projects',          label: 'Todos los proyectos' },
      { href: '/projects/new',      label: 'Nuevo proyecto' },
      { href: '/portfolio',         label: 'Vista ejecutiva' },
    ],
  },
  {
    href: '/tasks',
    label: 'Tareas',
    subtabs: [
      { href: '/tasks',             label: 'Mis tareas' },
    ],
  },
  {
    href: '/areas',
    label: 'Áreas',
    subtabs: [
      { href: '/areas',             label: 'Gestión de áreas' },
    ],
  },
  {
    href: '/users',
    label: 'Usuarios',
    subtabs: [
      { href: '/users',             label: 'Equipo' },
    ],
  },
  {
    href: '/tags',
    label: 'Config',
    subtabs: [
      { href: '/tags',              label: 'Etiquetas' },
      { href: '/settings',          label: 'Configuración' },
    ],
  },
]

function Clock() {
  const [time, setTime] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      setDateStr(now.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
        .replace(',', ''))
    }
    update()
    const t = setInterval(update, 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
      <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{time}</div>
      <div style={{ color: '#6b7280', fontSize: '10px' }}>{dateStr}</div>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Determina qué sección está activa
  const activeSection = navItems.find(item =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const subtabs = activeSection?.subtabs || []

  const isMainActive = (item: typeof navItems[0]) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.href || pathname.startsWith(item.href + '/')

  const isSubActive = (href: string) =>
    pathname === href || (href !== '/projects' && href !== '/tasks' && href !== '/areas' && href !== '/users' && href !== '/tags' && pathname.startsWith(href + '/'))

  return (
    <header style={{
      backgroundColor: '#0d0d12',
      borderBottom: subtabs.length > 0 ? 'none' : '1px solid #1e1e26',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* ── BARRA PRINCIPAL ── */}
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: '52px',
        gap: '0',
        borderBottom: '1px solid #1e1e26',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', marginRight: '28px', display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
          <span style={{ color: 'white', fontSize: '16px', fontWeight: '700', fontStyle: 'italic', letterSpacing: '-0.5px' }}>
            /accusys
          </span>
          <span style={{ color: '#4f8ef7', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px', marginLeft: '4px' }}>
            Projects
          </span>
        </Link>

        {/* Nav tabs principales */}
        <nav style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto', gap: '0', scrollbarWidth: 'none' }}>
          {navItems.map((item) => {
            const active = isMainActive(item)
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  padding: '6px 13px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: active ? '700' : '400',
                  color: active ? 'white' : '#9ca3af',
                  backgroundColor: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.15s, background-color 0.15s',
                  letterSpacing: active ? '0' : '0',
                }}>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Right: Search + Clock + Notifications + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', flexShrink: 0 }}>

          {/* Buscar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1a1a22', border: '1px solid #2a2a35', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>Buscar</span>
            <span style={{ color: '#4b5563', fontSize: '10px', backgroundColor: '#111114', border: '1px solid #2a2a35', borderRadius: '4px', padding: '1px 5px', marginLeft: '4px' }}>Ctrl K</span>
          </div>

          {/* Reloj */}
          <Clock />

          {/* Notificaciones */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              backgroundColor: '#c0392b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: '700', color: 'white',
            }}>
              0
            </div>
          </div>

          {/* Avatar con dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: '#1d4ed8', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: '12px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                letterSpacing: '0.5px',
              }}
            >
              AD
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '40px', backgroundColor: '#16161e',
                border: '1px solid #2a2a35', borderRadius: '10px', padding: '6px',
                minWidth: '160px', zIndex: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #222228', marginBottom: '4px' }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', margin: '0 0 1px' }}>Alejandro D.</p>
                  <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Accusys Technology</p>
                </div>
                <Link href="/settings" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '8px 12px', borderRadius: '7px', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => setMenuOpen(false)}>
                    Configuración
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '7px',
                    color: '#f87171', fontSize: '13px', background: 'none',
                    border: 'none', textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BARRA DE SUBTABS ── */}
      {subtabs.length > 0 && (
        <div style={{
          backgroundColor: '#0d0d12',
          borderBottom: '1px solid #1e1e26',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <div style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            height: '38px',
          }}>
            {subtabs.map(sub => {
              const active = isSubActive(sub.href)
              return (
                <Link key={sub.href} href={sub.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    padding: '4px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: active ? '600' : '400',
                    color: active ? '#4f8ef7' : '#6b7280',
                    borderBottom: active ? '2px solid #4f8ef7' : '2px solid transparent',
                    borderRadius: '0',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {sub.label}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
