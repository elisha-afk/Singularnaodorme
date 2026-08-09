// ================================================
// SCRIPT PRINCIPAL - SingularNãoDorme
// ================================================

// ====== MENU MOBILE ======
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Fechar menu ao clicar em um link
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }
});

// ====== VALIDAÇÃO DE FORMULÁRIOS ======

// Validar email
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validar telefone
function isValidPhone(phone) {
    const regex = /^(\d{10}|\d{11})$/;
    return regex.test(phone.replace(/\D/g, ''));
}

// Validar se o campo está vazio
function isEmpty(value) {
    return value.trim() === '';
}

// Validar comprimento mínimo
function minLength(value, min) {
    return value.length >= min;
}

// Mostrar erro em um campo
function showError(input, message) {
    input.classList.add('border-red-500');
    input.classList.remove('border-gray-300');
    
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('error-message')) {
        errorDiv = document.createElement('p');
        errorDiv.className = 'error-message text-red-500 text-sm mt-1';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = message;
}

// Limpar erro
function clearError(input) {
    input.classList.remove('border-red-500');
    input.classList.add('border-gray-300');
    
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
        errorDiv.remove();
    }
}

// ====== FORMULÁRIO DE RELATO ======

function initReportForm() {
    const form = document.getElementById('reportForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateReportForm()) {
            submitReport();
        }
    });

    // Limpar erros ao digitar
    const inputs = form.querySelectorAll('.form-input, .form-textarea, .form-select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearError(this);
        });
    });
}

function validateReportForm() {
    const form = document.getElementById('reportForm');
    const type = form.querySelector('#reportType').value;
    const description = form.querySelector('#description').value;
    const location = form.querySelector('#location').value;
    const date = form.querySelector('#date').value;
    const name = form.querySelector('#name').value;
    const email = form.querySelector('#email').value;
    const phone = form.querySelector('#phone').value;
    const isAnonymous = form.querySelector('#isAnonymous').checked;
        const severity = form.querySelector('#severity').value;
        const agreeTerms = form.querySelector('#agreeTerms').checked;

    let isValid = true;

    // Validar tipo
    if (isEmpty(type)) {
        showError(form.querySelector('#reportType'), 'Selecione o tipo de denúncia');
        isValid = false;
    }

    // Validar descrição
    if (isEmpty(description)) {
        showError(form.querySelector('#description'), 'Descreva o ocorrido em detalhes');
        isValid = false;
    } else if (!minLength(description, 20)) {
        showError(form.querySelector('#description'), 'Mínimo de 20 caracteres');
        isValid = false;
    }

    // Validar local
    if (isEmpty(location)) {
        showError(form.querySelector('#location'), 'Indique o local do incidente');
        isValid = false;
    }

    // Validar data
    if (isEmpty(date)) {
        showError(form.querySelector('#date'), 'Indique a data do incidente');
        isValid = false;
    }

        if (isEmpty(severity)) {
            showError(form.querySelector('#severity'), 'Selecione o nível de severidade');
            isValid = false;
        }

    // Se não anônimo, validar dados de contato
    if (!isAnonymous) {
        if (isEmpty(name)) {
            showError(form.querySelector('#name'), 'Seu nome é obrigatório');
            isValid = false;
        }

        if (isEmpty(email)) {
            showError(form.querySelector('#email'), 'E-mail obrigatório');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError(form.querySelector('#email'), 'E-mail inválido');
            isValid = false;
        }

        if (isEmpty(phone)) {
            showError(form.querySelector('#phone'), 'Telefone obrigatório');
            isValid = false;
        } else if (!isValidPhone(phone)) {
            showError(form.querySelector('#phone'), 'Telefone deve ter 10 ou 11 dígitos');
            isValid = false;
        }
    }

        if (!agreeTerms) {
            showFormError('Você precisa concordar com os Termos de Uso e a Política de Privacidade.');
            isValid = false;
        }

    return isValid;
}

