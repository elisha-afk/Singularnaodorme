import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hashOrigin } from '../_shared/abuse.ts'
import { BLOCKED_MESSAGE, originState, WARNING_MESSAGE } from '../_shared/blocks.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Informa ao formulário público se a origem está bloqueada ou deve ver o aviso do 1º bloqueio.
// Nunca devolve datas, prazos nem quantidade de bloqueios.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, supabaseKey)
    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'desconhecido').split(',')[0].trim()
    const originHash = await hashOrigin(ip, Deno.env.get('ABUSE_SALT') || supabaseKey)
    const state = await originState(supabase, originHash)
    return new Response(
      JSON.stringify({
        blocked: state.blocked,
        warning: state.warning,
        message: state.blocked ? BLOCKED_MESSAGE : state.warning ? WARNING_MESSAGE : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Origin status error:', error)
    // Em caso de falha, não impede o envio de denúncias
    return new Response(JSON.stringify({ blocked: false, warning: false, message: null }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
