import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const BLOCK_DAYS = 30

export const BLOCKED_MESSAGE = 'Você não pode enviar novas mensagens: seu acesso foi bloqueado por uso indevido do canal.'
export const WARNING_MESSAGE = 'Você já foi bloqueado uma vez por uso indevido do canal. Se isso acontecer de novo, o bloqueio será definitivo.'

type BlockRow = { id: string, block_number: number, expires_at: string | null }

// Estado de uma origem (hash): bloqueada agora, ou com aviso por já ter tido o 1º bloqueio.
export async function originState(supabase: SupabaseClient, originHash: string) {
  const { data } = await supabase
    .from('blocked_origins')
    .select('id,block_number,expires_at')
    .eq('origin_hash', originHash)
    .eq('cancelled', false)
    .order('blocked_at', { ascending: false })
  const rows = (data || []) as BlockRow[]
  const now = Date.now()
  const blocked = rows.some((row) => row.expires_at === null || new Date(row.expires_at).getTime() > now)
  const warning = !blocked && rows.some((row) => row.block_number === 1)
  return { blocked, warning, previousBlocks: rows.length }
}
