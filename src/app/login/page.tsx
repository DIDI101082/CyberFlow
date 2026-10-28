'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a3ed0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '40px 36px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '32px' }}>
          <span style={{ color: 'white', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.3px' }}>
            /accusys
          </span>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <span style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>CyberFlow</span>
        </div>

        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', textAlign: 'center', margin: '0 0 6px' }}>
          Bienvenido
        </h2>
        <p style={{ color: 'rgba(219,234,254,0.85)', fontSize: '14px', textAlign: 'center', margin: '0 0 28px' }}>
          Ingresá con tu cuenta de Accusys
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#fecaca',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              color: '#1e293b',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 16px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              color: '#1e293b',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 16px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? 'rgba(255,255,255,0.7)' : 'white',
              color: '#1a3ed0',
              border: 'none',
              borderRadius: '12px',
              padding: '13px 16px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #93c5fd',
                borderTopColor: '#1a3ed0',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ color: 'rgba(191,219,254,0.6)', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
          Usá tus credenciales de <strong style={{ color: 'rgba(191,219,254,0.9)' }}>Accusys</strong> para acceder
        </p>
      </div>

      {/* Footer */}
      <p style={{ color: 'rgba(191,219,254,0.4)', fontSize: '12px', marginTop: '28px' }}>
        © 2026 Accusys. Todos los derechos reservados.
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #94a3b8; }
        input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.3); }
      `}</style>
    </div>
  )
}
