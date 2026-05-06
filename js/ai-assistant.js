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

    const _getLatestSettings = () => {
        try {
            return (window.DB && window.DB.get('settings')) || JSON.parse(localStorage.getItem('tc_settings') || '{}');
        } catch (e) { return {}; }
    };

    /**
     * Centralized AI Engine with Multi-Provider Support and Failover
     */
    const _robustAIRequest = async (systemPrompt, userPrompt, options = {}) => {
        const s = _getLatestSettings();
        const { onProgress, maxTokens = 2000, modelGroq = 'llama-3.3-70b-versatile', modelMistral = 'mistral-small-latest' } = options;

        const fullPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`;

        // Helper: OpenAI-compatible fetch
        const callOpenAI = async (url, key, model, sys, usr, tokens) => {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${key}`,
                    ...(url.includes('openrouter') ? { 'HTTP-Referer': 'https://asiaconsole.com', 'X-Title': 'AsiaConsole' } : {})
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
                    temperature: 0.7, max_tokens: tokens
                })
            });
            if (!resp.ok) throw new Error(`API_${resp.status}`);
            const data = await resp.json();
            return data.choices?.[0]?.message?.content || null;
        };

        // 1. TRY GEMINI (Tier 1)
        if (s.geminiApiKey && s.geminiApiKey.length > 10) {
            try {
                if (onProgress) onProgress('Gemini API motoru aktif ediliyor...');
                const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) return text;
                }
                console.warn('[AsiaBot] Gemini failed or quota hit, failing over...');
            } catch (e) { console.warn('[AsiaBot] Gemini Exception:', e.message); }
        }

        // 2. TRY GROQ POOL (Tier 2 - Rotating Keys)
        const groqKeys = Object.keys(s)
            .filter(k => k.startsWith('groqApiKey') && s[k] && s[k].length > 10)
            .map(k => s[k]);
        
        if (groqKeys.length > 0) {
            if (onProgress) onProgress(`Groq API havuzu taranıyor (${groqKeys.length} anahtar)...`);
            for (let i = 0; i < groqKeys.length; i++) {
                try {
                    const res = await callOpenAI('https://api.groq.com/openai/v1/chat/completions', groqKeys[i], modelGroq, systemPrompt, userPrompt, maxTokens);
                    if (res) return res;
                } catch (e) {
                    console.warn(`[AsiaBot] Groq Key ${i+1} failed:`, e.message);
                    continue;
                }
            }
        }

        // 3. TRY OPENROUTER (Tier 3)
        if (s.openrouterApiKey) {
            try {
                if (onProgress) onProgress('OpenRouter üzerinden alternatif motor deneniyor...');
                const res = await callOpenAI('https://openrouter.ai/api/v1/chat/completions', s.openrouterApiKey, 'meta-llama/llama-3.3-70b-instruct:free', systemPrompt, userPrompt, maxTokens);
                if (res) return res;
            } catch (e) { console.warn('[AsiaBot] OpenRouter failed:', e.message); }
        }

        // 4. TRY MISTRAL (Tier 4)
        if (s.mistralApiKey) {
            try {
                if (onProgress) onProgress('Mistral AI motoru deneniyor...');
                const res = await callOpenAI('https://api.mistral.ai/v1/chat/completions', s.mistralApiKey, modelMistral, systemPrompt, userPrompt, maxTokens);
                if (res) return res;
            } catch (e) { console.warn('[AsiaBot] Mistral failed:', e.message); }
        }

        throw new Error('Sistemdeki tüm yapay zeka anahtarlarının kotası dolmuş veya API servisleri şu an yanıt vermiyor. Lütfen yeni bir API anahtarı ekleyin veya bir süre bekleyin.');
    };

    const handleSend = async () => {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage('user', text);
        const typingId = addTypingIndicator();

        try {
            const s = _getLatestSettings();
            const siteContext = `You are AsiaBot of AsiaConsole. Creator: AsiaConsole Team. Always Turkish. Context: Tech news, gaming, apps.`;
            const reply = await _robustAIRequest(siteContext, text, { maxTokens: 1024 });
            removeTypingIndicator(typingId);
            addMessage('assistant', reply);
        } catch (err) {
            removeTypingIndicator(typingId);
            addMessage('assistant', getLocalResponse(text)); // Use local fallback on total failure
            console.error('AI Error:', err);
        }
    };

    const generateGame = async (userPrompt, onProgress) => {
        const systemPrompt = `You are an expert game developer. Return ONLY valid HTML5 code (with CSS/JS). No markdown. Start with <!DOCTYPE html>.`;
        try {
            const code = await _robustAIRequest(systemPrompt, userPrompt, { onProgress, maxTokens: 4000 });
            return cleanCodeOutput(code);
        } catch (err) {
            throw new Error(err.message);
        }
    };

    const cleanCodeOutput = (text) => {
        let code = text.trim();
        if (code.includes('<!DOCTYPE html>') || code.includes('<html>')) {
            // Extraction logic if AI included text around code
            const start = code.indexOf('<!DOCTYPE html>');
            const end = code.lastIndexOf('</html>');
            if (start !== -1 && end !== -1) code = code.substring(start, end + 7);
        }
        if (code.startsWith('```html')) code = code.slice(7);
        else if (code.startsWith('```')) code = code.slice(3);
        if (code.endsWith('```')) code = code.slice(0, -3);
        return code.trim();
    };

    const rewriteArticle = async (articleData, onProgress) => {
        const truncateContent = (content, maxChars = 12000) => {
            if (!content || content.length <= maxChars) return content;
            const truncated = content.substring(0, maxChars);
            const lastP = truncated.lastIndexOf('</p>');
            return (lastP > maxChars * 0.5) ? truncated.substring(0, lastP + 4) : truncated + '...';
        };

        const mediaContext = (articleData.bodyImages || []).map((_, i) => `- [RESiM-${i + 1}]`).join('\n') + 
                           (articleData.videos || []).map((_, i) => `- [ViDEO-${i + 1}]`).join('\n');

        const systemPrompt = `Sen AsiaConsole baş editörüsün. Haberi SIFIRDAN profesyonelce yaz. HTML kullan. [RESiM-X] yer tutucularını kullan. En başa [KATEGORİ: teknoloji/oyun/uygulama] ekle.`;
        const userPrompt = `BAŞLIK: ${articleData.title}\nMEDYA:\n${mediaContext}\nİÇERİK:\n${truncateContent(articleData.content)}`;

        return await _robustAIRequest(systemPrompt, userPrompt, { onProgress, maxTokens: 4000 });
    };

    return { 
        init, 
        generateGame, 
        rewriteArticle, 
        ask: async (text, onProgress) => {
            const s = _getLatestSettings();
            const ctx = `You are AsiaBot of AsiaConsole. Help user with tech/gaming/site info. Always Turkish.`;
            return await _robustAIRequest(ctx, text, { onProgress, maxTokens: 2000 });
        }
    };
})();

// Auto-init on load if scripts are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AIAssistant.init);
} else {
    AIAssistant.init();
}
