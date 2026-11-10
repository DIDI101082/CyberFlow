'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3a8f 0%, #1e4db7 50%, #1a3a8f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <svg width="130" height="32" viewBox="0 0 130 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="26" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontWeight="700" fontSize="26" fill="white" letterSpacing="-0.5">
              <tspan fontStyle="italic">/</tspan>accusys
            </text>
          </svg>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.4)' }} />
          <span style={{ color: 'white', fontWeight: '700', fontSize: '22px', letterSpacing: '0.5px' }}>
            CyberFlow
          </span>
        </div>

        {/* Title */}
        <h1 style={{ color: 'white', fontWeight: '700', fontSize: '24px', margin: '0 0 8px' }}>
          Bienvenido
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: '0 0 28px' }}>
          Ingresá con tu cuenta de la empresa
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: 'white',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email corporativo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? 'rgba(255,255,255,0.5)' : 'white',
              color: '#1a3a8f',
              fontWeight: '600',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Microsoft Button (preparado para Entra ID) */}
        <button
          disabled
          title="Próximamente: login con cuenta Microsoft"
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: 'rgba(255,255,255,0.6)',
            color: '#333',
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            opacity: 0.7,
          }}
        >
          {/* Microsoft logo SVG */}
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Continuar con Microsoft
        </button>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '12px' }}>
          Próximamente: acceso con <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Microsoft 365</strong>
        </p>
      </div>

      {/* Footer */}
      <p style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
        marginTop: '32px',
      }}>
        © 2026 Accusys. Todos los derechos reservados.
      </p>
    </div>
  )
}
