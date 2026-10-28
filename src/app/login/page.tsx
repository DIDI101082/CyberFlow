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
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#1a3ed0' }}>
      {/* Card */}
      <div className="w-full max-w-sm mx-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <AccusysLogo />
          <div className="w-px h-8 bg-white/40" />
          <span className="text-white text-2xl font-semibold tracking-wide">CyberFlow</span>
        </div>

        <h2 className="text-white text-xl font-bold text-center mb-1">Bienvenido</h2>
        <p className="text-blue-100 text-sm text-center mb-7">Ingresá con tu cuenta de Accusys</p>

        {error && (
          <div className="bg-red-500/20 border border-red-400/40 text-red-100 text-sm rounded-xl p-3 mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-white/90 text-gray-800 placeholder-gray-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="w-full bg-white/90 text-gray-800 placeholder-gray-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed text-blue-700 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
            )}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-blue-200/70 text-xs text-center mt-6">
          Usá tus credenciales de <strong className="text-blue-100">Accusys</strong> para acceder
        </p>
      </div>

      {/* Footer */}
      <p className="text-blue-200/50 text-xs mt-8">© 2026 Accusys. Todos los derechos reservados.</p>
    </div>
  )
}

function AccusysLogo() {
  return (
    <svg width="110" height="28" viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="22" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" fill="white" letterSpacing="-0.5">
        /accusys
      </text>
    </svg>
  )
}
