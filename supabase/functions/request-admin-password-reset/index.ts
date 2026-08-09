import { corsHeaders, jsonResponse, serviceClient } from '../_shared/admin.ts'

const recoveryResponse = {
  success: true,
  message: 'Se existir uma conta ativa para este e-mail, você receberá as instruções em instantes.',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character]!)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido' }, 405)

  try {
    const { email: rawEmail } = await req.json()
    const email = String(rawEmail || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse(recoveryResponse)

    const supabase = serviceClient()
    let authUserId = ''
    for (let page = 1; page <= 10 && !authUserId; page += 1) {
      const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
      if (usersError) throw usersError
      authUserId = usersPage.users.find((user) => user.email?.toLowerCase() === email)?.id || ''
      if (usersPage.users.length < 100) break
    }
    if (!authUserId) return jsonResponse(recoveryResponse)

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('name,active')
      .eq('id', authUserId)
      .maybeSingle()

    if (!profile?.active) return jsonResponse(recoveryResponse)

    const cooldownStart = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentRequest } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('actor_id', authUserId)
      .eq('action', 'password.reset_requested')
      .gte('created_at', cooldownStart)
      .limit(1)
      .maybeSingle()

    if (recentRequest) return jsonResponse(recoveryResponse)

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://singularnaodorme.com.br/?admin-recovery=1',
      },
    })

    if (linkError || !linkData?.user?.id || !linkData.properties?.hashed_token) {
      return jsonResponse(recoveryResponse)
    }

    const recoveryUrl = new URL('https://singularnaodorme.com.br/')
    recoveryUrl.searchParams.set('admin-recovery', '1')
    recoveryUrl.searchParams.set('token_hash', linkData.properties.hashed_token)
    recoveryUrl.hash = '/adm'

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL')
    if (!resendKey || !resendFrom) {
      console.error('Password reset email is not configured')
      return jsonResponse({ error: 'O serviço de e-mail está temporariamente indisponível.' }, 503)
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: 'Redefinição de senha do painel',
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172554"><h1 style="color:#2457e6">SingularNãoDorme</h1><p>Olá, ${escapeHtml(profile.name)}.</p><p>Recebemos uma solicitação para redefinir a senha do painel administrativo.</p><p style="margin:28px 0"><a href="${escapeHtml(recoveryUrl.toString())}" style="display:inline-block;padding:12px 18px;border-radius:7px;color:#fff;background:#2457e6;text-decoration:none;font-weight:700">Criar nova senha</a></p><p>Se você não fez esta solicitação, ignore este e-mail. O link é temporário e só pode ser usado para recuperar sua própria conta.</p></div>`,
      }),
    })

    if (!resendResponse.ok) {
      const resendData = await resendResponse.json().catch(() => ({}))
      console.error('Password reset Resend error:', resendData.message || resendResponse.status)
      return jsonResponse({ error: 'O e-mail não pôde ser enviado agora. Tente novamente mais tarde.' }, 502)
    }

    await supabase.from('audit_logs').insert({
      actor_id: authUserId,
      action: 'password.reset_requested',
      entity_type: 'admin_profile',
      entity_id: authUserId,
    })

    return jsonResponse(recoveryResponse)
  } catch (error) {
    console.error('Password reset request error:', error)
    return jsonResponse({ error: 'Não foi possível processar a solicitação.' }, 500)
  }
})
