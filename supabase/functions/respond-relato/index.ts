import { audit, corsHeaders, jsonResponse, requireStaff } from '../_shared/admin.ts'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido' }, 405)

  try {
    const { supabase, user, profile } = await requireStaff(req)
    const body = await req.json()
    const subject = String(body.subject || '').trim()
    const message = String(body.message || '').trim()
    if (!body.relato_id || subject.length < 3 || message.length < 2 || message.length > 10000) return jsonResponse({ error: 'Assunto ou mensagem inválidos' }, 400)

    const { data: report, error: reportError } = await supabase.from('relatos').select('id,tracking_code,tipo,anonimo,email,nome').eq('id', body.relato_id).single()
    if (reportError || !report) return jsonResponse({ error: 'Relato não encontrado' }, 404)
    if (report.anonimo || !report.email) return jsonResponse({ error: 'Relatos anônimos não possuem endereço para resposta' }, 400)

    const { data: responseRecord, error: insertError } = await supabase.from('relato_responses').insert({
      relato_id: report.id,
      author_id: user.id,
      recipient_email: report.email,
      subject,
      message,
      delivery_status: 'pending',
    }).select().single()
    if (insertError) throw insertError

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL')
    if (!resendKey || !resendFrom) {
      await supabase.from('relato_responses').update({ delivery_status: 'failed', error_message: 'Resend não configurado' }).eq('id', responseRecord.id)
      return jsonResponse({ error: 'O envio de e-mail ainda não foi configurado. Adicione RESEND_API_KEY e RESEND_FROM_EMAIL aos secrets.' }, 503)
    }

    const greeting = report.nome ? `Olá, ${escapeHtml(report.nome)},` : 'Olá,'
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: resendFrom,
        to: [report.email],
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172554"><div style="margin-bottom:24px"><img src="https://singularnaodorme.com.br/singular-nao-dorme-logo.png" width="64" height="67" alt="SingularNãoDorme" style="display:block;border:0;object-fit:contain"><h1 style="margin:8px 0 0;color:#2457e6">SingularNãoDorme</h1></div><p>${greeting}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><p style="margin-top:28px;color:#526078">Código do relato: <strong>${escapeHtml(report.tracking_code)}</strong></p><p>Coordenação · ${escapeHtml(profile.school || 'Equipe escolar')}</p></div>`,
      }),
    })
    const resendData = await resendResponse.json().catch(() => ({}))
    if (!resendResponse.ok) {
      await supabase.from('relato_responses').update({ delivery_status: 'failed', error_message: resendData.message || 'Falha no Resend' }).eq('id', responseRecord.id)
      return jsonResponse({ error: 'O e-mail não pôde ser enviado. A tentativa ficou registrada.' }, 502)
    }

    const sentAt = new Date().toISOString()
    await Promise.all([
      supabase.from('relato_responses').update({ delivery_status: 'sent', provider_id: resendData.id, sent_at: sentAt }).eq('id', responseRecord.id),
      supabase.from('relatos').update({ resposta: message, data_atualizacao: sentAt }).eq('id', report.id),
      audit(supabase, user.id, 'response.sent', 'relato', report.id, { response_id: responseRecord.id }),
    ])
    return jsonResponse({ success: true, response: { ...responseRecord, delivery_status: 'sent', sent_at: sentAt } })
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Respond report error:', error)
    return jsonResponse({ error: 'Não foi possível enviar a resposta' }, 500)
  }
})