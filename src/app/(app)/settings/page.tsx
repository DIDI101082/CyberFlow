'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Save, Loader2 } from 'lucide-react'
import type { Area, Profile } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [fullName, setFullName] = useState('')
  const [areaId, setAreaId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Redirigir si no es admin
        if (profile.role !== 'admin') {
          router.replace('/dashboard')
          return
        }
        setProfile(profile)
        setFullName(profile.full_name)
        setAreaId(profile.area_id || '')
      }

      const { data: areas } = await supabase.from('areas').select('*')
      if (areas) setAreas(areas)
    }
    load()
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setSuccess(false)

    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        area_id: areaId || null,
      })
      .eq('id', profile.id)

    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  if (!profile) return <div className="card text-center py-8 text-surface-400">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Configuración</h1>
        <p className="text-surface-500 mt-1">Editá tu perfil</p>
      </div>

      <div className="card space-y-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-surface-400" />
          Perfil
        </h2>

        <div>
          <label className="label">Email</label>
          <input className="input bg-surface-50" value={profile.email} disabled />
        </div>

        <div>
          <label className="label">Nombre completo</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Área</label>
          <select className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Sin área asignada</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Rol</label>
          <input
            className="input bg-surface-50"
            value={profile.role === 'admin' ? 'Administrador' : profile.role === 'area_lead' ? 'Líder de Área' : 'Miembro'}
            disabled
          />
          <p className="text-xs text-surface-400 mt-1">El rol lo asigna un administrador</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {success && (
            <span className="text-sm text-emerald-600">✓ Guardado correctamente</span>
          )}
        </div>
      </div>
    </div>
  )
}
