/**
 * ITEP - Formulário Multi-Etapas - JavaScript
 * VERSÃO SIMPLIFICADA COM FORMSUBMIT
 */

'use strict';

// Configuração
const CONFIG = {
    emailDestino: 'thales.dominguesap94@gmail.com',
    totalSteps: 6,
    get whatsappNumber() { return window.ITEP_WA || '5533998043901'; }
};

// Estado da aplicação
let currentStep = 1;
const formData = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Formulário ITEP carregado!');
    initForm();
    setupEventListeners();
    updateProgress();
});

// Inicializa o formulário
function initForm() {
    // Formata telefone automaticamente
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', formatTelefone);
    }

    // Previne submit padrão
    const form = document.getElementById('multiStepForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// Event Listeners
function setupEventListeners() {
    // Botões de navegação
    const nextButtons = document.querySelectorAll('.btn-next');
    const backButtons = document.querySelectorAll('.btn-back');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', nextStep);
    });
    
    backButtons.forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    // Enter para avançar
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeStep = document.querySelector('.form-step.active');
            const nextBtn = activeStep?.querySelector('.btn-next');
            const submitBtn = activeStep?.querySelector('.btn-submit');
            
            if (nextBtn && !nextBtn.disabled) {
                e.preventDefault();
                nextStep();
            } else if (submitBtn && !submitBtn.disabled) {
                e.preventDefault();
                handleSubmit(e);
            }
        }
    });

    // Validação em tempo real
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            const group = this.closest('.input-group');
            if (group && group.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

// Formata telefone
function formatTelefone(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        if (value.length <= 2) {
            value = value.replace(/^(\d{0,2})/, '($1');
        } else if (value.length <= 6) {
            value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
        } else if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
    }
    
    e.target.value = value;
}

// Navega para próxima etapa
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    saveStepData(currentStep);
    currentStep++;
    updateProgress();
    showStep(currentStep);
}

// Volta para etapa anterior
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateProgress();
        showStep(currentStep);
    }
}

// Mostra etapa específica
function showStep(stepNumber) {
    const steps = document.querySelectorAll('.form-step');
    
    steps.forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        
        if (stepNum === stepNumber) {
            step.classList.add('active');
            step.classList.remove('exiting');
            
            setTimeout(() => {
                const firstInput = step.querySelector('input:not([type="hidden"]), select');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 400);
        } else {
            step.classList.remove('active');
            if (stepNum < stepNumber) {
                step.classList.add('exiting');
            } else {
                step.classList.remove('exiting');
            }
        }
    });
}

// Atualiza barra de progresso
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const currentStepEl = document.getElementById('currentStep');
    const totalStepsEl = document.getElementById('totalSteps');
    
    if (progressBar) {
        const progress = (currentStep / CONFIG.totalSteps) * 100;
        progressBar.style.width = progress + '%';
    }
    
    if (currentStepEl) {
        currentStepEl.textContent = currentStep;
    }
    
    if (totalStepsEl) {
        totalStepsEl.textContent = CONFIG.totalSteps;
    }
}

// Valida etapa atual
function validateCurrentStep() {
    const currentStepEl = document.querySelector('.form-step.active');
    const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Valida campo individual
function validateField(field) {
    const value = field.value.trim();
    const group = field.closest('.input-group');
    let isValid = true;
    let errorMessage = '';
    
    if (group) {
        group.classList.remove('error');
        const errorEl = group.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = '';
        }
    }
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
    }
    
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Digite um e-mail válido';
        }
    }
    
    if (field.id === 'telefone' && value) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Digite um telefone válido';
        }
    }
    
    if (field.id === 'nome' && value && value.length < 3) {
        isValid = false;
        errorMessage = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    if (!isValid && group) {
        group.classList.add('error');
        const errorEl = group.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = errorMessage;
        }
    }
    
    return isValid;
}

// Salva dados da etapa
function saveStepData(step) {
    const currentStepEl = document.querySelector('.form-step.active');
    const inputs = currentStepEl.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        if (input.name) {
            formData[input.name] = input.value;
        }
    });
}

// Handle submit
function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    saveStepData(currentStep);
    
    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enviando...</span>';
    }
    
    sendForm();
}

// Envia formulário
async function sendForm() {
    try {
        const form = new FormData();
        
        // Campos em português usando underscore (sem espaços)
        form.append('Nome_Completo', formData.nome || 'Não informado');
        form.append('Email', formData.email || 'Não informado');
        form.append('Telefone_WhatsApp', formData.telefone || 'Não informado');
        form.append('Cidade', formData.cidade || 'Não informado');
        form.append('Curso', formData.curso || 'Não informado');
        form.append('Data_Envio', new Date().toLocaleString('pt-BR'));
        
        // Configurações FormSubmit
        form.append('_subject', `🎓 ITEP Trilhas do Futuro - Nova Inscrição: ${formData.nome} - ${formData.curso}`);
        form.append('_template', 'table');
        form.append('_captcha', 'false');
        form.append('_cc', formData.email); // Cópia para o candidato
        
        const response = await fetch(`https://formsubmit.co/ajax/${CONFIG.emailDestino}`, {
            method: 'POST',
            body: form,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Enviado com sucesso!', result);
            currentStep = 7;
            updateProgress();
            showStep(currentStep);
            clearForm();
        } else {
            throw new Error('Erro no envio');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao enviar. Redirecionando para WhatsApp...');
        sendToWhatsApp();
        currentStep = 7;
        updateProgress();
        showStep(currentStep);
        clearForm();
    } finally {
        resetSubmitButton();
    }
}

// WhatsApp backup
function sendToWhatsApp() {
    const message = `
🎓 INSCRIÇÃO ITEP

Nome: ${formData.nome}
Email: ${formData.email}
Telefone: ${formData.telefone}
Cidade: ${formData.cidade}
Curso: ${formData.curso}
    `.trim();
    
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// Reseta botão
function resetSubmitButton() {
    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Enviar Formulário</span> <i class="fas fa-paper-plane"></i>';
    }
}

// Limpa formulário
function clearForm() {
    document.getElementById('multiStepForm').reset();
    Object.keys(formData).forEach(key => delete formData[key]);
}

console.log('✅ Sistema carregado - Email:', CONFIG.emailDestino);