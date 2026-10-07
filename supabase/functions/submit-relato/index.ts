// supabase/functions/submit-relato/index.ts
// Edge Function para processar denúncias

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { analyzeMessage, hashOrigin, RATE_LIMIT } from '../_shared/abuse.ts'

interface RelatoData {
  tipo: string
  descricao: string
  local: string
  data_incidente: string
  envolvidos?: string
  testemunhas?: string
  severidade: string
  ano: number
  anonimo: boolean
  nome?: string
  email?: string
  telefone?: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      )
    }

    // Parse request body
    const data: RelatoData = await req.json()

    // Validações
    const validation = validateRelato(data)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.errors }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Sanitizar dados
    const sanitizedData = sanitizeRelato(data)

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Limite de envios por origem: guarda apenas um hash com sal, nunca o IP
    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'desconhecido').split(',')[0].trim()
    const originHash = await hashOrigin(ip, Deno.env.get('ABUSE_SALT') || supabaseKey)
    const windowStart = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60 * 1000).toISOString()
    const { count: recentAttempts } = await supabase
      .from('submission_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('origin_hash', originHash)
      .gte('created_at', windowStart)
    if ((recentAttempts || 0) >= RATE_LIMIT.maxRequests) {
      return new Response(
        JSON.stringify({ error: `Você já enviou ${RATE_LIMIT.maxRequests} mensagens recentemente. Aguarde até ${RATE_LIMIT.windowMinutes} minutos para enviar outra.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    await supabase.from('submission_attempts').insert({ origin_hash: originHash })
    // Os registros do limite não precisam durar: apaga o que tem mais de 24h
    await supabase.from('submission_attempts').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Filtro de palavras: apenas marca como suspeita, a denúncia é salva do mesmo jeito
    const verdict = analyzeMessage(sanitizedData.descricao, sanitizedData.envolvidos, sanitizedData.testemunhas)

    // Gerar código de rastreamento
    const trackingCode = generateTrackingCode()

    // Salvar no banco de dados
    const { data: relato, error } = await supabase
      .from('relatos')
      .insert({
        ...sanitizedData,
        suspeito: verdict.suspect,
        motivo_suspeita: verdict.reason,
        tracking_code: trackingCode,
        status: 'pendente',
        data_criacao: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar denúncia' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Enviar email de confirmação (se não anônimo)
    if (!sanitizedData.anonimo && sanitizedData.email) {
      await sendConfirmationEmail(
        sanitizedData.email,
        sanitizedData.nome || 'Usuário',
        trackingCode
      ).catch(err => console.error('Email error:', err))
    }

    // Log para auditoria
    await logActivity('relato_created', relato.id, sanitizedData.anonimo)

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        trackingCode,
        message: 'Denúncia recebida com sucesso',
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

// Validar dados do relato
function validateRelato(data: RelatoData) {
  const errors: string[] = []

  if (!data.tipo || !['bullying', 'conflito', 'sugestao'].includes(data.tipo)) {
    errors.push('Tipo de denúncia inválido')
  }

  if (!data.descricao || data.descricao.length < 20) {
    errors.push('Descrição deve ter mínimo 20 caracteres')
  }

  if (!data.local) {
    errors.push('Local é obrigatório')
  }

  if (!data.data_incidente) {
    errors.push('Data do incidente é obrigatória')
  }

  if (!data.severidade || !['leve', 'moderado', 'grave', 'critico'].includes(data.severidade)) {
    errors.push('Severidade inválida')
  }

  if (![1, 2, 3].includes(Number(data.ano))) {
    errors.push('Ano inválido')
  }

  if (!data.anonimo) {
    if (!data.nome || data.nome.length < 3) {
      errors.push('Nome deve ter mínimo 3 caracteres')
    }
    if (!data.email || !isValidEmail(data.email)) {
      errors.push('Email inválido')
    }
    if (!data.telefone || !isValidPhone(data.telefone)) {
      errors.push('Telefone inválido')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Sanitizar dados
function sanitizeRelato(data: RelatoData) {
  return {
    tipo: data.tipo?.trim().toLowerCase(),
    descricao: data.descricao?.trim().substring(0, 5000),
    local: data.local?.trim().substring(0, 255),
    data_incidente: data.data_incidente,
    envolvidos: data.envolvidos?.trim().substring(0, 1000),
    testemunhas: data.testemunhas?.trim().substring(0, 1000),
    severidade: data.severidade?.trim().toLowerCase(),
    ano: Number(data.ano),
    anonimo: data.anonimo === true,
    nome: data.anonimo ? null : data.nome?.trim().substring(0, 255),
    email: data.anonimo ? null : data.email?.trim().toLowerCase(),
    telefone: data.anonimo ? null : data.telefone?.replace(/\D/g, ''),
    destino: data.tipo === 'sugestao' ? 'orientacao' : 'coordenacao',
  }
}

// Validar email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validar telefone
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

// Gerar código de rastreamento
function generateTrackingCode(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase()
}

// Enviar email de confirmação
async function sendConfirmationEmail(email: string, name: string, code: string) {
  // TODO: Integrar com SendGrid ou similar
  console.log(`Email sent to ${email} with tracking code ${code}`)
}

// Log de atividades
async function logActivity(action: string, relateId: string, isAnonymous: boolean) {
  // TODO: Implementar logging
  console.log(`Activity: ${action} - RelateId: ${relateId} - Anonymous: ${isAnonymous}`)
}
