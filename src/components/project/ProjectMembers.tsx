'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, UserPlus, X, ChevronDown, Search } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: string
  profile?: {
    full_name: string
    email: string
    role: string
  }
}

interface AvailableUser {
  id: string
  full_name: string
  email: string
  role: string
}

const memberRoles = [
  { value: 'lead', label: 'Líder' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Viewer' },
]

export default function ProjectMembers({
  projectId,
  initialMembers,
}: {
  projectId: string
  initialMembers: Member[]
}) {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios disponibles cuando se abre el modal
  useEffect(() => {
    if (!showAddModal) return

    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name')

      if (data) {
        // Filtrar los que ya son miembros
        const memberIds = members.map((m) => m.user_id)
        setAvailableUsers(data.filter((u) => !memberIds.includes(u.id)))
      }
    }
    fetchUsers()
  }, [showAddModal, members, supabase])

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = async (userId: string) => {
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role: selectedRole })
      .select('*, profile:profiles(full_name, email, role)')
      .single()

    if (insertError) {
      setError('Error al agregar miembro: ' + insertError.message)
      setLoading(false)
      return
    }

    setMembers((prev) => [...prev, data])
    setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
    setLoading(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de quitar este miembro del proyecto?')) return

    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      setError('Error al quitar miembro: ' + deleteError.message)
      return
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const { error: updateError } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (updateError) {
      setError('Error al actualizar rol: ' + updateError.message)
      return
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-surface-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Equipo
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}

      {members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 shrink-0">
                {member.profile?.full_name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-800 truncate">
                  {member.profile?.full_name}
                </p>
                <p className="text-xs text-surface-400 truncate">{member.profile?.email}</p>
              </div>
              <select
                value={member.role}
                onChange={(e) => handleChangeRole(member.id, e.target.value)}
                className="text-xs bg-transparent text-surface-500 border border-surface-200 rounded px-1.5 py-0.5 cursor-pointer hover:border-brand-300 focus:border-brand-500 focus:outline-none"
              >
                {memberRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveMember(member.id)}
                className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-red-500 transition-all"
                title="Quitar del proyecto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-surface-400">Sin miembros asignados</p>
      )}

      {/* Modal para agregar miembros */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <h3 className="text-lg font-semibold text-surface-900">Agregar miembro</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchTerm('')
                  setError(null)
                }}
                className="text-surface-400 hover:text-surface-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + Role */}
            <div className="px-5 py-3 space-y-3 border-b border-surface-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500">Rol:</span>
                {memberRoles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedRole(r.value)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      selectedRole === r.value
                        ? 'bg-brand-100 text-brand-700 font-medium'
                        : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User list */}
            <div className="max-h-72 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddMember(user.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 shrink-0">
                      {user.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-800 truncate">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-surface-400 truncate">{user.email}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-brand-500 shrink-0" />
                  </button>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-surface-400">
                    {searchTerm
                      ? 'No se encontraron usuarios'
                      : 'Todos los usuarios ya son miembros'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-surface-100 bg-surface-50">
              <p className="text-xs text-surface-400">
                Los usuarios aparecen cuando ingresan por primera vez con Microsoft
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
