import { createClient } from '@/lib/supabase/server'
import { Users, Shield, UserCog, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleConfig = {
  admin:     { label: 'Administrador', icon: Shield, color: 'text-red-700', bg: 'bg-red-50' },
  area_lead: { label: 'Líder de Área', icon: UserCog, color: 'text-brand-700', bg: 'bg-brand-50' },
  member:    { label: 'Miembro', icon: User, color: 'text-surface-600', bg: 'bg-surface-100' },
}

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*, area:areas(name)')
    .order('full_name')

  const allMembers = members || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Equipo</h1>
        <p className="text-surface-500 mt-1">{allMembers.length} miembros activos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMembers.map((member: any) => {
          const role = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.member
          const Icon = role.icon
          return (
            <div key={member.id} className="card">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  {member.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-surface-900">{member.full_name}</h3>
                  <p className="text-sm text-surface-500">{member.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge ${role.bg} ${role.color}`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {role.label}
                    </span>
                    {member.area?.name && (
                      <span className="badge bg-surface-100 text-surface-600">{member.area.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
