// ================================================
// CONFIGURAÇÃO SUPABASE - SingularNãoDorme
// ================================================
// 
// INSTRUÇÕES:
// 1. Crie uma conta em supabase.com
// 2. Crie um novo projeto
// 3. Copie a URL e a chave pública em Project Settings
// 4. Substitua os valores abaixo

// IMPORTANTE: Nunca faça commit da chave privada!
// Usar apenas a chave pública (anon key) é seguro
//
// GitHub Pages executa este arquivo como script clássico, sem variáveis de build.
const SUPABASE_URL = 'https://xcpfjuvvgzyrnqmhzibu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjcGZqdXZ2Z3p5cm5xbWh6aWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODk1NTksImV4cCI6MjEwMTg2NTU1OX0.xwFl23__rHZtacBYOyDuZ8p1igemIHILu68oRJtVgBs'

// ================================================
// FUNÇÕES DE INTEGRAÇÃO COM SUPABASE
// ================================================

/**
 * Enviar relato para o banco de dados (via Edge Function)
 */
async function submitReportToSupabase(formData) {
    try {
        const report = {
            tipo: formData.tipo,
            descricao: formData.descricao,
            local: formData.local,
            data_incidente: formData.data,
                envolvidos: formData.envolvidos,
                testemunhas: formData.testemunhas,
            severidade: formData.severity,
            anonimo: formData.isAnonymous,
            nome: formData.isAnonymous ? null : formData.name,
            email: formData.isAnonymous ? null : formData.email,
            telefone: formData.isAnonymous ? null : formData.phone,
            escola: formData.isAnonymous ? null : formData.school,
        }

        // Chamar Edge Function
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/submit-relato`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(report)
            }
        )

        if (!response.ok) {
            const error = await response.json()
            console.error('Erro ao enviar relato:', error)
            throw new Error(error.error || 'Erro ao enviar denúncia')
        }

        const data = await response.json()
        console.log('Relato enviado com sucesso:', data)
        return data
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}
/**
 * Buscar relato por código de rastreamento (via Edge Function)
 */
async function fetchReportByCode(code) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/get-relato?code=${encodeURIComponent(code)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        )

        if (!response.ok) {
            console.error('Relato não encontrado')
            return null
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Erro ao buscar relato:', error.message)
        return null
    }
}

/**
 * Enviar mensagem de contato (via Edge Function)
 */
async function submitContactForm(formData) {
    try {
        const contact = {
            nome: formData.name,
            email: formData.email,
            assunto: formData.subject,
            mensagem: formData.message,
        }

        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/submit-contato`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(contact)
            }
        )

        if (!response.ok) {
            const error = await response.json()
            console.error('Erro ao enviar contato:', error)
            throw new Error(error.error || 'Erro ao enviar mensagem')
        }

        const data = await response.json()
        console.log('Contato enviado com sucesso:', data)
        return data
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}

