import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { audit, corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'

const parseYears = (value: unknown) => Array.isArray(value) ? [...new Set(value.map(Number).filter((year) => [1, 2, 3].includes(year)))].sort() : []

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user, profile: adminProfile } = await requireStaff(req, true)

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
      const role = body.role === 'admin' ? 'admin' : 'staff'
      const allowed_years = role === 'admin' ? [] : parseYears(body.allowed_years)
      if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 3 || password.length < 10) return jsonResponse({ error: 'Informe nome, e-mail válido e senha temporária com ao menos 10 caracteres' }, 400)

      const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })
      if (createError || !created.user) return jsonResponse({ error: createError?.message || 'Não foi possível criar o acesso' }, 400)
      const { data: profile, error: profileError } = await supabase.from('admin_profiles').insert({ id: created.user.id, name, role, allowed_years, school: String(body.school || '').trim() || null, must_change_password: true }).select().single()
      if (profileError) {
        await supabase.auth.admin.deleteUser(created.user.id)
        throw profileError
      }
      await audit(supabase, user.id, 'user.created', 'admin_profile', created.user.id, { email, role, allowed_years })
      return jsonResponse({ user: { ...profile, email } }, 201)
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      if (!body.id) return jsonResponse({ error: 'Usuário não informado' }, 400)
      if (body.id === user.id && body.active === false) return jsonResponse({ error: 'Você não pode desativar seu próprio acesso' }, 400)
      const changes: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof body.name === 'string' && body.name.trim().length >= 3) changes.name = body.name.trim()
      if (['admin', 'staff'].includes(body.role)) changes.role = body.role
      if (Array.isArray(body.allowed_years)) changes.allowed_years = parseYears(body.allowed_years)
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

    if (req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}))
      if (!body.id) return jsonResponse({ error: 'Usuário não informado' }, 400)
      if (body.id === user.id) return jsonResponse({ error: 'Você não pode excluir o seu próprio acesso' }, 400)
      const adminPassword = String(body.admin_password || '')
      if (!adminPassword || !user.email) return jsonResponse({ error: 'Informe a sua senha de administrador para confirmar' }, 400)

      // Confirma a senha do administrador com um login descartável (sem alterar a sessão atual).
      const verifier = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
      const { error: passwordError } = await verifier.auth.signInWithPassword({ email: user.email, password: adminPassword })
      if (passwordError) return jsonResponse({ error: 'Senha do administrador incorreta' }, 403)

      const { data: target } = await supabase.from('admin_profiles').select('id,name,role').eq('id', body.id).maybeSingle()
      if (!target) return jsonResponse({ error: 'Usuário não encontrado' }, 404)
      const { data: authTarget } = await supabase.auth.admin.getUserById(body.id)

      const { error: deleteError } = await supabase.auth.admin.deleteUser(body.id)
      if (deleteError) throw deleteError
      await audit(supabase, user.id, 'user.deleted', 'admin_profile', body.id, { name: target.name, role: target.role, email: authTarget?.user?.email, deleted_by: adminProfile.name })
      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Método não permitido' }, 405)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Admin users error:', error)
    return jsonResponse({ error: 'Não foi possível gerenciar os usuários' }, 500)
  }
})