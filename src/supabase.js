const SUPABASE_URL = 'https://xcpfjuvvgzyrnqmhzibu.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9wjOZ3LxD2Mb11TjyCp2FA_gGPVgMlS'

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  let response
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('O envio demorou mais que o esperado. Verifique sua conexão e tente novamente.')
    throw new Error('Não foi possível conectar ao canal seguro. Verifique sua internet e tente novamente.')
  } finally {
    clearTimeout(timeout)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = Array.isArray(data.error) ? data.error.join(' ') : data.error
    if (response.status === 401 || response.status === 403) throw new Error('O canal seguro está temporariamente indisponível. Tente novamente em alguns minutos.')
    if (response.status === 429) throw new Error('Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.')
    throw new Error(details || 'Não foi possível concluir a solicitação.')
  }
  return data
}

export function submitReport(report) {
  return request('submit-relato', { method: 'POST', body: JSON.stringify(report) })
}

export function findReport(code) {
  return request(`get-relato?code=${encodeURIComponent(code)}`, { method: 'GET' })
}