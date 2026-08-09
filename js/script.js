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

    return isValid;
}

function submitReport() {
    const form = document.getElementById('reportForm');
    const formData = new FormData(form);
    
    // Simular envio
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    // Aqui você integraria com Firebase ou Formspree
    // Por enquanto, simulamos sucesso após 2 segundos
    setTimeout(function() {
        showSuccessMessage();
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }, 2000);
}

function showSuccessMessage() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
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
                <p class="text-2xl font-bold text-blue-600">#${generateTrackingCode()}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                Entendi
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function generateTrackingCode() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
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

function searchReport() {
    const code = document.getElementById('trackingCode').value.trim().toUpperCase();

    if (isEmpty(code)) {
        alert('Digite o código de rastreamento');
        return;
    }

    // Simular busca
    const message = document.getElementById('searchMessage');
    message.innerHTML = '<div class="spinner mx-auto my-4"></div>';

    setTimeout(function() {
        message.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Código: ${code}</strong><br>
                    Status: <span class="font-bold">Em Análise</span><br>
                    Data: ${new Date().toLocaleDateString('pt-BR')}<br>
                    <small>Você receberá atualizações por e-mail</small>
                </div>
            </div>
        `;
    }, 1500);
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
