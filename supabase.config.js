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

const SUPABASE_URL = 'https://seu-projeto.supabase.co'
const SUPABASE_ANON_KEY = 'sua-chave-publica-aqui'

// Importar Supabase
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>

const { createClient } = window.supabase

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ================================================
// FUNÇÕES DE INTEGRAÇÃO COM SUPABASE
// ================================================

/**
 * Enviar relato para o banco de dados
 */
async function submitReportToSupabase(formData) {
    try {
        const report = {
            tipo: formData.tipo,
            descricao: formData.descricao,
            local: formData.local,
            data_incidente: formData.data,
            envolvidos: formData.involved,
            testemunhas: formData.witnesses,
            severidade: formData.severity,
            anônimo: formData.isAnonymous,
            nome: formData.isAnonymous ? null : formData.name,
            email: formData.isAnonymous ? null : formData.email,
            telefone: formData.isAnonymous ? null : formData.phone,
            escola: formData.isAnonymous ? null : formData.school,
            status: 'pendente',
            data_criacao: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('relatos')
            .insert([report])
            .select()

        if (error) {
            console.error('Erro ao enviar relato:', error)
            throw error
        }

        console.log('Relato enviado com sucesso:', data)
        return data[0]
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}

/**
 * Buscar relato por código de rastreamento
 */
async function fetchReportByCode(code) {
    try {
        const { data, error } = await supabase
            .from('relatos')
            .select('*')
            .eq('id', code)
            .single()

        if (error) {
            console.error('Relato não encontrado:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Erro ao buscar relato:', error.message)
        return null
    }
}

/**
 * Enviar mensagem de contato
 */
async function submitContactForm(formData) {
    try {
        const contact = {
            nome: formData.name,
            email: formData.email,
            assunto: formData.subject,
            mensagem: formData.message,
            data_envio: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('contatos')
            .insert([contact])
            .select()

        if (error) {
            console.error('Erro ao enviar contato:', error)
            throw error
        }

        console.log('Contato enviado com sucesso:', data)
        return data[0]
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}

/**
 * Listar todos os relatos (Admin)
 * CUIDADO: Apenas para administradores autenticados
 */
async function fetchAllReports() {
    try {
        const { data, error } = await supabase
            .from('relatos')
            .select('*')
            .order('data_criacao', { ascending: false })

        if (error) {
            console.error('Erro ao listar relatos:', error)
            return []
        }

        return data
    } catch (error) {
        console.error('Erro:', error.message)
        return []
    }
}

/**
 * Atualizar status de um relato
 */
async function updateReportStatus(reportId, status, resposta) {
    try {
        const { data, error } = await supabase
            .from('relatos')
            .update({
                status: status,
                resposta: resposta,
                data_atualizacao: new Date().toISOString()
            })
            .eq('id', reportId)
            .select()

        if (error) {
            console.error('Erro ao atualizar relato:', error)
            throw error
        }

        return data[0]
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}

/**
 * Listar estatísticas (Admin)
 */
async function getStatistics() {
    try {
        const { data, error } = await supabase
            .from('relatos')
            .select('tipo, severidade, status')

        if (error) {
            console.error('Erro ao buscar estatísticas:', error)
            return null
        }

        // Processar dados
        const stats = {
            total: data.length,
            por_tipo: {},
            por_severidade: {},
            por_status: {}
        }

        data.forEach(report => {
            // Contar por tipo
            stats.por_tipo[report.tipo] = (stats.por_tipo[report.tipo] || 0) + 1

            // Contar por severidade
            stats.por_severidade[report.severidade] = (stats.por_severidade[report.severidade] || 0) + 1

            // Contar por status
            stats.por_status[report.status] = (stats.por_status[report.status] || 0) + 1
        })

        return stats
    } catch (error) {
        console.error('Erro:', error.message)
        return null
    }
}

/**
 * Deletar um relato (Admin)
 * CUIDADO: Ação irreversível
 */
async function deleteReport(reportId) {
    try {
        const { error } = await supabase
            .from('relatos')
            .delete()
            .eq('id', reportId)

        if (error) {
            console.error('Erro ao deletar relato:', error)
            throw error
        }

        console.log('Relato deletado com sucesso')
    } catch (error) {
        console.error('Erro:', error.message)
        throw error
    }
}

// ================================================
// EXPORTAR PARA USO EM OUTROS ARQUIVOS
// ================================================

// ================================================
// INSTRUÇÕES DE USO
// ================================================
//
// 1. INCLUIR NO HTML:
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
//    <script src="supabase.config.js"></script>
//
// 2. NO JAVASCRIPT DO FORMULÁRIO:
//    - Chamar submitReportToSupabase(formData) ao enviar
//    - Chamar fetchReportByCode(code) para rastrear
//    - Chamar submitContactForm(formData) para contatos
//
// 3. EXEMPLO:
//    const formData = {
//      tipo: 'bullying',
//      descricao: 'Fui xingado...',
//      local: 'Pátio da escola',
//      data: '2026-08-09',
//      involved: 'João da Silva',
//      witnesses: 'Maria e Pedro',
//      severity: 'moderado',
//      isAnonymous: true
//    }
//    submitReportToSupabase(formData)

// Se usar módulos ES6, descomente:
// export { supabase, submitReportToSupabase, fetchReportByCode, submitContactForm }
