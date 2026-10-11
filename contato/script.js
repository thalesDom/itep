/**
 * ITEP - Página de Contato - JavaScript
 * Os envios do formulário chegam à área restrita (/api/lead).
 */

'use strict';

// ========================================
// GERENCIAMENTO DO MENU MOBILE
// ========================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Fechar menu ao clicar em um link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ========================================
// FORMATAÇÃO DE TELEFONE
// ========================================
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        }
        
        e.target.value = value;
    });
}

// ========================================
// VALIDAÇÃO DO FORMULÁRIO
// ========================================
function validateForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length < 3) {
        errors.push('Por favor, digite seu nome completo.');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
        errors.push('Por favor, digite um email válido.');
    }
    
    const phoneClean = formData.phone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 10) {
        errors.push('Por favor, digite um telefone válido.');
    }
    
    if (!formData.city) {
        errors.push('Por favor, selecione uma cidade.');
    }
    
    if (!formData.subject || formData.subject.trim().length < 3) {
        errors.push('Por favor, digite o assunto.');
    }
    
    if (!formData.message || formData.message.trim().length < 10) {
        errors.push('Por favor, digite uma mensagem com pelo menos 10 caracteres.');
    }
    
    return errors;
}

// ========================================
// EXIBIR MENSAGEM
// ========================================
function showFormMessage(message, type = 'success') {
    const messageDiv = document.getElementById('formMessage');
    if (!messageDiv) return;
    ITEPFeedback.show(messageDiv, {
        type: type === 'success' ? 'success' : 'info',
        title: type === 'success' ? 'Tudo certo' : 'Revise o formulário',
        text: message
    });
}

// ========================================
// ENVIO PARA A ÁREA RESTRITA
// ========================================
async function sendLead(formData) {
    const sel = document.getElementById('city');
    const csel = document.getElementById('course');
    const label = (s) => (s && s.selectedIndex > 0 ? s.options[s.selectedIndex].text.replace(/\s+-\s+MG$/, '') : '');
    const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            name: formData.name, email: formData.email, phone: formData.phone,
            city: label(sel), course: label(csel),
            subject: formData.subject, message: formData.message, source: location.pathname
        })
    });
    if (!response.ok) throw new Error('Falha ao enviar (' + response.status + ')');
}

function sendToWhatsApp(formData) {
    const whatsappNumber = (window.ITEP_WA || '5533998043901');
    
    const message = `
*CONTATO SITE ITEP*

*Dados do Interessado:*
• Nome: ${formData.name}
• E-mail: ${formData.email}
• Telefone: ${formData.phone}

*Localização:*
• Cidade: ${formData.city}

*Curso de Interesse:*
${formData.course ? `• ${formData.course}` : '• Não especificado'}

*Assunto:*
${formData.subject}

*Mensagem:*
${formData.message}

---
Enviado através do formulário de contato
    `.trim();
    
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// ========================================
// HANDLER DO FORMULÁRIO
// ========================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coleta dados
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            city: document.getElementById('city').value,
            course: document.getElementById('course').value,
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };
        
        // Valida
        const errors = validateForm(formData);
        
        if (errors.length > 0) {
            showFormMessage(errors.join(' '), 'error');
            return;
        }
        
        // Desabilita botão
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;
        
        try {
            // Envia para a área restrita
            await sendLead(formData);

            contactForm.reset();
            ITEPFeedback.show(document.getElementById('formMessage'), {
                type: 'success',
                title: 'Mensagem enviada',
                text: 'Recebemos o seu contato. Em breve a equipe do ITEP fala com você.',
                actions: [
                    { label: 'Enviar outra mensagem', primary: true, onClick: () => { ITEPFeedback.clear(document.getElementById('formMessage')); document.getElementById('name').focus(); } }
                ]
            });

        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            ITEPFeedback.show(document.getElementById('formMessage'), {
                type: 'error',
                title: 'Não foi possível enviar agora',
                text: 'Confira sua conexão e tente de novo. Se preferir, fale direto com a equipe pelo WhatsApp: seus dados continuam preenchidos.',
                actions: [
                    { label: 'Tentar novamente', primary: true, onClick: () => contactForm.requestSubmit() },
                    { label: 'Falar pelo WhatsApp', href: sendToWhatsApp(formData) }
                ]
            });

        } finally {
            // Restaura botão
            setTimeout(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }, 1000);
        }
    });
}

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// FAQ ACCORDION
// ========================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
        // Inicialmente esconde a resposta
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = 'max-height 0.3s ease';
        
        question.style.cursor = 'pointer';
        
        question.addEventListener('click', () => {
            const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '';
            
            // Fecha todos os outros
            faqItems.forEach(otherItem => {
                const otherAnswer = otherItem.querySelector('.faq-answer');
                const otherIcon = otherItem.querySelector('.faq-question i');
                if (otherAnswer && otherAnswer !== answer) {
                    otherAnswer.style.maxHeight = '0';
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Abre/fecha o atual
            const icon = question.querySelector('i');
            if (isOpen) {
                answer.style.maxHeight = '0';
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                if (icon) icon.style.transform = 'rotate(90deg)';
            }
        });
    }
});

// ========================================
// ANIMAÇÃO DE ENTRADA DOS ELEMENTOS
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observa elementos para animação
document.querySelectorAll('.info-card, .faq-item').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
});

// Adiciona classe animate quando visível
const style = document.createElement('style');
style.textContent = `
    .animate {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// ========================================
// HEADER SCROLL EFFECT
// ========================================
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        if (header) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        }
    } else {
        if (header) {
            header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
        }
    }
    
    lastScroll = currentScroll;
});

// ========================================
// VERIFICAÇÃO DE CONFIRMAÇÃO DO FORMSUBMIT
// ========================================



// ========================================
// PREVENÇÃO DE SPAM
// ========================================
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 5000; // 5 segundos entre envios

contactForm?.addEventListener('submit', (e) => {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        e.preventDefault();
        showFormMessage('Por favor, aguarde alguns segundos antes de enviar novamente.', 'error');
        return false;
    }
    lastSubmitTime = now;
}, true);

console.log('Página de contato carregada e pronta!');