'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',  label: 'Inicio' },
  { href: '/portfolio',  label: 'Portfolio' },
  { href: '/projects',   label: 'Proyectos' },
  { href: '/tasks',      label: 'Tareas' },
  { href: '/areas',      label: 'Áreas' },
  { href: '/tags',       label: 'Etiquetas' },
  { href: '/users',      label: 'Usuarios' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  return (
    <header style={{
      backgroundColor: '#111114',
      borderBottom: '1px solid #222228',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: '56px',
        gap: '0',
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', marginRight: '32px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span style={{ color: 'white', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            /accusys
          </span>
          <span style={{ color: '#4f8ef7', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            {' '}Projects
          </span>
        </Link>

        {/* Nav tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflowX: 'auto' }}>
          {navItems.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: active ? '600' : '400',
                  color: active ? 'white' : '#6b7280',
                  backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 0.15s, background-color 0.15s',
                }}>
                  {label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', flexShrink: 0 }}>
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{ color: '#6b7280', fontSize: '13px', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>
              Config
            </div>
          </Link>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: '#1d4ed8', border: 'none', cursor: 'pointer',
                color: 'white', fontSize: '13px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              AD
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '40px', backgroundColor: '#1a1a1f',
                border: '1px solid #2a2a30', borderRadius: '10px', padding: '6px',
                minWidth: '140px', zIndex: 200,
              }}>
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
    </header>
  )
}
