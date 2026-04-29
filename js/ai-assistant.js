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

    const getLocalResponse = (text) => {
        const q = text.toLowerCase();
        if (q.includes('merhaba') || q.includes('selam')) return "Selam! Ben AsiaBot. AsiaConsole dünyasına hoş geldin! Sana forum, teknoloji haberleri veya oyunlar hakkında nasıl yardımcı olabilirim? 🤖✨";
        if (q.includes('kim') || q.includes('hazırladı') || q.includes('yapan')) return "Ben AsiaConsole ekibi tarafından geliştirilmiş özel bir yapay zekayım. Sitenin her köşesini bilirim! 💻";
        if (q.includes('forum')) return "Forum sayfamızda teknoloji, oyun ve yazılım hakkında harika bir topluluk var. Orada soru sorabilir veya bildiklerini paylaşabilirsin. 💬";
        if (q.includes('oyun')) return "Oyun sayfamızda en son çıkan oyun haberlerini, incelemelerini ve e-spor dünyasından gelişmeleri bulabilirsin. 🎮";
        if (q.includes('admin') || q.includes('panel')) return "Yönetici yetkin varsa Admin paneline soldaki menüden ulaşabilirsin. Orada site içeriğini ve ayarlarını yönetebilirsin. ⚙️";
        if (q.includes('kayıt') || q.includes('üye')) return "Üye olmak çok kolay! Sağ üstteki giriş butonuna basıp Google hesabınla saniyeler içinde bağlanabilirsin. 👤";
        if (q.includes('teşekkür')) return "Rica ederim! AsiaConsole'da vakit geçirdiğin için teşekkürler. Başka bir sorun olursa buradayım! 😊";
        if (q.includes('nasılsın')) return "Harikayım! Teknoloji dünyasını takip etmekten ve kullanıcılara yardımcı olmaktan mutluluk duyuyorum. Sen nasılsın? 🚀";

        return "Şu an canlı yapay zeka servisine (Gemini) bağlanırken bir yoğunluk/kota limiti yaşıyorum. Ama merak etme, AsiaConsole hakkında her şeyi bana sorabilirsin! Forum, Oyun ve Teknoloji sayfalarımızda yeni içerikler seni bekliyor. 💎";
    };

    const fetchGeminiResponse = async (userText) => {
        const s = JSON.parse(localStorage.getItem('tc_settings') || '{}');

        const siteContext = `
            You are AsiaBot, the official AI assistant of AsiaConsole (formerly TechCom).
            AsiaConsole is a premium tech community portal for technology news, gaming, and mobile apps.
            Your creator is the AsiaConsole Team. Always respond in Turkish. Be helpful and tech-savvy.
        `.trim();

        const fullPrompt = `SYSTEM: ${siteContext}\n\nUSER: ${userText}`;

        try {
            // Try Gemini first
            if (s.geminiApiKey) {
                const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.candidates && data.candidates[0]) {
                        return data.candidates[0].content.parts[0].text;
                    }
                } else if (resp.status !== 429) {
                    throw new Error('API_FAILED');
                }
                // If 429, fall through to Groq
                console.warn('[AsiaBot] Gemini 429, trying Groq...');
            }

            // Try Groq as fallback
            if (s.groqApiKey) {
                const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.groqApiKey}` },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: siteContext },
                            { role: 'user', content: userText }
                        ],
                        temperature: 0.7, max_tokens: 1024
                    })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.choices && data.choices[0]) {
                        return data.choices[0].message.content;
                    }
                }
            }

            // All failed
            throw new Error('ALL_AI_FAILED');

        } catch (err) {
            console.warn('[AsiaBot] Fallback active due to:', err.message);
            return getLocalResponse(userText);
        }
    };

    const generateGame = async (userPrompt, onProgress) => {
        const s = JSON.parse(localStorage.getItem('tc_settings') || '{}');

        const systemPrompt = `You are an expert game developer. 
        The user wants an HTML5 game based on their description. 
        You MUST return ONLY valid, complete HTML code containing embedded CSS and JS.
        DO NOT include markdown code blocks like \`\`\`html.
        DO NOT include any conversational text before or after the code.
        The output must start with <!DOCTYPE html> and end with </html>.
        Make the game visually appealing with modern CSS, colorful graphics, and smooth logic.
        Ensure it scales correctly to the screen or is responsive.`;

        const fullPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`;

        if (onProgress) onProgress('Yapay zeka motoruna bağlanılıyor...');

        try {
            // Try Gemini first
            if (s.geminiApiKey && s.geminiApiKey.length > 20) {
                if (onProgress) onProgress('Gemini üzerinden kod üretiliyor...');
                const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.candidates && data.candidates[0]) {
                        let code = data.candidates[0].content.parts[0].text;
                        return cleanCodeOutput(code);
                    }
                } else if (resp.status !== 429) {
                    throw new Error('GEMINI_FAILED');
                }
                console.warn('[AsiaBot] Gemini 429, trying Groq...');
            }

            // Try Groq as fallback
            if (s.groqApiKey) {
                if (onProgress) onProgress('Groq üzerinden kod üretiliyor (Yedek motor)...');
                const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.groqApiKey}` },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7, max_tokens: 3000
                    })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    if (data.choices && data.choices[0]) {
                        let code = data.choices[0].message.content;
                        return cleanCodeOutput(code);
                    }
                }
            }

            throw new Error('ALL_AI_FAILED');
        } catch (err) {
            console.error('[AsiaBot Generate Game Error]', err);
            throw new Error('Yapay zeka servisine bağlanılamadı. Lütfen API anahtarlarınızı kontrol edin veya daha sonra tekrar deneyin.');
        }
    };

    const cleanCodeOutput = (text) => {
        let code = text.trim();
        // Remove markdown tags if the AI ignored instructions
        if (code.startsWith('```html')) code = code.slice(7);
        else if (code.startsWith('```')) code = code.slice(3);
        if (code.endsWith('```')) code = code.slice(0, -3);
        return code.trim();
    };

    const rewriteArticle = async (articleData, onProgress) => {
        const s = DB.get('settings') || {};

        // Smart content truncation to prevent 413 errors
        const truncateContent = (content, maxChars = 12000) => {
            if (!content || content.length <= maxChars) return content;
            // Try to cut at a paragraph boundary
            const truncated = content.substring(0, maxChars);
            const lastP = truncated.lastIndexOf('</p>');
            if (lastP > maxChars * 0.5) return truncated.substring(0, lastP + 4);
            return truncated + '...';
        };

        // Prepare media cues for the AI
        const hasImages = articleData.bodyImages && articleData.bodyImages.length > 0;
        const hasVideos = articleData.videos && articleData.videos.length > 0;

        let mediaContext = "";
        if (hasImages) {
            mediaContext += `\nMEVCUT RESİMLER (${articleData.bodyImages.length} adet):\n`;
            articleData.bodyImages.forEach((_, i) => mediaContext += `- [RESiM-${i + 1}]\n`);
        }
        if (hasVideos) {
            mediaContext += `\nMEVCUT VİDEOLAR (${articleData.videos.length} adet):\n`;
            articleData.videos.forEach((_, i) => mediaContext += `- [ViDEO-${i + 1}]\n`);
        }

        const systemPrompt = `Sen Türkiye'nin en prestijli teknoloji platformlarından biri olan AsiaConsole'un baş editörüsün. 
Deneyimli, profesyonel, derinlikli ve akıcı bir üslupla teknoloji haberleri yazıyorsun.
Sana verilen haberi SIFIRDAN, tamamen ÖZGÜN ve SEO uyumlu olarak yeniden yazmalısın.

YAZIM KURALLARI:
1. ÇIKTI SADECE HTML FORMATINDA OLMALIDIR. Markdown kullanma. \`\`\`html gibi blok etiketleri KULLANMA.
2. Sadece yazının gövde HTML'ini ver (<html>, <body>, <head> gibi kapsayıcı etiketler KULLANMA).
3. Paragraflar için <p>, alt başlıklar için <h2> veya <h3>, listeler için <ul>/<li> kullan.
4. ÖNEMLİ (MEDYA): Sana bir medya listesi verilecek. Yazı içine bu medyaları yerleştirmek için SADECE [RESiM-1], [ViDEO-1] gibi yer tutucuları kullan. Her habere mutlaka en az 2-3 adet [RESiM-X] yer tutucusu yerleştir.
5. ÖNEMLİ (KATEGORİ): Haberin içeriğini analiz et ve SADECE şu üç seçenekten birini seç:
   - "teknoloji": Donanım, işlemciler, uzay, bilim, genel teknoloji dünyası.
   - "oyun": Konsollar, oyun haberleri, incelemeler, e-spor.
   - "uygulama": Mobil uygulamalar, sosyal medya platformları (X/Twitter, WhatsApp, Instagram vb.), yazılım güncellemeleri, mobil işletim sistemleri.
   Seçtiğin kategoriyi yazının EN BAŞINA şu formatta ekle: [KATEGORİ: teknoloji] veya [KATEGORİ: oyun] veya [KATEGORİ: uygulama]. Bu etiket mutlaka en üstte olmalıdır.
6. <img> veya <iframe> etiketlerini ASLA kendin yazma. Sadece köşeli parantez içindeki yer tutucuları paragrafların hemen altına yerleştir.
7. Haberin içindeki önemli kaynak bağlantılarını (<a> etiketlerini) mutlaka yazı içinde uygun yerlerde koru.

EDİTÖRYEL KALİTE:
- İlk paragrafta okuyucuyu hemen yakalayan, merak uyandıran güçlü bir giriş yaz.
- Haberi bölümlere ayır, alt başlıklar kullan.
- Teknik terimleri açıkla, habere derinlik kat.
- Minimum 5-6 paragraf yaz.

KRİTİK KURALLAR:
- Kaynak sitenin ismini (ShiftDelete, Webtekno vb.) ASLA yazıya dahil etme.
- Başlığı <h1> olarak YAZMA.

KAPANIŞ:
Yazının sonuna kalın ve italik bir editör notu ekle: <p><strong>...</strong></p>`;

        // Use truncated content for all APIs
        const articleContent = truncateContent(articleData.content);

        const userPrompt = `HABER BAŞLIĞI: ${articleData.title}

${mediaContext}

HABER İÇERİĞİ:
${articleContent}

Yukarıdaki haberi profesyonel bir editör olarak SIFIRDAN, zengin ve detaylı bir şekilde yeniden yaz. Verilen medyaları [RESiM-X] formatında yazı içine uygun dağıt.`;

        const fullPrompt = `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`;

        if (onProgress) onProgress('Yapay zekaya haber aktarılıyor...');

        // Helper: OpenAI-compatible API call (works with Groq, OpenRouter, Mistral)
        const callOpenAICompatible = async (apiUrl, apiKey, model, sysPrompt, usrPrompt, maxTokens = 4000, extraHeaders = {}) => {
            const resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: usrPrompt }
                    ],
                    temperature: 0.7, max_tokens: maxTokens
                })
            });
            if (!resp.ok) throw new Error(`API ${resp.status}`);
            const data = await resp.json();
            if (data.choices && data.choices[0]) return data.choices[0].message.content;
            throw new Error('No response');
        };

        try {
            // ===== 1. TRY GEMINI FIRST =====
            if (s.geminiApiKey && s.geminiApiKey.length > 20) {
                try {
                    if (onProgress) onProgress('Gemini API ile makale özgünleştiriliyor...');
                    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${s.geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: fullPrompt }] }] })
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.candidates && data.candidates[0]) {
                            return data.candidates[0].content.parts[0].text;
                        }
                    }
                    if (resp.status !== 429) console.warn('[AsiaBot] Gemini error:', resp.status);
                    else console.warn('[AsiaBot] Gemini 429, sonraki motora geçiliyor...');
                } catch (e) { console.warn('[AsiaBot] Gemini failed:', e.message); }
            }

            // ===== 2. TRY GROQ (with smaller content to avoid 413) =====
            if (s.groqApiKey) {
                try {
                    if (onProgress) onProgress('Groq API ile makale özgünleştiriliyor...');
                    const groqContent = truncateContent(articleData.content, 6000); // Groq has smaller limits
                    const groqUserPrompt = `HABER BAŞLIĞI: ${articleData.title}\n${mediaContext}\nHABER İÇERİĞİ:\n${groqContent}\n\nYukarıdaki haberi profesyonel bir editör olarak SIFIRDAN yeniden yaz. Medyaları [RESiM-X] formatında dağıt.`;
                    const result = await callOpenAICompatible(
                        'https://api.groq.com/openai/v1/chat/completions',
                        s.groqApiKey, 'llama-3.3-70b-versatile',
                        systemPrompt, groqUserPrompt, 4000
                    );
                    return result;
                } catch (e) { console.warn('[AsiaBot] Groq failed:', e.message); }
            }

            // ===== 3. TRY OPENROUTER =====
            if (s.openrouterApiKey) {
                try {
                    if (onProgress) onProgress('OpenRouter API ile makale özgünleştiriliyor...');
                    const result = await callOpenAICompatible(
                        'https://openrouter.ai/api/v1/chat/completions',
                        s.openrouterApiKey, 'meta-llama/llama-3.3-70b-instruct:free',
                        systemPrompt, userPrompt, 4000,
                        { 'HTTP-Referer': 'https://asiaconsole.com', 'X-Title': 'AsiaConsole Bot' }
                    );
                    return result;
                } catch (e) { console.warn('[AsiaBot] OpenRouter failed:', e.message); }
            }

            // ===== 4. TRY MISTRAL =====
            if (s.mistralApiKey) {
                try {
                    if (onProgress) onProgress('Mistral API ile makale özgünleştiriliyor...');
                    const result = await callOpenAICompatible(
                        'https://api.mistral.ai/v1/chat/completions',
                        s.mistralApiKey, 'mistral-small-latest',
                        systemPrompt, userPrompt, 4000
                    );
                    return result;
                } catch (e) { console.warn('[AsiaBot] Mistral failed:', e.message); }
            }

            throw new Error('Tum API denemeleri basarisiz oldu.');
        } catch (err) {
            console.error('[AsiaBot Rewrite Error]', err);
            throw new Error('Yapay zeka servisine baglanılamadı.');
        }
    };

    return { init, generateGame, rewriteArticle, ask: fetchGeminiResponse };
})();

// Auto-init on load if scripts are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', AIAssistant.init);
} else {
    AIAssistant.init();
}
