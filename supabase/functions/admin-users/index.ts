import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { audit, corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'
import { LEVEL_LABELS, yearsForLevel } from '../_shared/levels.ts'

const parseYears = (value: unknown) => Array.isArray(value) ? [...new Set(value.map(Number).filter((year) => [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(year)))].sort() : []

// A unidade só pode ser uma das unidades ativas cadastradas; vazio = todas as unidades.
async function resolveSchool(supabase: ReturnType<typeof import('../_shared/admin.ts').serviceClient>, value: unknown, onlyActive = true) {
  const wanted = String(value || '').trim()
  if (!wanted) return { school: null as string | null, level: null as string | null }
  let unitsQuery = supabase.from('school_units').select('name,level')
  if (onlyActive) unitsQuery = unitsQuery.eq('active', true)
  const { data, error } = await unitsQuery
  if (error) throw error
  const match = (data || []).find((unit) => unit.name.trim().toLowerCase() === wanted.toLowerCase())
  return match ? { school: match.name as string | null, level: match.level as string | null } : { error: 'Escolha uma unidade ativa cadastrada na aba Unidades' }
}

// Séries/anos permitidos dependem da etapa da unidade (Médio: 1ª a 3ª série; Fundamental: 1º ao 9º ano).
function yearsError(years: number[], level: string | null) {
  const allowed = yearsForLevel(level)
  if (years.every((year) => allowed.includes(year))) return null
  const stage = level && level in LEVEL_LABELS ? LEVEL_LABELS[level as keyof typeof LEVEL_LABELS] : 'Ensino Médio'
  return `Esta unidade (${stage}) só aceita as séries ou anos de 1 a ${allowed[allowed.length - 1]}`
}

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

      const unit = await resolveSchool(supabase, body.school)
      if ('error' in unit) return jsonResponse({ error: unit.error }, 400)
      if (role === 'staff' && !unit.school) return jsonResponse({ error: 'Escolha a unidade da equipe para definir as séries ou anos' }, 400)
      const createYearsError = yearsError(allowed_years, unit.level)
      if (createYearsError) return jsonResponse({ error: createYearsError }, 400)

      const { data: created, error: createError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })
      if (createError || !created.user) {
        // Um e-mail só pode pertencer a um usuário
        const alreadyExists = createError?.code === 'email_exists' || /already (been )?registered|already exists/i.test(createError?.message || '')
        if (alreadyExists) return jsonResponse({ error: 'Já existe um usuário cadastrado com este e-mail.' }, 409)
        return jsonResponse({ error: createError?.message || 'Não foi possível criar o acesso' }, 400)
      }
      const { data: profile, error: profileError } = await supabase.from('admin_profiles').insert({ id: created.user.id, name, role, allowed_years, school: unit.school, must_change_password: true }).select().single()
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
      let unitLevel: string | null = null
      if (typeof body.school === 'string') {
        const unit = await resolveSchool(supabase, body.school)
        if ('error' in unit) return jsonResponse({ error: unit.error }, 400)
        changes.school = unit.school
        unitLevel = unit.level
      }
      // Séries/anos precisam caber na etapa da unidade (a nova, se mudou; senão a atual do usuário)
      if (changes.allowed_years || typeof body.school === 'string') {
        const { data: current } = await supabase.from('admin_profiles').select('school,allowed_years,role').eq('id', body.id).maybeSingle()
        if (!current) return jsonResponse({ error: 'Usuário não encontrado' }, 404)
        if (typeof body.school !== 'string') {
          const existing = await resolveSchool(supabase, current.school, false)
          unitLevel = 'error' in existing ? null : existing.level
        }
        const effectiveYears = (changes.allowed_years as number[] | undefined) ?? (current.allowed_years as number[] | null) ?? []
        const patchYearsError = current.role === 'admin' ? null : yearsError(effectiveYears, unitLevel)
        if (patchYearsError) return jsonResponse({ error: patchYearsError }, 400)
      }
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