/**
 * AsiaConsole AI Assistant - "AsiaBot"
 * Semi-intelligent chat helper
 */

const AIAssistant = (() => {
    let settings = {};
    let isVisible = false;
    let messages = [];

    const init = () => {
        if (window._aiInited) return;
        window._aiInited = true;

        try {
            settings = JSON.parse(localStorage.getItem('tc_settings') || '{}');
        } catch (e) { settings = {}; }

        if (settings.aiEnabled !== true) return;

        createUI();
        addStyles();

        // Initial greeting
        setTimeout(() => {
            addMessage('assistant', settings.aiGreeting || 'Selam! Ben AsiaBot. AsiaConsole dünyasında sana rehberlik etmek için buradayım. Bugün senin için ne yapabilirim?');
        }, 1000);
    };

    const addStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .ai-widget {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 9000;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 1rem;
                font-family: 'Inter', sans-serif;
            }
            .ai-bubble {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--accent-blue);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(79, 142, 247, 0.4);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .ai-bubble:hover { transform: scale(1.1); }
            
            .ai-chat-window {
                width: 320px;
                height: 450px;
                background: rgba(13, 17, 23, 0.95);
                backdrop-filter: blur(15px);
                border: 1px solid var(--border);
                border-radius: 20px;
                display: none;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .ai-chat-window.active { display: flex; }
            
            .ai-header {
                padding: 1rem 1.25rem;
                background: rgba(255,255,255,0.03);
                border-bottom: 1px solid var(--border);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .ai-header-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
            }
            .ai-header-name {
                font-weight: 700;
                font-size: 0.95rem;
                color: var(--text-primary);
            }

            .ai-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .msg {
                max-width: 85%;
                padding: 0.65rem 0.85rem;
                border-radius: 12px;
                font-size: 0.875rem;
                line-height: 1.4;
            }
            .msg-assistant {
                align-self: flex-start;
                background: rgba(255,255,255,0.05);
                color: var(--text-secondary);
                border-bottom-left-radius: 2px;
            }
            .msg-user {
                align-self: flex-end;
                background: var(--accent-blue);
                color: white;
                border-bottom-right-radius: 2px;
            }

            .ai-input-area {
                padding: 1rem;
                border-top: 1px solid var(--border);
                display: flex;
                gap: 0.5rem;
            }
            .ai-input {
                flex: 1;
                background: rgba(255,255,255,0.05);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 0.5rem 0.75rem;
                color: white;
                font-size: 0.85rem;
                outline: none;
            }
            .ai-submit {
                background: none;
                border: none;
                color: var(--accent-blue);
                font-size: 1.2rem;
            }
            .typing {
                display: flex;
                gap: 4px;
                padding: 0.8rem 1rem !important;
            }
            .dot {
                width: 6px;
                height: 6px;
                background: var(--text-muted);
                border-radius: 50%;
                animation: ai-bounce 1.4s infinite ease-in-out both;
            }
            .dot:nth-child(1) { animation-delay: -0.32s; }
            .dot:nth-child(2) { animation-delay: -0.16s; }

            @keyframes ai-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }
        `;
        document.head.appendChild(style);
    };

    const createUI = () => {
        const widget = document.createElement('div');
        widget.className = 'ai-widget';
        widget.innerHTML = `
            <div class="ai-chat-window" id="aiChatWindow">
                <div class="ai-header">
                    <div class="ai-header-status"></div>
                    <div class="ai-header-name">${settings.aiName || 'AsiaBot'}</div>
                    <button id="closeAiChat" style="margin-left:auto; background:none; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
                </div>
                <div class="ai-messages" id="aiMessages"></div>
                <div class="ai-input-area">
                    <input type="text" class="ai-input" id="aiInput" placeholder="Bir şeyler yazın...">
                    <button class="ai-submit" id="aiSend">➔</button>
                </div>
            </div>
            <div class="ai-bubble" id="aiToggle">🤖</div>
        `;
        document.body.appendChild(widget);

        document.getElementById('aiToggle').addEventListener('click', toggleChat);
        document.getElementById('closeAiChat').addEventListener('click', toggleChat);
        document.getElementById('aiSend').addEventListener('click', handleSend);
        document.getElementById('aiInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    };

    const toggleChat = () => {
        const win = document.getElementById('aiChatWindow');
        isVisible = !isVisible;
        win.classList.toggle('active', isVisible);
        if (isVisible) document.getElementById('aiInput').focus();
    };

    const addMessage = (role, text) => {
        const container = document.getElementById('aiMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg msg-${role}`;
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
        messages.push({ role, text });
    };

    const handleSend = async () => {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage('user', text);

        // Show typing indicator
        const typingId = addTypingIndicator();

        try {
            const reply = await generateResponse(text);
            removeTypingIndicator(typingId);
            addMessage('assistant', reply);
        } catch (err) {
            removeTypingIndicator(typingId);
            addMessage('assistant', 'Üzgünüm, bir hata oluştu. Lütfen bağlantınızı kontrol edin.');
            console.error('AI Error:', err);
        }
    };

    const addTypingIndicator = () => {
        const container = document.getElementById('aiMessages');
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-assistant typing';
        msgDiv.id = id;
        msgDiv.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
        return id;
    };

    const removeTypingIndicator = (id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
    };

    const generateResponse = async (text) => {
        // If API Key is set, use Gemini Live
        if (settings.geminiApiKey && settings.geminiApiKey.length > 20) {
            return await fetchGeminiResponse(text);
        }

        // Fallback to Simulator
        const input = text.toLowerCase().trim();
        await new Promise(r => setTimeout(r, 600)); // Simulate delay

        // 1. Greetings & Well-being
        if (input.match(/^(merhaba|selam|hey|hi|hello)/)) {
            return `Merhaba! Ben ${settings.aiName || 'AsiaBot'}. AsiaConsole dünyasında sana rehberlik etmek için buradayım. Bugün senin için ne yapabilirim?`;
        }
        if (input.match(/^(naber|nasılsın|ne haber|nasıl gidiyor)/)) {
            return `Harikayım, teşekkürler! 🚀 Teknolojinin kalbinde, AsiaConsole verileri arasında geziniyorum. Sen nasılsın? Sana nasıl yardımcı olabilirim?`;
        }
        if (input.match(/^(iyiyim|güzel|süper|iyi)/)) {
            return `Bunu duyduğuma çok sevindim! 😊 Sitedeki yeni özellikleri keşfettin mi? İstersen sana forumdaki son tartışmalardan bahsedebilirim.`;
        }

        // 2. Identity & Capabilities
        if (input.includes('kimsin') || input.includes('nesin') || input.includes('adın ne')) {
            return `Ben AsiaBot! AsiaConsole platformu için özel olarak geliştirilmiş bir asistan yapay zekayım. Sana site kullanımı, teknik bilgiler ve topluluk hakkında bilgi verebilirim.`;
        }
        if (input.includes('neler yapabilirsin') || input.includes('yardım')) {
            return `Şunları yapabilirim:\n- Site bölümleri hakkında bilgi veririm.\n- Admin panelinin nasıl kullanılacağını anlatırım.\n- Teknoloji ve oyun dünyasındaki trendleri paylaşırım.\n- Seninle samimi bir sohbet ederim! ✨`;
        }

        // 3. Platform Specifics (Forum, Admin, Tech)
        if (input.includes('forum')) {
            return `Forumumuz, topluluğumuzun kalbi! 💬 Orada oyun donanımlarından yazılım geliştirmeye kadar her şeyi tartışıyoruz. Üye olup sen de katılabilirsin!`;
        }
        if (input.includes('admin') || input.includes('panel') || input.includes('ayar')) {
            return `Admin panelimiz tam yetki sağlar! ⚙️ Renkler, fontlar, ismin yanındaki animasyonlar ve hatta benim adım... Hepsini ayarlar sayfasından saniyeler içinde değiştirebilirsin.`;
        }
        if (input.includes('teknoloji') || input.includes('haber')) {
            return `Bugünlerde yapay zeka (LLM'ler), kuantum bilgisayarlar ve elektrikli araçlar çok revaçta. 🤖 Teknoloji sayfamızdaki son makaleleri okudun mu?`;
        }
        if (input.includes('oyun')) {
            return `AsiaConsole oyun severleri unutmaz! 🎮 GTA VI detaylarından indie oyun incelemelerine kadar geniş bir yelpazemiz var. Oyun sayfamıza mutlaka bakmalısın.`;
        }

        // 4. Closing & Gratitude
        if (input.includes('teşekkür') || input.includes('sağol') || input.includes('eyvallah')) {
            return `Rica ederim! Yardımcı olabildiysem ne mutlu bana. Her zaman buradayım! 👋`;
        }
        if (input.includes('güle güle') || input.includes('hoşçakal') || input.includes('baybay')) {
            return `Görüşmek üzere! AsiaConsole ile teknolojinin tadını çıkarmaya devam et. ✨`;
        }

        // 5. Default Response
        return "Bu çok ilginç bir konu! 💡 Detay vermemi ister misin yoksa forumdaki uzman arkadaşlarımıza mı sorsak? Ayrıca sitenin 'Admin' ayarlarından beni daha da kişiselleştirebileceğini unutma!";
    };

    const fetchGeminiResponse = async (userText) => {
        // Re-read settings just in case it was updated in main.js
        const s = JSON.parse(localStorage.getItem('tc_settings') || '{}');
        const API_KEY = s.geminiApiKey;
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // Construct a simple context for the bot
        const siteContext = `
            You are AsiaBot, the official AI assistant of AsiaConsole (formerly TechCom).
            AsiaConsole is a premium tech community portal for technology news, gaming, and mobile apps.
            Your creator is the AsiaConsole Team.
            You have deep knowledge about the site features: Forum, Projects, Tech News, and Admin Settings.
            User is currently browsing the site. Be helpful, enthusiastic about tech, and professional.
            Always respond in Turkish. If someone asks who created you, say "AsiaConsole ekibi tarafından geliştirildim."
        `.trim();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: `SYSTEM: ${siteContext}\n\nUSER: ${userText}` }] }
                    ]
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (err) {
            console.error('Gemini API Error:', err);
            return "Şu an canlı yapay zeka servisine bağlanamıyorum. Lütfen daha sonra tekrar deneyin veya yönetici ayarlarından API anahtarını kontrol edin.";
        }
    };

    return { init };
})();

// Auto-init on load if scripts are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AIAssistant.init);
} else {
    AIAssistant.init();
}
