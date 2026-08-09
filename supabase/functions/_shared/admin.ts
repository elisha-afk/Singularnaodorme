import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export async function requireStaff(req: Request, adminOnly = false) {
  const authorization = req.headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token) throw new Response(JSON.stringify({ error: 'Sessão não informada' }), { status: 401, headers: corsHeaders })

  const supabase = serviceClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) throw new Response(JSON.stringify({ error: 'Sessão inválida ou expirada' }), { status: 401, headers: corsHeaders })

  const { data: profile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.active) throw new Response(JSON.stringify({ error: 'Acesso administrativo não autorizado' }), { status: 403, headers: corsHeaders })
  if (adminOnly && profile.role !== 'admin') throw new Response(JSON.stringify({ error: 'Ação exclusiva de administradores' }), { status: 403, headers: corsHeaders })

  return { supabase, user, profile }
}

export async function audit(supabase: ReturnType<typeof serviceClient>, actorId: string, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  })
  if (error) console.error('Audit log error:', error)
}