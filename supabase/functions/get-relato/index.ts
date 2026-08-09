// supabase/functions/get-relato/index.ts
// Edge Function para recuperar denúncia por código de rastreamento

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Extrair código de rastreamento da URL
    const url = new URL(req.url)
    const trackingCode = url.searchParams.get('code')

    if (!trackingCode || trackingCode.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Código de rastreamento inválido' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar denúncia
    const { data: relato, error } = await supabase
      .from('relatos')
      .select('id, tipo, status, data_criacao, data_atualizacao, resposta, severidade')
      .eq('tracking_code', trackingCode)
      .single()

    if (error || !relato) {
      return new Response(
        JSON.stringify({ error: 'Denúncia não encontrada' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Remover dados sensíveis
    const safeRelato = {
      ...relato,
      nome: undefined,
      email: undefined,
      telefone: undefined,
    }

    return new Response(
      JSON.stringify(safeRelato),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
