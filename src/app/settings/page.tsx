'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0d1117', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>Configuración</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Ajustes de tu cuenta</p>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 16px' }}>Cuenta</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }}>Email</p>
                <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>{user?.email || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }}>ID de usuario</p>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0, fontFamily: 'monospace' }}>{user?.id || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 4px' }}>Último acceso</p>
                <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-AR') : '—'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#161b22', border: '1px solid #21262d', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }}>Versión</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>CyberFlow v1.0 · Accusys Technology · 2026</p>
          </div>
        </div>
      </main>
    </div>
  )
}
