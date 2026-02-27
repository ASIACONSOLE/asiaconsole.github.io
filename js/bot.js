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

    // Proxy service to bypass CORS
    async function fetchViaProxy(url) {
        // Expanded list of proxies
        const proxies = [
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
            (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];

        if (url.includes('shiftdelete.net')) {
            logTerminal("Bilgi: ShiftDelete botları engellemek için 403 Forbidden hatası döndürebilir.", 'info');
            logTerminal("İpucu: 'https://shiftdelete.net/feed' adresini denemek daha kararlı olabilir.", 'success');
        }

        for (const proxyFn of proxies) {
            let proxyUrl = "";
            try {
                proxyUrl = proxyFn(url);
                const proxyHost = new URL(proxyUrl).hostname;
                logTerminal(`${proxyHost} üzerinden bağlanılıyor...`, 'info');

                // Add a timeout to fetch (12 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

                const html = await response.text();
                if (html && html.length > 100) return html;

                throw new Error("Eksik veya boş içerik.");
            } catch (err) {
                const proxyName = proxyUrl ? new URL(proxyUrl).hostname : "Proxy";
                logTerminal(`${proxyName} başarısız: ${err.message}`, 'warning');
            }
        }

        logTerminal(`Tüm yöntemler başarısız oldu. Lütfen farklı bir haber kaynağı veya RSS feed deneyin.`, 'error');
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
        if (title) title = title.split('|')[0].trim(); // Remove site name appends

        return { title, image, content, url };
    }

    function publishArticle(aiHtmlCode, originalData, category) {
        const articles = DB.get('articles') || [];

        // Use a short text snippet for description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = aiHtmlCode;
        const shortDesc = (tempDiv.textContent || tempDiv.innerText).replace(/\n/g, ' ').slice(0, 150) + '...';

        const newArticle = {
            id: Date.now(),
            title: originalData.title,
            category: category,
            author: 'AsiaBot', // Shows it's automated
            image: "🤖",
            cover: originalData.image || '',
            desc: shortDesc,
            body: aiHtmlCode,
            views: 0,
            date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
        };

        articles.unshift(newArticle); // Add to top
        DB.set('articles', articles);

        logTerminal(`[BAŞARILI] '${originalData.title}' yayına alındı!`, 'success');
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