async function submitReport() {
    const form = document.getElementById('reportForm');
    const isAnonymous = form.querySelector('#isAnonymous').checked;

    const formData = {
        tipo: form.querySelector('#reportType').value,
        descricao: form.querySelector('#description').value,
        local: form.querySelector('#location').value,
        data: form.querySelector('#date').value,
        envolvidos: form.querySelector('#involved').value,
        testemunhas: form.querySelector('#witnesses').value,
        severity: form.querySelector('#severity').value,
        isAnonymous: isAnonymous,
        name: isAnonymous ? null : form.querySelector('#name').value,
        email: isAnonymous ? null : form.querySelector('#email').value,
        phone: isAnonymous ? null : form.querySelector('#phone').value,
        school: isAnonymous ? null : form.querySelector('#school').value,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const result = await submitReportToSupabase(formData);
        showSuccessMessage(result.trackingCode);
        form.reset();
        // Restaurar aba ativa
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-gray-300', 'text-gray-700');
        });
        document.querySelector('.tab-btn[data-tab="bullying"]').classList.add('bg-blue-600', 'text-white');
        document.querySelector('.tab-btn[data-tab="bullying"]').classList.remove('bg-gray-300', 'text-gray-700');
        document.getElementById('reportType').value = 'bullying';
    } catch (error) {
        showFormError(error.message || 'Erro ao enviar denúncia. Tente novamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showSuccessMessage(trackingCode) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    const code = trackingCode || '---';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div class="text-green-500 text-5xl mb-4">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="text-2xl font-bold mb-4">Denúncia Enviada!</h2>
            <p class="text-gray-600 mb-4">Sua denúncia foi recebida com sucesso. Nossa equipe analisará o caso.</p>
            <p class="text-gray-600 mb-2 text-sm font-bold">Seu código de rastreamento:</p>
            <div class="bg-blue-50 border-2 border-blue-300 p-4 rounded mb-6">
                <p class="text-2xl font-bold text-blue-600 tracking-widest">${code}</p>
                <p class="text-xs text-gray-500 mt-1">Guarde este código para acompanhar sua denúncia</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                Entendi
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showFormError(message) {
    const form = document.getElementById('reportForm');
    let errorDiv = form.querySelector('.form-submit-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'form-submit-error alert alert-error mt-4';
        form.querySelector('.flex.gap-4').after(errorDiv);
    }
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i><div>${message}</div>`;
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ====== TOGGLE ANONIMATO ======

function initAnonymousToggle() {
    const toggle = document.getElementById('isAnonymous');
    const contactFields = document.getElementById('contactFields');

    if (toggle && contactFields) {
        toggle.addEventListener('change', function() {
            if (this.checked) {
                contactFields.classList.add('hidden');
                // Limpar validação dos campos ocultos
                contactFields.querySelectorAll('.form-input, .form-textarea').forEach(input => {
                    clearError(input);
                });
            } else {
                contactFields.classList.remove('hidden');
            }
        });
    }
}

// ====== BUSCAR RELATO ======

function initTrackingForm() {
    const form = document.getElementById('trackingForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        searchReport();
    });
}

async function searchReport() {
    const code = document.getElementById('trackingCode').value.trim().toUpperCase();

    if (isEmpty(code)) {
        alert('Digite o código de rastreamento');
        return;
    }

    const message = document.getElementById('searchMessage');
    message.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i><p class="text-gray-600 mt-2">Buscando...</p></div>';

    try {
        const data = await fetchReportByCode(code);

        if (!data) {
            message.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-times-circle"></i>
                    <div><strong>Código não encontrado.</strong><br>Verifique o código e tente novamente.</div>
                </div>
            `;
            return;
        }

        const statusMap = {
            pendente: { label: 'Pendente', color: 'text-yellow-600', icon: 'fa-clock' },
            investigando: { label: 'Em Investigação', color: 'text-blue-600', icon: 'fa-search' },
            resolvido: { label: 'Resolvido', color: 'text-green-600', icon: 'fa-check-circle' },
            fechado: { label: 'Fechado', color: 'text-gray-600', icon: 'fa-lock' },
        };
        const tipoMap = { bullying: 'Bullying', conflito: 'Conflito', sugestao: 'Sugestão' };

        const status = statusMap[data.status] || { label: data.status, color: 'text-gray-600', icon: 'fa-info-circle' };
        const dataFormatada = data.data_criacao
            ? new Date(data.data_criacao).toLocaleDateString('pt-BR')
            : 'N/A';

        message.innerHTML = `
            <div class="bg-white border-2 border-blue-200 rounded-lg p-6 mt-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-lg">Denúncia #${code}</h3>
                    <span class="font-bold ${status.color}"><i class="fas ${status.icon} mr-1"></i>${status.label}</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><strong>Tipo:</strong> ${tipoMap[data.tipo] || data.tipo}</p>
                    <p><strong>Data do envio:</strong> ${dataFormatada}</p>
                    ${data.severidade ? `<p><strong>Gravidade:</strong> ${data.severidade}</p>` : ''}
                    ${data.resposta ? `<div class="mt-4 bg-green-50 border border-green-200 rounded p-4"><p class="font-bold text-green-700 mb-1">Resposta da equipe:</p><p>${data.resposta}</p></div>` : '<p class="text-gray-400 italic">Aguardando análise da equipe.</p>'}
                </div>
            </div>
        `;
    } catch (error) {
        message.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <div>Erro ao buscar denúncia. Tente novamente.</div>
            </div>
        `;
    }
}

// ====== PERGUNTAS FREQUENTES ======

function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', function() {
            // Fechar outros itens abertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.faq-answer').classList.add('hidden');
                    otherItem.querySelector('.faq-question').classList.remove('bg-blue-100');
                }
            });

            // Toggle item atual
            answer.classList.toggle('hidden');
            question.classList.toggle('bg-blue-100');
        });
    });
}

// ====== MODO ESCURO (FUTURO) ======

function initDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (prefersDark.matches) {
        // Implementar modo escuro aqui se necessário
        console.log('Preferência por modo escuro detectada');
    }
}

// ====== INICIALIZAR TUDO ======

document.addEventListener('DOMContentLoaded', function() {
    initReportForm();
    initAnonymousToggle();
    initTrackingForm();
    initFAQ();
    initDarkMode();

    // Adicionar classe fade-in aos elementos
    document.querySelectorAll('section').forEach((section, index) => {
        setTimeout(() => {
            section.classList.add('fade-in');
        }, index * 100);
    });
});

// ====== UTILITÁRIOS ======

// Formatar telefone enquanto digita
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    
    input.value = value;
}

// Scroll suave para âncoras
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Log de inicialização
console.log('✅ SingularNãoDorme - Script Carregado com Sucesso');
