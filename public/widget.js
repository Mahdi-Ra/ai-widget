(function () {
  const scriptTag = document.currentScript;
  const projectId = scriptTag.getAttribute('data-project-id');
  const color = scriptTag.getAttribute('data-color') || '#6366f1';
  const baseUrl = scriptTag.getAttribute('data-url') || 'http://localhost:3000';
  const lang = scriptTag.getAttribute('data-lang') || 'en';
  const position = scriptTag.getAttribute('data-position') || 'right';

  const i18n = {
    en: {
      title: 'AI Assistant',
      welcome: scriptTag.getAttribute('data-welcome') || 'Hi! How can I help you today?',
      placeholder: 'Type a message...',
      send: 'Send',
      error: 'Something went wrong. Please try again.',
      typing: 'Typing...',
      powered: 'Powered by',
    },
    es: {
      title: 'Asistente IA',
      welcome: scriptTag.getAttribute('data-welcome') || '¡Hola! ¿En qué puedo ayudarte?',
      placeholder: 'Escribe un mensaje...',
      send: 'Enviar',
      error: 'Algo salió mal. Inténtalo de nuevo.',
      typing: 'Escribiendo...',
      powered: 'Desarrollado por',
    },
    fr: {
      title: 'Assistant IA',
      welcome: scriptTag.getAttribute('data-welcome') || 'Bonjour! Comment puis-je vous aider?',
      placeholder: 'Écrivez un message...',
      send: 'Envoyer',
      error: 'Une erreur est survenue. Réessayez.',
      typing: 'En train d\'écrire...',
      powered: 'Propulsé par',
    },
    de: {
      title: 'KI-Assistent',
      welcome: scriptTag.getAttribute('data-welcome') || 'Hallo! Wie kann ich Ihnen helfen?',
      placeholder: 'Nachricht eingeben...',
      send: 'Senden',
      error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      typing: 'Schreibt...',
      powered: 'Bereitgestellt von',
    },
    pt: {
      title: 'Assistente IA',
      welcome: scriptTag.getAttribute('data-welcome') || 'Olá! Como posso ajudar?',
      placeholder: 'Digite uma mensagem...',
      send: 'Enviar',
      error: 'Algo deu errado. Tente novamente.',
      typing: 'Digitando...',
      powered: 'Desenvolvido por',
    },
    fa: {
      title: 'دستیار هوشمند',
      welcome: scriptTag.getAttribute('data-welcome') || 'سلام! چطور میتونم کمکت کنم؟',
      placeholder: 'پیام بنویس...',
      send: 'ارسال',
      error: 'خطایی رخ داد. دوباره امتحان کن.',
      typing: 'در حال نوشتن...',
      powered: 'ساخته شده با',
    },
  };

  const t = i18n[lang] || i18n['en'];
  const isRtl = lang === 'fa' || lang === 'ar';
  const isRight = position !== 'left';

  let conversationId = null;
  let isOpen = false;

  const style = document.createElement('style');
  style.textContent = `
    #ai-widget-btn {
      position: fixed;
      bottom: 24px;
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${color}; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #ai-widget-btn:hover { transform: scale(1.08); }
    #ai-widget-box {
      position: fixed;
      bottom: 92px;
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      z-index: 9999;
      width: 340px; height: 480px; border-radius: 16px;
      background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: none; flex-direction: column; overflow: hidden;
      font-family: system-ui, sans-serif;
      direction: ${isRtl ? 'rtl' : 'ltr'};
    }
    #ai-widget-box.open { display: flex; }
    #ai-widget-header {
      background: ${color}; color: #fff;
      padding: 16px; font-weight: 600; font-size: 15px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #ai-widget-close {
      background: none; border: none; color: #fff;
      cursor: pointer; font-size: 18px; line-height: 1; padding: 0;
      opacity: 0.8;
    }
    #ai-widget-close:hover { opacity: 1; }
    #ai-widget-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .ai-msg {
      max-width: 85%; padding: 10px 14px; border-radius: 12px;
      font-size: 14px; line-height: 1.5; word-break: break-word;
    }
    .ai-msg.bot {
      background: #f3f4f6; color: #111; align-self: flex-start;
      ${isRtl ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
    }
    .ai-msg.user {
      background: ${color}; color: #fff; align-self: flex-end;
      ${isRtl ? 'border-bottom-left-radius: 4px;' : 'border-bottom-right-radius: 4px;'}
    }
    .ai-msg.typing { color: #999; font-style: italic; }
    #ai-widget-input-row {
      display: flex; gap: 8px; padding: 12px;
      border-top: 1px solid #f0f0f0;
      flex-direction: ${isRtl ? 'row-reverse' : 'row'};
    }
    #ai-widget-input {
      flex: 1; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 8px 12px; font-size: 14px; outline: none;
      text-align: ${isRtl ? 'right' : 'left'};
    }
    #ai-widget-input:focus { border-color: ${color}; }
    #ai-widget-send {
      background: ${color}; color: #fff; border: none;
      border-radius: 8px; padding: 8px 14px;
      cursor: pointer; font-size: 14px; white-space: nowrap;
    }
    #ai-widget-powered {
      text-align: center; font-size: 11px;
      color: #bbb; padding: 4px 0 8px;
    }
    #ai-widget-powered a {
      color: ${color}; text-decoration: none; font-weight: 600;
    }
  `;
  document.head.appendChild(style);

  // دکمه
  const btn = document.createElement('button');
  btn.id = 'ai-widget-btn';
  btn.setAttribute('aria-label', t.title);
  btn.innerHTML = `<svg width="26" height="26" fill="none" viewBox="0 0 24 24">
    <path d="M12 3C6.477 3 2 6.925 2 11.75c0 2.354 1.08 4.48 2.84 6.03L4 21l3.5-1.75A11.3 11.3 0 0012 20.5c5.523 0 10-3.925 10-8.75S17.523 3 12 3z" fill="#fff"/>
  </svg>`;
  document.body.appendChild(btn);

  // باکس چت
  const box = document.createElement('div');
  box.id = 'ai-widget-box';
  box.innerHTML = `
    <div id="ai-widget-header">
      <span>${t.title}</span>
      <button id="ai-widget-close" aria-label="Close">✕</button>
    </div>
    <div id="ai-widget-messages">
      <div class="ai-msg bot">${t.welcome}</div>
    </div>
    <div id="ai-widget-input-row">
      <input id="ai-widget-input" type="text" placeholder="${t.placeholder}" autocomplete="off"/>
      <button id="ai-widget-send">${t.send}</button>
    </div>
    <div id="ai-widget-powered">
      ${t.powered} <a href="https://yoursite.com" target="_blank">YourBrand</a>
    </div>
  `;
  document.body.appendChild(box);

  // باز/بسته
  btn.addEventListener('click', () => {
    isOpen = true;
    box.classList.add('open');
    document.getElementById('ai-widget-input').focus();
  });

  document.getElementById('ai-widget-close').addEventListener('click', () => {
    isOpen = false;
    box.classList.remove('open');
  });

  // ارسال پیام
  async function sendMessage() {
    const input = document.getElementById('ai-widget-input');
    const messages = document.getElementById('ai-widget-messages');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;
    document.getElementById('ai-widget-send').disabled = true;

    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    const typing = document.createElement('div');
    typing.className = 'ai-msg bot typing';
    typing.textContent = t.typing;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: text, conversationId, lang }),
      });
      const data = await res.json();
      conversationId = data.conversationId;
      typing.classList.remove('typing');
      typing.textContent = data.reply;
    } catch (e) {
      typing.classList.remove('typing');
      typing.textContent = t.error;
    }

    input.disabled = false;
    document.getElementById('ai-widget-send').disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }

  document.getElementById('ai-widget-send').addEventListener('click', sendMessage);
  document.getElementById('ai-widget-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();