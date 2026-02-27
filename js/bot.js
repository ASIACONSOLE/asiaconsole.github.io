/**
 * Otonom Haber & İçerik Botu Motoru
 * Hedef web sitelerinden makale çekme, RSS/HTML ayrıştırma ve AI ile yeniden yazmayı yönetir.
 */

window.BotEngine = (function () {
    let intervalId = null;
    let isRunning = false;
    let scrapedUrls = [];

    // Initialize from DB
    function init() {
        scrapedUrls = DB.get('scraped_urls') || [];
        loadConfig();
    }

    function loadConfig() {
        const config = DB.get('bot_config') || {};
        if (config.baseUrl) document.getElementById('botBaseUrl').value = config.baseUrl;
        if (config.category) document.getElementById('botCategory').value = config.category;
        if (config.interval) document.getElementById('botInterval').value = config.interval;
        return config;
    }

    function saveConfig() {
        const config = {
            baseUrl: document.getElementById('botBaseUrl').value.trim(),
            category: document.getElementById('botCategory').value,
            interval: parseInt(document.getElementById('botInterval').value, 10)
        };
        DB.set('bot_config', config);
        return config;
    }

    function logTerminal(message, type = 'info') {
        const terminal = document.getElementById('botTerminal');
        if (!terminal) return;

        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const div = document.createElement('div');
        div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${message}</span>`;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
    }

    // Proxy service to bypass CORS - Final Robust Version
    async function fetchViaProxy(url) {
        // 1. If it's a feed/RSS, use a specialized XML-to-JSON service (best for CORS)
        if (url.includes('/feed') || url.includes('.xml') || url.includes('rss')) {
            try {
                logTerminal("RSS Beslemesi tespit edildi, XML servisleri kullanılıyor...", "info");
                const rssProxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
                const response = await fetch(rssProxy);
                const data = await response.json();
                if (data.status === 'ok') {
                    // Convert RSS JSON items back to a pseudo-HTML links list for our link parser
                    logTerminal("RSS verisi başarıyla JSON'a dönüştürüldü.", "success");
                    return data.items.map(item => `<a href="${item.link}">${item.title}</a>`).join('');
                }
            } catch (e) {
                logTerminal("RSS Servis hatası, standart proxy deneniyor...", "warning");
            }
        }

        // 2. Use JSON Wrapping Proxy (The most reliable way to avoid browser CORS blocks)
        // This doesn't trigger 'preflight' issues because the response is a standard JSON
        const proxies = [
            async (u) => {
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}`);
                const json = await res.json();
                return json.contents;
            },
            async (u) => {
                // Combined with corsproxy.io as fallback
                const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(u)}`);
                return await res.text();
            }
        ];

        for (const proxyFn of proxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const html = await proxyFn(url);
                clearTimeout(timeoutId);

                if (html && html.length > 200) {
                    return html;
                }
                throw new Error("İçerik çok kısa veya boş.");
            } catch (err) {
                logTerminal(`Bağlantı denemesi başarısız (${err.message})`, 'warning');
            }
        }

        logTerminal(`KRİTİK: '${url}' adresine erişilemedi. Hedef site veya proxy servisleri geçici olarak kapalı olabilir.`, 'error');
        return null;
    }

    // Scrapes the main page to find article links
    async function findLinksOnPage(html, baseUrl) {
        logTerminal("Bağlantılar ayrıştırılıyor...");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const links = Array.from(doc.querySelectorAll('a'));
        const foundUrls = new Set();

        const baseObj = new URL(baseUrl);

        links.forEach(a => {
            let href = a.getAttribute('href');
            if (!href) return;

            // Resolve relative URLs
            if (href.startsWith('/')) {
                href = baseObj.origin + href;
            }
            // Add if it belongs to the same domain and looks like an article (has multiple dashes)
            if (href.startsWith(baseObj.origin) && href.includes('-') && href.length > baseObj.origin.length + 10) {
                // Strip queries/hashes
                href = href.split('?')[0].split('#')[0];
                foundUrls.add(href);
            }
        });

        // Convert set to array, filter out already scraped ones
        const allLinks = Array.from(foundUrls);
        const newLinks = allLinks.filter(url => !scrapedUrls.includes(url));

        logTerminal(`Sayfada toplam ${allLinks.length} makale linki bulundu.`);
        logTerminal(`Daha önce eklenmemiş YENİ link sayısı: ${newLinks.length}`, newLinks.length > 0 ? 'success' : 'warning');

        return newLinks;
    }

    // Scrapes the specific article page
    async function extractArticleData(html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Try to find Title
        let title = '';
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (ogTitle) title = ogTitle.getAttribute('content');
        if (!title && doc.querySelector('h1')) title = doc.querySelector('h1').textContent;
        if (!title) title = doc.title;

        // Try to find Image
        let image = '';
        const ogImage = doc.querySelector('meta[property="og:image"]');
        if (ogImage) image = ogImage.getAttribute('content');

        // Try to find Content text
        let content = '';
        // Best guess: <article> tag or elements with "content", "post-content"
        const articleTag = doc.querySelector('article') || doc.querySelector('.post-content') || doc.querySelector('.entry-content');

        if (articleTag) {
            // Strip out scripts and styles before extracting text length
            const clone = articleTag.cloneNode(true);
            const scripts = clone.querySelectorAll('script, style, iframe, nav, header, footer');
            scripts.forEach(s => s.remove());
            content = clone.innerText;
        } else {
            // Fallback: Just grab large paragraphs
            const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.innerText);
            content = paragraphs.filter(p => p.length > 50).join('\n\n');
        }

        // Clean up title
        if (title) {
            // Remove common separators and site names
            title = title.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();
            title = title.replace(/ShiftDelete\.Net/gi, '').replace(/DonanımHaber/gi, '').replace(/Webtekno/gi, '').trim();
        }

        return { title, image, content, url };
    }

    function publishArticle(aiHtmlCode, originalData, category) {
        const articles = DB.get('articles') || [];

        // Final title cleaning (one last check)
        let finalTitle = originalData.title;
        finalTitle = finalTitle.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();

        // Use a short text snippet for description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = aiHtmlCode;
        const shortDesc = (tempDiv.textContent || tempDiv.innerText).replace(/\n/g, ' ').slice(0, 150) + '...';

        const newArticle = {
            id: Date.now(),
            title: finalTitle,
            category: category,
            author: 'AsiaBot', // Shows it's automated
            image: "🤖",
            cover: originalData.image || '',
            desc: shortDesc,
            body: aiHtmlCode,
            views: 0,
            date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' - ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };

        articles.unshift(newArticle); // Add to top
        DB.set('articles', articles);

        logTerminal(`[BAŞARILI] '${finalTitle}' yayına alındı!`, 'success');
    }

    async function runScrapeCycle() {
        const config = loadConfig(); // Get latest from UI even if running
        if (!config.baseUrl) {
            logTerminal('Hata: Hedef site URL adresi boş!', 'error');
            stopBot();
            return;
        }

        logTerminal('---------------------------------------');
        logTerminal(`🎯 Taramaya başlanıyor: ${config.baseUrl}`);

        const html = await fetchViaProxy(config.baseUrl);
        if (!html) return; // Error already logged

        const newLinks = await findLinksOnPage(html, config.baseUrl);
        if (newLinks.length === 0) {
            logTerminal("Bu döngüde eklenecek yeni haber bulunamadı.", "warning");
            return;
        }

        // To avoid spamming APIs and taking too long, let's process max 2 articles per cycle
        const linksToProcess = newLinks.slice(0, 2);

        for (const link of linksToProcess) {
            logTerminal(`Makale çekiliyor: ${link}`);
            const articleHtml = await fetchViaProxy(link);

            if (articleHtml) {
                const articleData = await extractArticleData(articleHtml, link);

                if (articleData.title && articleData.content && articleData.content.length > 200) {
                    // CRITICAL: Check for "Blocked" or "Cloudflare" messages in the content
                    const lowerContent = articleData.content.toLowerCase();
                    if (lowerContent.includes("sorry, you have been blocked") || lowerContent.includes("cloudflare") || articleData.title.toLowerCase().includes("blocked")) {
                        logTerminal(`⚠️ İçerik engellenmiş (Blocked/Cloudflare), atlanıyor: ${link}`, 'warning');
                        scrapedUrls.push(link);
                        DB.set('scraped_urls', scrapedUrls);
                        continue;
                    }

                    try {
                        // Pass to AI
                        logTerminal(`💡 AI Özgünleştirme başlatılıyor...`);
                        const rewrittenHtml = await AIAssistant.rewriteArticle(articleData, (msg) => {
                            if (msg.includes("API")) logTerminal(msg, "info");
                        });

                        // Clean AI output block ticks if any
                        let finalHtml = rewrittenHtml.trim();
                        if (finalHtml.startsWith("```html")) finalHtml = finalHtml.substring(7);
                        if (finalHtml.startsWith("```")) finalHtml = finalHtml.substring(3);
                        if (finalHtml.endsWith("```")) finalHtml = finalHtml.slice(0, -3);

                        // Publish
                        publishArticle(finalHtml, articleData, config.category);

                        // Save url as scraped so we don't do it again
                        scrapedUrls.push(link);
                        DB.set('scraped_urls', scrapedUrls);

                    } catch (err) {
                        logTerminal(`❌ AI İşleme Hatası: ${err.message}`, 'error');
                    }
                } else {
                    // Mark as scraped anyway so we don't retry invalid content
                    logTerminal(`⚠️ Makale içeriği yetersiz veya bulunamadı, atlanıyor.`, 'warning');
                    scrapedUrls.push(link);
                    DB.set('scraped_urls', scrapedUrls);
                }
            }

            // Add a small delay between processing multiple to prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        }

        logTerminal('Tüm yeni içerikler işlendi. Bekleme moduna dönülüyor.', 'info');
    }

    function startBot() {
        const config = saveConfig();
        if (!config.baseUrl) {
            showAdminToast("Lütfen bot için hedef ana URL adresini girin!", "error");
            return;
        }

        const settings = DB.get('settings') || {};
        if (!settings.geminiApiKey && !settings.groqApiKey) {
            showAdminToast("API Anahtarı eksik! Bot çalışamaz. Site Ayarlarından API Anahtarı girin.", "error");
            return;
        }

        isRunning = true;
        document.getElementById('btnStartBot').style.display = 'none';
        document.getElementById('btnStopBot').style.display = 'flex';

        const dot = document.getElementById('statusDot');
        dot.classList.remove('status-idle');
        dot.classList.add('status-running');

        logTerminal(`[BAŞLATILDI] Otonom Bot devreye girdi. Çalışma sıklığı: ${config.interval} Dakika.`, 'success');

        // Run immediately first time
        runScrapeCycle();

        // Then set interval (minutes to milliseconds)
        const ms = config.interval * 60 * 1000;
        intervalId = setInterval(runScrapeCycle, ms);
    }

    function stopBot() {
        isRunning = false;
        if (intervalId) clearInterval(intervalId);

        document.getElementById('btnStartBot').style.display = 'flex';
        document.getElementById('btnStopBot').style.display = 'none';

        const dot = document.getElementById('statusDot');
        dot.classList.remove('status-running');
        dot.classList.add('status-idle');

        logTerminal(`[DURDURULDU] Otonom Bot bekleme moduna alındı.`, 'warning');
    }

    function clearLogs() {
        const term = document.getElementById('botTerminal');
        if (term) term.innerHTML = '<div><span class="log-info">Sistem:</span> Ekran temizlendi.</div>';
    }

    // Expose public API
    return {
        init,
        startBot,
        stopBot,
        clearLogs
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    // Run only if we are on the bot.html logic
    if (document.getElementById('botTerminal')) {
        BotEngine.init();

        document.getElementById('btnStartBot').addEventListener('click', BotEngine.startBot);
        document.getElementById('btnStopBot').addEventListener('click', BotEngine.stopBot);

        // Expose clear function for the inline onclick in html
        window.clearLogs = BotEngine.clearLogs;
    }
});
