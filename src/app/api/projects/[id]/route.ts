import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Verificar que el proyecto existe y que el usuario es owner o admin
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (projectError || !project) {
    console.error('Project fetch error:', projectError)
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // Verificar perfil del usuario (solo owner o admin puede eliminar)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('Delete attempt - user:', user.id, 'owner:', project.owner_id, 'profile role:', profile?.role, 'profileError:', profileError)

  const isOwner = project.owner_id === user.id
  const isAdmin = profile?.role === 'admin' || profile?.role === 'Administrador'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({
      error: `Sin permisos. Tu ID: ${user.id}, Owner ID: ${project.owner_id}, Rol: ${profile?.role}`
    }, { status: 403 })
  }

  // Usar service role para el DELETE y evitar conflictos de RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await serviceSupabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json({ error: `Error al eliminar: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
