import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()

  // Verificar que el usuario actual es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden cambiar roles' }, { status: 403 })
  }

  const body = await request.json()
  const { memberId, role, area_id } = body

  if (!memberId) {
    return NextResponse.json({ error: 'memberId requerido' }, { status: 400 })
  }

  // No permitir que un admin se quite su propio rol admin
  if (memberId === user.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'No podés quitarte tu propio rol de administrador' }, { status: 400 })
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (role) updateData.role = role
  if (area_id !== undefined) updateData.area_id = area_id || null

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', memberId)
    .select('*, area:areas(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
