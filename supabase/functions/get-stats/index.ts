import { corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Método não permitido' }, 405)

  try {
    const { supabase } = await requireStaff(req)
    const { data, error } = await supabase.rpc('get_relato_stats')
    if (error) throw error
    return jsonResponse(data || {})
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Stats error:', error)
    return jsonResponse({ error: 'Não foi possível carregar as estatísticas' }, 500)
  }
})
