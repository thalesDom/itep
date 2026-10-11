/**
 * ITEP - Página de Contato - JavaScript
 * Envio de email GRATUITO usando FormSubmit.co
 * Email configurado: thales.dominguesap94@gmail.com
 */

'use strict';

// ========================================
// CONFIGURAÇÃO DO EMAIL
// ========================================
const EMAIL_DESTINATION = 'thales.dominguesap94@gmail.com';

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
    
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 10000);
    }
}

// ========================================
// ENVIAR EMAIL COM FORMSUBMIT
// ========================================
async function sendEmailWithFormSubmit(formData) {
    const form = new FormData();
    
    // Dados do formulário TRADUZIDOS para português
    form.append('Nome Completo', formData.name);
    form.append('E-mail', formData.email);
    form.append('Telefone / WhatsApp', formData.phone);
    form.append('Cidade de Interesse', formData.city);
    form.append('Curso de Interesse', formData.course || 'Não especificado');
    form.append('Assunto', formData.subject);
    form.append('Mensagem', formData.message);
    
    // Adiciona informações extras
    const dataAtual = new Date().toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short'
    });
    form.append('Data e Hora do Envio', dataAtual);
    form.append('Origem', 'Site ITEP - Página de Contato');
    
    // Configurações do FormSubmit com TRADUÇÃO COMPLETA
    form.append('_subject', `🎓 ITEP Trilhas do Futuro - Novo Contato: ${formData.subject}`);
    form.append('_captcha', 'false');
    form.append('_template', 'table');
    form.append('_cc', formData.email); // Envia cópia para o remetente
    form.append('_language', 'pt'); // ✅ TRADUZ AS MENSAGENS DO FORMSUBMIT PARA PORTUGUÊS
    
    // Personalizações do email
    form.append('_replyto', formData.email); // Responder direto para o remetente
    form.append('_autoresponse', `Olá ${formData.name.split(' ')[0]}!

Recebemos sua mensagem através do site do ITEP - Trilhas do Futuro!

📋 Resumo da sua solicitação:
• Assunto: ${formData.subject}
• Cidade: ${formData.city}
• Curso: ${formData.course || 'Não especificado'}

Nossa equipe analisará sua mensagem e retornará em breve.

Atenciosamente,
Equipe ITEP - Instituto Técnico Educacional Polivalente
Trilhas do Futuro

📱 WhatsApp: (33) 9 9804-3901
📧 Email: contato@itep.edu.br
🌐 www.itep.edu.br`);
    
    const response = await fetch(`https://formsubmit.co/ajax/${EMAIL_DESTINATION}`, {
        method: 'POST',
        body: form,
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Erro ao enviar email');
    }
    
    return response.json();
}

