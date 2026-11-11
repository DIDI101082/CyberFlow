import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import TeamMemberCard from '@/components/team/TeamMemberCard'

export default async function TeamPage() {
  const supabase = await createClient()

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener perfil del usuario actual para saber si es admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single()

  const isAdmin = currentProfile?.role === 'admin'

  // Obtener todos los miembros
  const { data: members } = await supabase
    .from('profiles')
    .select('*, area:areas(name)')
    .order('full_name')

  // Obtener áreas disponibles (para el dropdown)
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name')
    .order('name')

  const allMembers = members || []
  const allAreas = areas || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Equipo</h1>
        <p className="text-surface-500 mt-1">{allMembers.length} miembros activos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allMembers.map((member: any) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            areas={allAreas}
            isCurrentUserAdmin={isAdmin}
            currentUserId={user?.id || ''}
          />
        ))}
      </div>
    </div>
  )
}
