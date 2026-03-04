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

    // ==================== RSS-FIRST APPROACH ====================
    // Many sites (like shiftdelete.net) have Cloudflare bot protection
    // that blocks ALL CORS proxies. RSS feeds bypass this entirely.

    // Try to fetch articles via RSS feed (primary method)
    async function fetchViaRSS(baseUrl) {
        // Common RSS feed URL patterns to try
        const feedPaths = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml'];
        const baseObj = new URL(baseUrl);
        const origin = baseObj.origin;

        for (const path of feedPaths) {
            const feedUrl = origin + path;
            try {
                logTerminal(`📡 RSS deneniyor: ${feedUrl}`);
                const rssProxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
                const response = await fetch(rssProxy);
                const data = await response.json();

                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    logTerminal(`✅ RSS başarılı! ${data.items.length} makale bulundu.`, 'success');
                    return data.items;
                }
            } catch (e) {
                logTerminal(`RSS denemesi başarısız: ${feedUrl}`, 'warning');
            }
        }
        return null;
    }

    // Proxy-based fetch (fallback for non-RSS sites)
    async function fetchViaProxy(url) {
        const proxies = [
            async (u) => {
                // Jina Reader (Best for bypassing bot-blocking)
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
                // Corsfix
                const res = await fetch(`https://proxy.corsfix.com/?${u}`);
                if (!res.ok) throw new Error(`Corsfix Error ${res.status}`);
                return await res.text();
            },
            async (u) => {
                // AllOrigins
                const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error("AllOrigins failed");
                return await res.text();
            }
        ];

        for (const proxyFn of proxies) {
            try {
                const html = await proxyFn(url);
                if (html && html.length > 300) {
                    const lower = html.toLowerCase();
                    if (lower.includes('sorry, you have been blocked') || lower.includes('attention required! | cloudflare') || lower.includes('just a moment...')) {
                        continue;
                    }
                    return html;
                }
            } catch (err) { }
        }

        logTerminal(`⚠️ '${url}' kaynağı proxy ile okunamıyor.`, 'warning');
        return null;
    }

    // Try to fetch full article page via cache services (bypasses Cloudflare)
    async function fetchFullArticle(articleUrl) {
        const cacheStrategies = [
            async (u) => {
                // Google Cache
                const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(u)}`;
                const res = await fetch(cacheUrl);
                if (!res.ok) throw new Error('Google Cache failed');
                return await res.text();
            },
            async (u) => {
                // Wayback Machine (latest snapshot)
                const checkUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(u)}`;
                const checkRes = await fetch(checkUrl);
                const checkData = await checkRes.json();
                if (checkData.archived_snapshots?.closest?.url) {
                    const snapUrl = checkData.archived_snapshots.closest.url;
                    const res = await fetch(snapUrl);
                    if (!res.ok) throw new Error('Wayback failed');
                    return await res.text();
                }
                throw new Error('No Wayback snapshot');
            },
            // Also try regular proxies as last resort
            async (u) => { return await fetchViaProxy(u); }
        ];

        for (const strategy of cacheStrategies) {
            try {
                const html = await strategy(articleUrl);
                if (html && html.length > 500) {
                    const lower = html.toLowerCase();
                    if (lower.includes('sorry, you have been blocked') || lower.includes('just a moment...')) continue;
                    return html;
                }
            } catch (err) { }
        }
        return null;
    }

    // Scrapes the main page to find article links (fallback when RSS fails)
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

            if (href.startsWith('/')) {
                href = baseObj.origin + href;
            }
            if (href.startsWith(baseObj.origin) && href.includes('-') && href.length > baseObj.origin.length + 10) {
                href = href.split('?')[0].split('#')[0];
                foundUrls.add(href);
            }
        });

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

    // ==================== MAIN SCRAPE CYCLE ====================
    async function runScrapeCycle() {
        const config = loadConfig();
        if (!config.baseUrl) {
            logTerminal('Hata: Hedef site URL adresi boş!', 'error');
            stopBot();
            return;
        }

        logTerminal('---------------------------------------');
        logTerminal(`🎯 Taramaya başlanıyor: ${config.baseUrl}`);

        // ========== STRATEGY 1: RSS Feed (Primary - Cloudflare-proof) ==========
        const rssItems = await fetchViaRSS(config.baseUrl);

        if (rssItems && rssItems.length > 0) {
            logTerminal(`📰 RSS ile ${rssItems.length} makale bulundu. RSS modu kullanılıyor.`, 'success');

            // Filter out already scraped URLs
            const newItems = rssItems.filter(item => !scrapedUrls.includes(item.link));

            if (newItems.length === 0) {
                logTerminal("Bu döngüde eklenecek yeni haber bulunamadı.", "warning");
                return;
            }

            logTerminal(`🆕 ${newItems.length} yeni makale işlenecek.`, 'success');

            // Process max 2 per cycle
            const itemsToProcess = newItems.slice(0, 2);

            for (const item of itemsToProcess) {
                logTerminal(`📝 RSS Makale: ${item.title}`);

                // 1. Extract images from RSS HTML content before stripping
                const rssHtmlContent = item.content || item.description || '';
                const imgExtractor = document.createElement('div');
                imgExtractor.innerHTML = rssHtmlContent;
                const rssImages = [];
                imgExtractor.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src') || img.getAttribute('data-src');
                    if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('1x1')) {
                        rssImages.push(src);
                    }
                });

                // 2. Build articleData from RSS
                const articleData = {
                    title: item.title.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim(),
                    content: imgExtractor.textContent || imgExtractor.innerText || '',
                    url: item.link,
                    image: item.thumbnail || item.enclosure?.link || rssImages[0] || '',
                    bodyImages: [...new Set(rssImages)].slice(0, 5),
                    author: item.author || 'Editör',
                    categories: item.categories || []
                };

                // 3. Try to fetch full article page for richer content + images
                logTerminal(`🔍 Tam makale sayfası aranıyor...`);
                const fullHtml = await fetchFullArticle(item.link);
                if (fullHtml) {
                    logTerminal(`✅ Tam makale sayfası bulundu!`, 'success');
                    const fullData = await extractArticleData(fullHtml, item.link);
                    // Merge: prefer full page data if richer
                    if (fullData.content && fullData.content.length > articleData.content.length) {
                        articleData.content = fullData.content;
                    }
                    if (fullData.image) articleData.image = fullData.image;
                    if (fullData.bodyImages && fullData.bodyImages.length > 0) {
                        articleData.bodyImages = [...new Set([...fullData.bodyImages, ...articleData.bodyImages])].slice(0, 5);
                    }
                } else {
                    logTerminal(`ℹ️ Tam sayfa erişilemiyor, RSS içeriği kullanılıyor.`, 'info');
                }

                if (articleData.content.length < 100) {
                    logTerminal(`⚠️ İçerik kısa, atlanıyor: ${item.link}`, 'warning');
                    scrapedUrls.push(item.link);
                    DB.set('scraped_urls', scrapedUrls);
                    continue;
                }

                logTerminal(`📸 Kapak: ${articleData.image ? '✓' : '✗'} | Gövde resimleri: ${articleData.bodyImages.length}`);

                try {
                    logTerminal(`💡 AI Özgünleştirme başlatılıyor...`);
                    const rewrittenHtml = await AIAssistant.rewriteArticle(articleData, (msg) => {
                        if (msg.includes("API")) logTerminal(msg, "info");
                    });

                    let finalHtml = rewrittenHtml.trim();
                    if (finalHtml.startsWith("```html")) finalHtml = finalHtml.substring(7);
                    if (finalHtml.startsWith("```")) finalHtml = finalHtml.substring(3);
                    if (finalHtml.endsWith("```")) finalHtml = finalHtml.slice(0, -3);

                    publishArticle(finalHtml, articleData, config.category);

                    scrapedUrls.push(item.link);
                    DB.set('scraped_urls', scrapedUrls);

                } catch (err) {
                    logTerminal(`❌ AI İşleme Hatası: ${err.message}`, 'error');
                }

                await new Promise(r => setTimeout(r, 2000));
            }

            logTerminal('Tüm yeni içerikler işlendi. Bekleme moduna dönülüyor.', 'info');
            return;
        }

        // ========== STRATEGY 2: Proxy Scraping (Fallback for non-RSS sites) ==========
        logTerminal('⚠️ RSS bulunamadı, proxy ile HTML tarama deneniyor...', 'warning');

        const html = await fetchViaProxy(config.baseUrl);
        if (!html) return;

        const newLinks = await findLinksOnPage(html, config.baseUrl);
        if (newLinks.length === 0) {
            logTerminal("Bu döngüde eklenecek yeni haber bulunamadı.", "warning");
            return;
        }

        const linksToProcess = newLinks.slice(0, 2);

        for (const link of linksToProcess) {
            logTerminal(`Makale çekiliyor: ${link}`);
            const articleHtml = await fetchViaProxy(link);

            if (articleHtml) {
                const articleData = await extractArticleData(articleHtml, link);

                if (articleData.title && articleData.content && articleData.content.length > 200) {
                    const lowerContent = articleData.content.toLowerCase();
                    if (lowerContent.includes("sorry, you have been blocked") || articleData.title.toLowerCase().includes("blocked")) {
                        logTerminal(`⚠️ İçerik engellenmiş, atlanıyor: ${link}`, 'warning');
                        scrapedUrls.push(link);
                        DB.set('scraped_urls', scrapedUrls);
                        continue;
                    }

                    try {
                        logTerminal(`💡 AI Özgünleştirme başlatılıyor...`);
                        const rewrittenHtml = await AIAssistant.rewriteArticle(articleData, (msg) => {
                            if (msg.includes("API")) logTerminal(msg, "info");
                        });

                        let finalHtml = rewrittenHtml.trim();
                        if (finalHtml.startsWith("```html")) finalHtml = finalHtml.substring(7);
                        if (finalHtml.startsWith("```")) finalHtml = finalHtml.substring(3);
                        if (finalHtml.endsWith("```")) finalHtml = finalHtml.slice(0, -3);

                        publishArticle(finalHtml, articleData, config.category);

                        scrapedUrls.push(link);
                        DB.set('scraped_urls', scrapedUrls);

                    } catch (err) {
                        logTerminal(`❌ AI İşleme Hatası: ${err.message}`, 'error');
                    }
                } else {
                    logTerminal(`⚠️ Makale içeriği yetersiz, atlanıyor.`, 'warning');
                    scrapedUrls.push(link);
                    DB.set('scraped_urls', scrapedUrls);
                }
            }

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
