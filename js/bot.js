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

    // ==================== WP REST API + RSS APPROACH ====================
    // WordPress sites expose a REST API that bypasses Cloudflare entirely.
    // This gives us: full content + cover image + body images + author + categories.
    // RSS is used as fallback for non-WordPress sites.

    // PRIMARY: Fetch articles via WordPress REST API (best quality)
    async function fetchViaWPAPI(baseUrl) {
        const baseObj = new URL(baseUrl);
        const origin = baseObj.origin;
        const apiUrl = `${origin}/wp-json/wp/v2/posts?per_page=10&_embed&_fields=title,link,content,featured_media,_links,_embedded`;

        try {
            logTerminal(`🔌 WordPress REST API deneniyor: ${origin}`);
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`WP API ${response.status}`);
            const posts = await response.json();

            if (!posts || posts.length === 0) return null;

            logTerminal(`✅ WP API başarılı! ${posts.length} makale bulundu.`, 'success');

            // Transform WP API response to standard article format
            return posts.map(post => {
                // Extract cover image from embedded featured media
                let coverImage = '';
                try {
                    const media = post._embedded?.['wp:featuredmedia']?.[0];
                    if (media) {
                        coverImage = media.source_url || '';
                    }
                } catch (e) { }

                // Extract body images from content HTML
                const contentHtml = post.content?.rendered || '';
                const imgParser = document.createElement('div');
                imgParser.innerHTML = contentHtml;
                const bodyImages = [];
                imgParser.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                    if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('1x1') && !src.includes('gravatar')) {
                        bodyImages.push(src);
                    }
                });

                // Extract author name
                let authorName = 'Editör';
                try {
                    authorName = post._embedded?.author?.[0]?.name || 'Editör';
                } catch (e) { }

                // Extract categories
                let categories = [];
                try {
                    const terms = post._embedded?.['wp:term']?.[0] || [];
                    categories = terms.map(t => t.name);
                } catch (e) { }

                // Extract plain text content
                const textContent = imgParser.textContent || imgParser.innerText || '';

                return {
                    title: (post.title?.rendered || '').replace(/<[^>]*>/g, ''),
                    content: textContent,
                    contentHtml: contentHtml,
                    url: post.link,
                    image: coverImage,
                    bodyImages: [...new Set(bodyImages)].slice(0, 5),
                    author: authorName,
                    categories: categories,
                    source: 'wpapi'
                };
            });
        } catch (e) {
            logTerminal(`WP API başarısız: ${e.message}`, 'warning');
            return null;
        }
    }

    // FALLBACK: Fetch articles via RSS feed
    async function fetchViaRSS(baseUrl) {
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
                    // Extract images from RSS HTML content
                    return data.items.map(item => {
                        const htmlContent = item.content || item.description || '';
                        const extractor = document.createElement('div');
                        extractor.innerHTML = htmlContent;
                        const imgs = [];
                        extractor.querySelectorAll('img').forEach(img => {
                            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                            if (src && src.startsWith('http') && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon')) {
                                imgs.push(src);
                            }
                        });
                        return {
                            title: item.title,
                            content: extractor.textContent || extractor.innerText || '',
                            url: item.link,
                            image: item.thumbnail || item.enclosure?.link || imgs[0] || '',
                            bodyImages: [...new Set(imgs)].slice(0, 5),
                            author: item.author || 'Editör',
                            categories: item.categories || [],
                            source: 'rss'
                        };
                    });
                }
            } catch (e) {
                logTerminal(`RSS denemesi başarısız: ${feedUrl}`, 'warning');
            }
        }
        return null;
    }

    // LAST RESORT: Proxy-based fetch (for non-WP, non-RSS sites)
    async function fetchViaProxy(url) {
        const proxies = [
            async (u) => {
                const res = await fetch(`https://r.jina.ai/${u}`, {
                    headers: { 'Accept': 'text/html', 'X-Return-Format': 'html' }
                });
                if (!res.ok) throw new Error(`Jina ${res.status}`);
                return await res.text();
            },
            async (u) => {
                const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error('AllOrigins failed');
                return await res.text();
            }
        ];

        for (const proxyFn of proxies) {
            try {
                const html = await proxyFn(url);
                if (html && html.length > 300) {
                    const lower = html.toLowerCase();
                    if (lower.includes('sorry, you have been blocked') || lower.includes('just a moment...')) continue;
                    return html;
                }
            } catch (err) { }
        }
        logTerminal(`⚠️ '${url}' proxy ile okunamıyor.`, 'warning');
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

        // ========== STRATEGY 1: WP REST API (Best - full content + images) ==========
        // ========== STRATEGY 2: RSS Feed (Fallback - partial content) ==========
        let articles = await fetchViaWPAPI(config.baseUrl);
        let sourceLabel = 'WP API';

        if (!articles || articles.length === 0) {
            articles = await fetchViaRSS(config.baseUrl);
            sourceLabel = 'RSS';
        }

        if (articles && articles.length > 0) {
            logTerminal(`📰 ${sourceLabel} ile ${articles.length} makale bulundu.`, 'success');

            // Filter out already scraped URLs
            const newItems = articles.filter(item => !scrapedUrls.includes(item.url));

            if (newItems.length === 0) {
                logTerminal("Bu döngüde eklenecek yeni haber bulunamadı.", "warning");
                return;
            }

            logTerminal(`🆕 ${newItems.length} yeni makale işlenecek.`, 'success');

            // Process max 2 per cycle
            const itemsToProcess = newItems.slice(0, 2);

            for (const articleData of itemsToProcess) {
                // Clean title
                articleData.title = articleData.title.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();

                logTerminal(`📝 [${sourceLabel}] ${articleData.title}`);
                logTerminal(`📸 Kapak: ${articleData.image ? '✓' : '✗'} | Gövde resimleri: ${articleData.bodyImages.length}`);

                if (articleData.content.length < 100) {
                    logTerminal(`⚠️ İçerik kısa, atlanıyor: ${articleData.url}`, 'warning');
                    scrapedUrls.push(articleData.url);
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

                    scrapedUrls.push(articleData.url);
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
