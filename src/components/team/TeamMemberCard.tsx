'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, UserCog, User, ChevronDown, Check, Building2 } from 'lucide-react'

const roleConfig = {
  admin:     { label: 'Administrador', icon: Shield, color: 'text-red-700', bg: 'bg-red-50' },
  area_lead: { label: 'Líder de Área', icon: UserCog, color: 'text-brand-700', bg: 'bg-brand-50' },
  member:    { label: 'Miembro', icon: User, color: 'text-surface-600', bg: 'bg-surface-100' },
}

const roles = [
  { value: 'admin', label: 'Administrador' },
  { value: 'area_lead', label: 'Líder de Área' },
  { value: 'member', label: 'Miembro' },
]

interface Area {
  id: string
  name: string
}

interface TeamMemberCardProps {
  member: any
  areas: Area[]
  isCurrentUserAdmin: boolean
  currentUserId: string
}

export default function TeamMemberCard({ member, areas, isCurrentUserAdmin, currentUserId }: TeamMemberCardProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showAreaMenu, setShowAreaMenu] = useState(false)
  const [currentRole, setCurrentRole] = useState(member.role || 'member')
  const [currentAreaId, setCurrentAreaId] = useState(member.area_id)
  const [currentAreaName, setCurrentAreaName] = useState(member.area?.name || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const role = roleConfig[currentRole as keyof typeof roleConfig] || roleConfig.member
  const Icon = role.icon
  const isOwnCard = member.id === currentUserId

  async function updateMember(field: 'role' | 'area_id', value: string | null) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          ...(field === 'role' ? { role: value } : { area_id: value }),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al actualizar')
        return
      }

      if (field === 'role') {
        setCurrentRole(value as string)
      } else {
        setCurrentAreaId(value)
        const area = areas.find(a => a.id === value)
        setCurrentAreaName(area?.name || null)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
      setShowRoleMenu(false)
      setShowAreaMenu(false)
    }
  }

  return (
    <div className="card relative">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
          {member.full_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-surface-900">{member.full_name}</h3>
          <p className="text-sm text-surface-500">{member.email}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Rol badge / dropdown */}
            {isCurrentUserAdmin ? (
              <div className="relative">
                <button
                  onClick={() => { setShowRoleMenu(!showRoleMenu); setShowAreaMenu(false) }}
                  disabled={saving || (isOwnCard && currentRole === 'admin')}
                  className={`badge ${role.bg} ${role.color} cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50`}
                  title={isOwnCard && currentRole === 'admin' ? 'No podés cambiar tu propio rol de admin' : 'Cambiar rol'}
                >
                  <Icon className="w-3 h-3" />
                  {role.label}
                  {!(isOwnCard && currentRole === 'admin') && <ChevronDown className="w-3 h-3" />}
                </button>
                {showRoleMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-surface-200 py-1 z-20 min-w-[160px]">
                      {roles.map(r => (
                        <button
                          key={r.value}
                          onClick={() => updateMember('role', r.value)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 flex items-center justify-between"
                        >
                          {r.label}
                          {currentRole === r.value && <Check className="w-4 h-4 text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className={`badge ${role.bg} ${role.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {role.label}
              </span>
            )}

            {/* Área badge / dropdown */}
            {isCurrentUserAdmin ? (
              <div className="relative">
                <button
                  onClick={() => { setShowAreaMenu(!showAreaMenu); setShowRoleMenu(false) }}
                  disabled={saving}
                  className="badge bg-surface-100 text-surface-600 cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center gap-1"
                  title="Cambiar área"
                >
                  <Building2 className="w-3 h-3" />
                  {currentAreaName || 'Sin área'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showAreaMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAreaMenu(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-surface-200 py-1 z-20 min-w-[180px] max-h-[200px] overflow-y-auto">
                      <button
                        onClick={() => updateMember('area_id', null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 flex items-center justify-between text-surface-400"
                      >
                        Sin área
                        {!currentAreaId && <Check className="w-4 h-4 text-brand-600" />}
                      </button>
                      {areas.map(area => (
                        <button
                          key={area.id}
                          onClick={() => updateMember('area_id', area.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 flex items-center justify-between"
                        >
                          {area.name}
                          {currentAreaId === area.id && <Check className="w-4 h-4 text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              currentAreaName && (
                <span className="badge bg-surface-100 text-surface-600">{currentAreaName}</span>
              )
            )}
          </div>

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}
