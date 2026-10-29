'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { User } from '@/types'

const rolLabel: Record<string, string> = {
  admin: 'Admin',
  area_lead: 'Líder de área',
  member: 'Miembro',
}
const rolStyle: Record<string, { bg: string; color: string }> = {
  admin: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  area_lead: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  member: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*, area:areas(*)').order('nombre')
    setUsers(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Navbar />
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Usuarios</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{users.length} usuarios registrados</p>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>Cargando...</p>
          ) : users.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>No hay usuarios</p>
          ) : (
            <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #21262d', borderRadius: '12px', overflow: 'hidden' }}>
              {users.map((u, i) => {
                const rs = rolStyle[u.rol] || rolStyle.member
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', padding: '14px 20px',
                    borderBottom: i < users.length - 1 ? '1px solid #21262d' : 'none',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#1a5ce8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '14px', fontWeight: '600', flexShrink: 0, marginRight: '14px',
                    }}>
                      {u.nombre?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{u.nombre}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {(u as any).area?.nombre && (
                        <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                          {(u as any).area.nombre}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: rs.bg, color: rs.color }}>
                        {rolLabel[u.rol] || u.rol}
                      </span>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.activo ? '#34d399' : '#6b7280' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
