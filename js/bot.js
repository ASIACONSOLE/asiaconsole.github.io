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
        // 1. If it's a feed/RSS, use a specialized XML-to-JSON service
        if (url.includes('/feed') || url.includes('.xml') || url.includes('rss')) {
            try {
                const rssProxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
                const response = await fetch(rssProxy);
                const data = await response.json();
                if (data.status === 'ok') {
                    logTerminal("RSS verisi başarıyla çekildi.", "success");
                    return data.items.map(item => `<a href="${item.link}">${item.title}</a>`).join('');
                }
            } catch (e) { }
        }

        const proxies = [
            async (u) => {
                // Priority 1: Jina Reader (Best for bypassing bot-blocking)
                const res = await fetch(`https://r.jina.ai/${u}`, {
                    headers: {
                        'Accept': 'text/html',
                        'X-Return-Format': 'html'
                    }
                });
                if (!res.ok) throw new Error(`Jina Error ${res.status}`);
                return await res.text();
            },
            async (u) => {
                // Priority 2: Corsfix (raw URL after ?, NOT encoded)
                const res = await fetch(`https://proxy.corsfix.com/?${u}`);
                if (!res.ok) throw new Error(`Corsfix Error ${res.status}`);
                return await res.text();
            },
            async (u) => {
                // Priority 3: Cloudflare CORS proxy worker (raw URL after ?)
                const res = await fetch(`https://test.cors.workers.dev/?${u}`);
                if (!res.ok) throw new Error(`CF Worker Error ${res.status}`);
                return await res.text();
            },
            async (u) => {
                // Priority 4: AllOrigins (uses url= param with encoding)
                const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error("AllOrigins failed");
                return await res.text();
            }
        ];

        for (const proxyFn of proxies) {
            try {
                const html = await proxyFn(url);
                if (html && html.length > 300) {
                    // Quick check for bot blocking pages (strict phrases to avoid false positives)
                    const lower = html.toLowerCase();
                    if (lower.includes('sorry, you have been blocked') || lower.includes('access denied') || lower.includes('attention required! | cloudflare') || lower.includes('just a moment...')) {
                        continue;
                    }
                    return html;
                }
            } catch (err) { }
        }

        logTerminal(`⚠️ '${url}' kaynağı şu an okunamıyor.`, 'error');
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
        const baseObj = new URL(url);

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

        // SECURITY & EXTRACTION: Find the main article content tag
        const articleTag = doc.querySelector('article') ||
            doc.querySelector('.post-content') ||
            doc.querySelector('.entry-content') ||
            doc.querySelector('.article-content') ||
            doc.querySelector('main');

        let bodyImages = [];
        let content = "";

        if (articleTag) {
            // Extract images before stripping tags
            const imgs = Array.from(articleTag.querySelectorAll('img'));
            imgs.forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                if (src && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon')) {
                    // Resolve relative if needed
                    if (src.startsWith('/')) bodyImages.push(baseObj.origin + src);
                    else if (src.startsWith('http')) bodyImages.push(src);
                }
            });

            // Strip out scripts and styles before extracting text length
            const clone = articleTag.cloneNode(true);
            const useless = clone.querySelectorAll('script, style, iframe, nav, header, footer, .ads, .social-share');
            useless.forEach(s => s.remove());
            content = clone.innerText;
        } else {
            // Fallback: Just grab large paragraphs
            const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.innerText);
            content = paragraphs.filter(p => p.length > 50).join('\n\n');
        }

        // Limit images to max 3
        bodyImages = [...new Set(bodyImages)].slice(0, 3); // Unique images

        return { title, image, content, url, bodyImages };
    }

    function publishArticle(aiHtmlCode, originalData, category) {
        const articles = DB.get('articles') || [];

        // Final title cleaning (one last check)
        let finalTitle = originalData.title;
        finalTitle = finalTitle.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();

        // Inject images into the AI HTML code if they exist
        let enrichedHtml = aiHtmlCode;
        if (originalData.bodyImages && originalData.bodyImages.length > 0) {
            const paragraphs = enrichedHtml.split('</p>');
            const totalParas = paragraphs.length - 1; // Last split is usually empty
            const images = originalData.bodyImages;

            let finalHtml = "";
            let imgIdx = 0;

            // Distribute images every few paragraphs
            const interval = Math.max(1, Math.floor(totalParas / (images.length + 1)));

            for (let i = 0; i < paragraphs.length; i++) {
                finalHtml += paragraphs[i] + (i < paragraphs.length - 1 ? '</p>' : '');

                // If it's time to insert an image and we have images left
                if (imgIdx < images.length && (i + 1) % interval === 0 && i < paragraphs.length - 2) {
                    finalHtml += `<div class="article-body-img" style="margin: 2rem 0;"><img src="${images[imgIdx]}" style="width:100%; border-radius:12px; border:1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></div>`;
                    imgIdx++;
                }
            }

            // If any images left, add at bottom
            while (imgIdx < images.length) {
                finalHtml += `<div class="article-body-img" style="margin: 2rem 0;"><img src="${images[imgIdx]}" style="width:100%; border-radius:12px; border:1px solid var(--border);"></div>`;
                imgIdx++;
            }
            enrichedHtml = finalHtml;
        }

        // Use a short text snippet for description
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = aiHtmlCode;
        const shortDesc = (tempDiv.textContent || tempDiv.innerText).replace(/\n/g, ' ').slice(0, 150) + '...';

        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const newArticle = {
            id: Date.now(),
            title: finalTitle,
            category: category,
            author: 'Editör', // Shows it's automated
            image: "🤖",
            cover: originalData.image || '',
            desc: shortDesc,
            body: enrichedHtml,
            views: 0,
            date: `${dateStr} - ${timeStr}`
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
