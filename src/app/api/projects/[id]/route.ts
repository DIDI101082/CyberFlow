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
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // Verificar perfil del usuario (solo owner o admin puede eliminar)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = project.owner_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Sin permisos para eliminar este proyecto' }, { status: 403 })
  }

  // Eliminar el proyecto (las FK con CASCADE se encargan de tasks, milestones, risks, etc.)
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json({ error: 'Error al eliminar el proyecto' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