// ========================================
// ALTERNATIVA: ENVIAR COM TEMPLATE HTML PERSONALIZADO
// ========================================
async function sendEmailWithCustomTemplate(formData) {
    // Cria um email HTML bonito e personalizado
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1B5E20, #4CAF50); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; margin: 15px 0; }
        .info-label { font-weight: bold; color: #1B5E20; min-width: 180px; }
        .info-value { color: #666; }
        .message-box { background: #e8f5e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 ITEP - Trilhas do Futuro</h1>
            <p>Novo Contato Recebido</p>
        </div>
        
        <div class="content">
            <h2 style="color: #1B5E20; margin-top: 0;">Informações do Contato</h2>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">👤 Nome Completo:</span>
                    <span class="info-value">${formData.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📧 E-mail:</span>
                    <span class="info-value">${formData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📱 Telefone/WhatsApp:</span>
                    <span class="info-value">${formData.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📍 Cidade de Interesse:</span>
                    <span class="info-value">${formData.city}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📚 Curso de Interesse:</span>
                    <span class="info-value">${formData.course || 'Não especificado'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📋 Assunto:</span>
                    <span class="info-value">${formData.subject}</span>
                </div>
            </div>
            
            <h3 style="color: #1B5E20;">💬 Mensagem:</h3>
            <div class="message-box">
                ${formData.message.replace(/\n/g, '<br>')}
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
                📅 Enviado em: ${new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}<br>
                🌐 Origem: Site ITEP - Página de Contato
            </p>
        </div>
        
        <div class="footer">
            <p><strong>ITEP - Instituto Técnico Educacional Polivalente</strong></p>
            <p>Trilhas do Futuro</p>
            <p>📱 (33) 9 9804-3901 | 📧 contato@itep.edu.br</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const form = new FormData();
    
    // Envia o HTML customizado
    form.append('_html', emailHTML);
    
    // Configurações com tradução
    form.append('_subject', `🎓 ITEP - Novo Contato: ${formData.subject}`);
    form.append('_captcha', 'false');
    form.append('_cc', formData.email);
    form.append('_replyto', formData.email);
    form.append('_language', 'pt'); // ✅ TRADUÇÃO
    
    // Resposta automática para o cliente
    form.append('_autoresponse', `Olá ${formData.name.split(' ')[0]}!

✅ Recebemos sua mensagem com sucesso!

Sua solicitação foi registrada e nossa equipe do ITEP entrará em contato em breve.

📋 Resumo do seu contato:
• Assunto: ${formData.subject}
• Cidade: ${formData.city}
• Curso: ${formData.course || 'Não especificado'}

Enquanto isso, você pode:
📱 Nos chamar no WhatsApp: (33) 9 9804-3901
🌐 Acessar nosso site: www.itep.edu.br
📘 Conhecer nossos cursos: www.itep.edu.br/cursos

Atenciosamente,
Equipe ITEP - Trilhas do Futuro
Instituto Técnico Educacional Polivalente

"Transformando vidas através da educação"
`);
    
    const response = await fetch(`https://formsubmit.co/ajax/${EMAIL_DESTINATION}`, {
        method: 'POST',
        body: form,
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Erro ao enviar email');
    }
    
    return response.json();
}

// ========================================
// ESCOLHER QUAL MÉTODO USAR
// ========================================
// Descomente as linhas abaixo para usar o template HTML personalizado
// async function sendEmailWithFormSubmit(formData) {
//     return await sendEmailWithCustomTemplate(formData);
// }

function sendToWhatsApp(formData) {
    const whatsappNumber = (window.ITEP_WA || '5533998043901');
    
    const message = `
🎓 *CONTATO SITE ITEP*

👤 *Dados do Interessado:*
• Nome: ${formData.name}
• E-mail: ${formData.email}
• Telefone: ${formData.phone}

📍 *Localização:*
• Cidade: ${formData.city}

📚 *Curso de Interesse:*
${formData.course ? `• ${formData.course}` : '• Não especificado'}

📋 *Assunto:*
${formData.subject}

💬 *Mensagem:*
${formData.message}

---
✅ Enviado através do formulário de contato
    `.trim();
    
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
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
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando email...';
        submitBtn.disabled = true;
        
        try {
            // Envia email via FormSubmit
            const response = await sendEmailWithFormSubmit(formData);
            
            console.log('✅ Email enviado com sucesso:', response);
            
            // Sucesso!
            showFormMessage(
                '✅ Mensagem enviada com sucesso! Você receberá uma confirmação no seu email e entraremos em contato em breve.',
                'success'
            );
            
            // Limpa formulário
            contactForm.reset();
            
            // Oferece WhatsApp como opção adicional
            setTimeout(() => {
                if (confirm('✅ Email enviado! Deseja também enviar uma cópia via WhatsApp para resposta mais rápida?')) {
                    sendToWhatsApp(formData);
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            
            // Em caso de erro, usa WhatsApp
            showFormMessage(
                '⚠️ Não foi possível enviar o email neste momento. Vamos redirecioná-lo para o WhatsApp...', 
                'error'
            );
            
            setTimeout(() => {
                sendToWhatsApp(formData);
                contactForm.reset();
            }, 2000);
            
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
// IMPORTANTE: Na primeira vez que usar, você receberá um email
// de confirmação do FormSubmit. Clique no link para ativar!

window.addEventListener('DOMContentLoaded', () => {
    console.log(`
🎓 ITEP - Sistema de Contato Ativado
=====================================
✅ JavaScript carregado com sucesso
📧 Email destino: ${EMAIL_DESTINATION}
📱 WhatsApp backup: (33) 9 9804-3901
🌍 Idioma: Português (pt-BR)

⚠️  IMPORTANTE - PRIMEIRA VEZ:
   1. Ao enviar o primeiro email, você receberá
      uma mensagem de confirmação do FormSubmit
      no email: ${EMAIL_DESTINATION}
   
   2. Abra o email e clique no link de confirmação
   
   3. Após confirmar, todos os formulários futuros
      serão enviados automaticamente!

📝 RECURSOS ATIVOS:
   ✓ Envio de email gratuito (FormSubmit)
   ✓ Mensagens em PORTUGUÊS (_language: 'pt')
   ✓ Cópia automática para o remetente
   ✓ Validação completa do formulário
   ✓ WhatsApp como backup
   ✓ Formatação automática de telefone
   ✓ Animações suaves
   ✓ Menu responsivo

🚀 Tudo pronto para receber contatos!
    `);
});

// ========================================
// PREVENÇÃO DE SPAM
// ========================================
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 5000; // 5 segundos entre envios

contactForm?.addEventListener('submit', (e) => {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        e.preventDefault();
        showFormMessage('⏳ Por favor, aguarde alguns segundos antes de enviar novamente.', 'error');
        return false;
    }
    lastSubmitTime = now;
}, true);

console.log('✅ Página de contato carregada e pronta!');