setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
  cookiesToSet.forEach(({ name, value, options }) =>
    request.cookies.set(name, value)
  )
  supabaseResponse = NextResponse.next({
    request,
  })
  cookiesToSet.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options)
  )
},
