// Frontend API Integration - Atualizar script.js

// ================================================
// INTEGRAÇÃO COM EDGE FUNCTIONS
// ================================================

// Atualizar a função submitReport para chamar a Edge Function

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reportForm')
    if (!form) return

    form.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        if (validateReportForm()) {
            try {
                await submitReportViaEdgeFunction()
            } catch (error) {
                alert('Erro ao enviar denúncia: ' + error.message)
            }
        }
    })
})

async function submitReportViaEdgeFunction() {
    const form = document.getElementById('reportForm')
    const type = form.querySelector('#reportType').value
    const description = form.querySelector('#description').value
    const location = form.querySelector('#location').value
    const date = form.querySelector('#date').value
    const involved = form.querySelector('#involved').value
    const witnesses = form.querySelector('#witnesses').value
    const severity = form.querySelector('#severity').value
    const isAnonymous = form.querySelector('#isAnonymous').checked
    const name = form.querySelector('#name')?.value
    const email = form.querySelector('#email')?.value
    const phone = form.querySelector('#phone')?.value
    const school = form.querySelector('#school')?.value

    const submitBtn = form.querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'

    try {
        // Chamar Edge Function
        const response = await fetch(
            `${window.SUPABASE_URL}/functions/v1/submit-relato`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    tipo: type,
                    descricao: description,
                    local: location,
                    data_incidente: date,
                    envolvidos: involved,
                    testemunhas: witnesses,
                    severidade: severity,
                    anonimo: isAnonymous,
                    nome: isAnonymous ? null : name,
                    email: isAnonymous ? null : email,
                    telefone: isAnonymous ? null : phone,
                    escola: isAnonymous ? null : school
                })
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Erro desconhecido')
        }

        const data = await response.json()

        // Mostrar sucesso
        showSuccessMessageWithCode(data.trackingCode)
        form.reset()
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText

    } catch (error) {
        console.error('Erro:', error)
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
        alert('Erro: ' + error.message)
        throw error
    }
}

function showSuccessMessageWithCode(code) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-sm mx-4 text-center animate-in">
            <div class="text-green-500 text-5xl mb-4">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="text-2xl font-bold mb-4">Denúncia Enviada!</h2>
            <p class="text-gray-600 mb-4">Sua denúncia foi recebida com sucesso. Nossa equipe analisará o caso.</p>
            <p class="text-gray-600 mb-6 text-sm">
                Você pode rastrear sua denúncia usando o código fornecido abaixo:
            </p>
            <div class="bg-gray-100 p-4 rounded mb-6">
                <p class="text-2xl font-bold text-blue-600">#${code}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                Entendi
            </button>
        </div>
    `
    document.body.appendChild(modal)
}

// ================================================
// RASTREAMENTO DE DENÚNCIA VIA EDGE FUNCTION
// ================================================

function initTrackingFormWithEdgeFunction() {
    const form = document.getElementById('trackingForm')
    if (!form) return

    form.addEventListener('submit', async function(e) {
        e.preventDefault()
        await searchReportViaEdgeFunction()
    })
}

async function searchReportViaEdgeFunction() {
    const code = document.getElementById('trackingCode').value.trim().toUpperCase()
    const message = document.getElementById('searchMessage')

    if (!code) {
        alert('Digite o código de rastreamento')
        return
    }

    message.innerHTML = '<div class="spinner mx-auto my-4"></div>'

    try {
        const response = await fetch(
            `${window.SUPABASE_URL}/functions/v1/get-relato?code=${encodeURIComponent(code)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Denúncia não encontrada')
        }

        const report = await response.json()

        // Mostrar resultado
        message.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Código: ${code}</strong><br>
                    <strong>Tipo:</strong> ${translateTipo(report.tipo)}<br>
                    <strong>Status:</strong> <span class="font-bold">${translateStatus(report.status)}</span><br>
                    <strong>Severidade:</strong> ${translateSeveridade(report.severidade)}<br>
                    <strong>Data:</strong> ${new Date(report.data_criacao).toLocaleDateString('pt-BR')}<br>
                    ${report.resposta ? `<strong>Resposta:</strong> ${report.resposta}<br>` : ''}
                    <small>Última atualização: ${new Date(report.data_atualizacao).toLocaleDateString('pt-BR')}</small>
                </div>
            </div>
        `

    } catch (error) {
        message.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <div>${error.message}</div>
            </div>
        `
    }
}

function translateTipo(tipo) {
    const map = {
        'bullying': 'Bullying',
        'conflito': 'Conflito',
        'sugestao': 'Sugestão'
    }
    return map[tipo] || tipo
}

function translateStatus(status) {
    const map = {
        'pendente': '⏳ Pendente',
        'investigando': '🔍 Investigando',
        'resolvido': '✅ Resolvido',
        'fechado': '📝 Fechado'
    }
    return map[status] || status
}

function translateSeveridade(severidade) {
    const map = {
        'leve': '🟢 Leve',
        'moderado': '🟡 Moderado',
        'grave': '🔴 Grave',
        'critico': '🚨 Crítico'
    }
    return map[severidade] || severidade
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', function() {
    initTrackingFormWithEdgeFunction()
})
