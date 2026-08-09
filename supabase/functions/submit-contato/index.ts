// supabase/functions/submit-contato/index.ts
// Edge Function para processar formulário de contato

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ContatoData {
  nome: string
  email: string
  assunto?: string
  mensagem: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    const data: ContatoData = await req.json()

    // Validações
    if (!data.nome || data.nome.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome deve ter mínimo 3 caracteres' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!data.email || !isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!data.mensagem || data.mensagem.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Mensagem deve ter mínimo 10 caracteres' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Sanitizar
    const sanitized = {
      nome: data.nome.trim().substring(0, 255),
      email: data.email.trim().toLowerCase(),
      assunto: data.assunto?.trim().substring(0, 255),
      mensagem: data.mensagem.trim().substring(0, 5000),
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Salvar no banco
    const { error } = await supabase
      .from('contatos')
      .insert(sanitized)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar contato' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Enviar email de agradecimento (futuro)
    // await sendThankYouEmail(sanitized.email, sanitized.nome)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensagem recebida. Responderemos em breve!',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
