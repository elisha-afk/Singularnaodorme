import { corsHeaders, jsonResponse, serviceClient } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Método não permitido' }, 405)

  try {
    const supabase = serviceClient()
    const { data, error } = await supabase
      .from('school_units')
      .select('id,name,category')
      .eq('active', true)
      .order('category')
      .order('name')

    if (error) throw error
    return jsonResponse({ units: data || [] })
  } catch (error) {
    console.error('School units list error:', error)
    return jsonResponse({ error: 'Não foi possível carregar as unidades.' }, 500)
  }
})
