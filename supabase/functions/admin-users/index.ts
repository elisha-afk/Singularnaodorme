import { audit, corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user } = await requireStaff(req, true)

    if (req.method === 'GET') {
      const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
        supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabase.from('admin_profiles').select('*').order('created_at', { ascending: false }),
      ])
      if (authError || profileError) throw authError || profileError
      const emails = new Map(authData.users.map((entry) => [entry.id, entry.email]))
      return jsonResponse({ users: (profiles || []).map((profile) => ({ ...profile, email: emails.get(profile.id) || '' })) })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const email = String(body.email || '').trim().toLowerCase()
      const name = String(body.name || '').trim()
      const password = String(body.password || '')
      const role = body.role === 'admin' ? 'admin' : 'coordinator'
      if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 3 || password.length < 10) return jsonResponse({ error: 'Informe nome, e-mail válido e senha temporária com ao menos 10 caracteres' }, 400)

      const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })
      if (createError || !created.user) return jsonResponse({ error: createError?.message || 'Não foi possível criar o acesso' }, 400)
      const { data: profile, error: profileError } = await supabase.from('admin_profiles').insert({ id: created.user.id, name, role, school: String(body.school || '').trim() || null, must_change_password: true }).select().single()
      if (profileError) {
        await supabase.auth.admin.deleteUser(created.user.id)
        throw profileError
      }
      await audit(supabase, user.id, 'user.created', 'admin_profile', created.user.id, { email, role })
      return jsonResponse({ user: { ...profile, email } }, 201)
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      if (!body.id) return jsonResponse({ error: 'Usuário não informado' }, 400)
      if (body.id === user.id && body.active === false) return jsonResponse({ error: 'Você não pode desativar seu próprio acesso' }, 400)
      const changes: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof body.name === 'string' && body.name.trim().length >= 3) changes.name = body.name.trim()
      if (body.role === 'admin' || body.role === 'coordinator') changes.role = body.role
      if (typeof body.active === 'boolean') changes.active = body.active
      if (typeof body.school === 'string') changes.school = body.school.trim() || null
      if (typeof body.password === 'string' && body.password.length >= 10) {
        const { error } = await supabase.auth.admin.updateUserById(body.id, { password: body.password })
        if (error) throw error
        changes.must_change_password = true
      }
      const { data, error } = await supabase.from('admin_profiles').update(changes).eq('id', body.id).select().single()
      if (error) throw error
      await audit(supabase, user.id, 'user.updated', 'admin_profile', body.id, changes)
      return jsonResponse({ user: data })
    }

    return jsonResponse({ error: 'Método não permitido' }, 405)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Admin users error:', error)
    return jsonResponse({ error: 'Não foi possível gerenciar os usuários' }, 500)
  }
})