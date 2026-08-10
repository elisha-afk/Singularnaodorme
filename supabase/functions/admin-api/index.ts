import { audit, corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'

const reportFields = 'id,tracking_code,tipo,descricao,local,data_incidente,envolvidos,testemunhas,severidade,anonimo,nome,email,telefone,escola,status,resposta,data_criacao,data_atualizacao,priority,assigned_to'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { supabase, user, profile } = await requireStaff(req)
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'dashboard'

    if (req.method === 'GET' && action === 'me') return jsonResponse({ profile, email: user.email })

    if (req.method === 'GET' && action === 'staff') {
      const { data, error } = await supabase.from('admin_profiles').select('id,name,role,school').eq('active', true).order('name')
      if (error) throw error
      return jsonResponse({ staff: data || [] })
    }

    if (req.method === 'GET' && action === 'units') {
      const { data, error } = await supabase
        .from('school_units')
        .select('id,name,category,active,created_at,updated_at')
        .order('active', { ascending: false })
        .order('category')
        .order('name')
      if (error) throw error
      return jsonResponse({ units: data || [] })
    }

    if (req.method === 'PATCH' && action === 'password-changed') {
      const { error } = await supabase.from('admin_profiles').update({ must_change_password: false, updated_at: new Date().toISOString() }).eq('id', user.id)
      if (error) throw error
      await audit(supabase, user.id, 'password.changed', 'admin_profile', user.id)
      return jsonResponse({ success: true })
    }

    if (req.method === 'GET' && action === 'dashboard') {
      const count = (filters: Record<string, string> = {}) => {
        let query = supabase.from('relatos').select('id', { count: 'exact', head: true })
        Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value) })
        return query
      }
      const [total, pending, investigating, urgent, identified] = await Promise.all([
        count(), count({ status: 'pendente' }), count({ status: 'investigando' }), count({ priority: 'urgent' }), count({ anonimo: 'false' }),
      ])
      return jsonResponse({ total: total.count || 0, pending: pending.count || 0, investigating: investigating.count || 0, urgent: urgent.count || 0, identified: identified.count || 0 })
    }

    if (req.method === 'GET' && action === 'reports') {
      const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
      const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get('pageSize')) || 20))
      let query = supabase.from('relatos').select(reportFields, { count: 'exact' })
      for (const field of ['tipo', 'status', 'severidade', 'priority']) {
        const value = url.searchParams.get(field)
        if (value) query = query.eq(field, value)
      }
      const anonymous = url.searchParams.get('anonimo')
      if (anonymous === 'true' || anonymous === 'false') query = query.eq('anonimo', anonymous === 'true')
      const search = (url.searchParams.get('search') || '').replace(/[%_,()]/g, ' ').trim()
      if (search) query = query.or(`tracking_code.ilike.%${search}%,descricao.ilike.%${search}%,local.ilike.%${search}%`)
      const from = (page - 1) * pageSize
      const { data, count, error } = await query.order('data_criacao', { ascending: false }).range(from, from + pageSize - 1)
      if (error) throw error
      return jsonResponse({ reports: data || [], total: count || 0, page, pageSize })
    }

    if (req.method === 'GET' && action === 'report') {
      const id = url.searchParams.get('id')
      if (!id) return jsonResponse({ error: 'Relato não informado' }, 400)
      const [reportResult, notesResult, responsesResult] = await Promise.all([
        supabase.from('relatos').select(reportFields).eq('id', id).single(),
        supabase.from('relato_notes').select('id,content,created_at,author_id,admin_profiles(name)').eq('relato_id', id).order('created_at', { ascending: false }),
        supabase.from('relato_responses').select('id,subject,message,delivery_status,created_at,sent_at,author_id,admin_profiles(name)').eq('relato_id', id).order('created_at', { ascending: false }),
      ])
      if (reportResult.error) return jsonResponse({ error: 'Relato não encontrado' }, 404)
      return jsonResponse({ report: reportResult.data, notes: notesResult.data || [], responses: responsesResult.data || [] })
    }

    if (req.method === 'DELETE' && action === 'report') {
      if (profile.role !== 'admin') return jsonResponse({ error: 'Ação exclusiva de administradores' }, 403)
      const id = url.searchParams.get('id')
      if (!id) return jsonResponse({ error: 'Relato não informado' }, 400)

      const { data: existingReport, error: findError } = await supabase
        .from('relatos')
        .select('id,tracking_code,status')
        .eq('id', id)
        .maybeSingle()

      if (findError) throw findError
      if (!existingReport) return jsonResponse({ error: 'Relato não encontrado' }, 404)
      if (existingReport.status !== 'resolvido') return jsonResponse({ error: 'A denúncia só pode ser excluída quando estiver resolvida' }, 409)

      const { error: deleteError } = await supabase.from('relatos').delete().eq('id', id)
      if (deleteError) throw deleteError

      await audit(supabase, user.id, 'report.deleted', 'relato', id, { tracking_code: existingReport.tracking_code })
      return jsonResponse({ success: true })
    }

    if (req.method === 'PATCH' && action === 'report') {
      const body = await req.json()
      if (!body.id) return jsonResponse({ error: 'Relato não informado' }, 400)
      const changes: Record<string, unknown> = { data_atualizacao: new Date().toISOString() }
      if (['pendente', 'investigando', 'resolvido'].includes(body.status)) changes.status = body.status
      if (['low', 'normal', 'high', 'urgent'].includes(body.priority)) changes.priority = body.priority
      if (body.assigned_to === null) changes.assigned_to = null
      if (typeof body.assigned_to === 'string') {
        const { data: assignee } = await supabase.from('admin_profiles').select('id').eq('id', body.assigned_to).eq('active', true).maybeSingle()
        if (!assignee) return jsonResponse({ error: 'Responsável inválido ou desativado' }, 400)
        changes.assigned_to = body.assigned_to
      }
      const { data, error } = await supabase.from('relatos').update(changes).eq('id', body.id).select(reportFields).single()
      if (error) throw error
      await audit(supabase, user.id, 'report.updated', 'relato', body.id, changes)
      return jsonResponse({ report: data })
    }

    if (req.method === 'POST' && action === 'note') {
      const body = await req.json()
      const content = String(body.content || '').trim()
      if (!body.relato_id || content.length < 2 || content.length > 5000) return jsonResponse({ error: 'Observação inválida' }, 400)
      const { data, error } = await supabase.from('relato_notes').insert({ relato_id: body.relato_id, author_id: user.id, content }).select('id,content,created_at,author_id').single()
      if (error) throw error
      await audit(supabase, user.id, 'note.created', 'relato', body.relato_id)
      return jsonResponse({ note: { ...data, admin_profiles: { name: profile.name } } }, 201)
    }

    if (req.method === 'POST' && action === 'unit') {
      if (profile.role !== 'admin') return jsonResponse({ error: 'Ação exclusiva de administradores' }, 403)
      const body = await req.json()
      const name = String(body.name || '').trim()
      const category = String(body.category || '').trim()
      if (name.length < 2 || category.length < 2) return jsonResponse({ error: 'Informe nome e categoria da unidade' }, 400)

      const { data, error } = await supabase
        .from('school_units')
        .insert({ name, category, created_by: user.id })
        .select('id,name,category,active,created_at,updated_at')
        .single()
      if (error) {
        if (String(error.message).toLowerCase().includes('duplicate')) return jsonResponse({ error: 'Já existe uma unidade com esse nome' }, 409)
        throw error
      }
      await audit(supabase, user.id, 'unit.created', 'school_unit', data.id)
      return jsonResponse({ unit: data }, 201)
    }

    if (req.method === 'PATCH' && action === 'unit') {
      if (profile.role !== 'admin') return jsonResponse({ error: 'Ação exclusiva de administradores' }, 403)
      const body = await req.json()
      if (!body.id) return jsonResponse({ error: 'Unidade não informada' }, 400)
      if (typeof body.active !== 'boolean') return jsonResponse({ error: 'Status inválido para unidade' }, 400)

      const changes = { active: body.active, updated_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('school_units')
        .update(changes)
        .eq('id', body.id)
        .select('id,name,category,active,created_at,updated_at')
        .single()
      if (error) throw error
      await audit(supabase, user.id, 'unit.updated', 'school_unit', body.id, changes)
      return jsonResponse({ unit: data })
    }

    if (req.method === 'DELETE' && action === 'unit') {
      if (profile.role !== 'admin') return jsonResponse({ error: 'Ação exclusiva de administradores' }, 403)
      const id = url.searchParams.get('id')
      if (!id) return jsonResponse({ error: 'Unidade não informada' }, 400)

      const { data: unit, error: unitError } = await supabase
        .from('school_units')
        .select('id,name')
        .eq('id', id)
        .maybeSingle()

      if (unitError) throw unitError
      if (!unit) return jsonResponse({ error: 'Unidade não encontrada' }, 404)

      const { count, error: reportCountError } = await supabase
        .from('relatos')
        .select('id', { count: 'exact', head: true })
        .ilike('escola', unit.name)

      if (reportCountError) throw reportCountError
      if ((count || 0) > 0) return jsonResponse({ error: 'Essa unidade já possui denúncias vinculadas. Desative em vez de excluir.' }, 409)

      const { error: deleteError } = await supabase.from('school_units').delete().eq('id', id)
      if (deleteError) throw deleteError

      await audit(supabase, user.id, 'unit.deleted', 'school_unit', id, { name: unit.name })
      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Operação não encontrada' }, 404)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Admin API error:', error)
    return jsonResponse({ error: 'Não foi possível concluir a operação administrativa' }, 500)
  }
})