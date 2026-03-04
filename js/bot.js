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
        // Load 4 source URLs and categories
        for (let i = 1; i <= 4; i++) {
            const urlEl = document.getElementById(`botUrl${i}`);
            const catEl = document.getElementById(`botCat${i}`);
            if (urlEl && config.sources && config.sources[i - 1]) {
                urlEl.value = config.sources[i - 1].url || '';
                if (catEl && config.sources[i - 1].category) catEl.value = config.sources[i - 1].category;
            }
        }
        if (config.interval) document.getElementById('botInterval').value = config.interval;
        if (config.publishDelay) {
            const delayEl = document.getElementById('botPublishDelay');
            if (delayEl) delayEl.value = config.publishDelay;
        }
        return config;
    }

    function saveConfig() {
        const sources = [];
        for (let i = 1; i <= 4; i++) {
            const url = (document.getElementById(`botUrl${i}`)?.value || '').trim();
            const category = document.getElementById(`botCat${i}`)?.value || 'teknoloji';
            if (url) {
                sources.push({ url, category });
            }
        }
        const config = {
            sources: sources,
            interval: parseInt(document.getElementById('botInterval').value, 10),
            publishDelay: parseInt(document.getElementById('botPublishDelay')?.value || '60', 10)
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

    // ==================== HELPERS: MEDIA FILTERING & EXTRACTION ====================

    function isValidImage(img) {
        if (!img) return false;
        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        const className = (img.className || '').toLowerCase();

        // 1. URL Blacklist (Common ad/social signatures)
        const blacklist = [
            'ads', 'advert', 'banner', 'reklam', 'tanitim', 'promo', 'coupon', 'gift', 'pixel', 'tracking',
            'social', 'button', 'icon', 'avatar', 'logo', 'gravatar', '1x1', 'spinner', 'loader',
            'sponsor', 'click', 'redirect', 'taboola', 'outbrain', 'doubleclick', 'googleads',
            'amazon-adsystem', 'adnxs', 'openx', 'rubicon', 'pubmatic', 'criteo', 'smartad',
            'adform', 'zemanta', 'triplelift', 'nativo', 'revcontent', 'sharethrough', 'partner',
            'affiliate', 'widget', 'sidebar', 'footer', 'header', 'nav', 'menu', 'popup', 'modal'
        ];
        if (blacklist.some(word => src.toLowerCase().includes(word))) return false;

        // 2. Alt Text Blacklist
        if (blacklist.some(word => alt.includes(word))) return false;

        // 3. Class Name Blacklist
        if (blacklist.some(word => className.includes(word))) return false;

        // 3. Dimension & Ratio Heuristics
        const width = parseInt(img.getAttribute('width') || img.naturalWidth || '1000', 10);
        const height = parseInt(img.getAttribute('height') || img.naturalHeight || '1000', 10);

        if (width < 200 || height < 150) return false;

        const ratio = width / height;
        if (ratio > 4 || ratio < 0.25) return false;

        const commonAds = ['300x250', '728x90', '160x600', '300x600', '970x250', '320x50', '320x100'];
        if (commonAds.some(size => src.includes(size))) return false;

        // 4. Deep Parent Checks (Traverse up 5 levels)
        let parent = img.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
            const pClass = (parent.className || '').toLowerCase();
            const pId = (parent.id || '').toLowerCase();
            const pTag = parent.tagName.toLowerCase();

            if (['aside', 'footer', 'nav', 'header'].includes(pTag)) return false;
            if (blacklist.some(word => pClass.includes(word) || pId.includes(word))) return false;

            parent = parent.parentElement;
        }

        return src.startsWith('http') || src.startsWith('//') || src.startsWith('/');
    }

    function extractVideos(container) {
        const videos = [];
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.getAttribute('src') || '';
            if (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('vimeo.com') || src.includes('dailymotion.com')) {
                videos.push(src);
            }
        });
        container.querySelectorAll('video').forEach(v => {
            const src = v.getAttribute('src') || v.querySelector('source')?.getAttribute('src');
            if (src) videos.push(src);
        });
        return [...new Set(videos)];
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

                const parser = document.createElement('div');
                parser.innerHTML = post.content?.rendered || '';
                const bodyImages = [];
                parser.querySelectorAll('img').forEach(img => {
                    if (isValidImage(img)) {
                        const src = img.getAttribute('src') || img.getAttribute('data-src');
                        if (src) bodyImages.push(src);
                    }
                });

                const videos = extractVideos(parser);

                return {
                    title: (post.title?.rendered || '').replace(/<[^>]*>/g, ''),
                    content: parser.textContent || parser.innerText || '',
                    contentHtml: post.content?.rendered || '',
                    url: post.link,
                    image: coverImage,
                    bodyImages: [...new Set(bodyImages)].slice(0, 5),
                    videos: videos,
                    author: post._embedded?.author?.[0]?.name || 'Editör',
                    categories: post._embedded?.['wp:term']?.[0]?.map(t => t.name) || [],
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
                            if (isValidImage(img)) {
                                const src = img.getAttribute('src') || img.getAttribute('data-src');
                                if (src) imgs.push(src);
                            }
                        });

                        const videos = extractVideos(extractor);

                        return {
                            title: item.title,
                            content: extractor.textContent || extractor.innerText || '',
                            url: item.link,
                            image: item.thumbnail || item.enclosure?.link || imgs[0] || '',
                            bodyImages: [...new Set(imgs)].slice(0, 5),
                            videos: videos,
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
            articleTag.querySelectorAll('img').forEach(img => {
                if (isValidImage(img)) {
                    let src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
                    if (src) {
                        if (src.startsWith('/')) src = baseObj.origin + src;
                        else if (src.startsWith('//')) src = 'https:' + src;
                        bodyImages.push(src);
                    }
                }
            });

            const vids = extractVideos(articleTag);

            const clone = articleTag.cloneNode(true);
            const useless = clone.querySelectorAll('script, style, iframe, nav, header, footer, .ads, .sidebar, .social-share');
            useless.forEach(s => s.remove());
            const content = clone.innerText;
            return { title, image, content, url, bodyImages: [...new Set(bodyImages)].slice(0, 3), videos: vids };
        } else {
            const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.innerText);
            const content = paragraphs.filter(p => p.length > 50).join('\n\n');
            return { title, image, content, url, bodyImages: [], videos: [] };
        }
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

                // Insert Images
                if (imgIdx < images.length && (i + 1) % interval === 0 && i < paragraphs.length - 2) {
                    finalHtml += `<div class="article-body-img" style="margin: 2rem 0;"><img src="${images[imgIdx]}" style="width:100%; border-radius:12px; border:1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></div>`;
                    imgIdx++;
                }

                // Insert Videos (one at a time, spaced out)
                if (originalData.videos && originalData.videos[i]) {
                    const videoSrc = originalData.videos[i];
                    let vidEmbed = '';
                    if (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be')) {
                        let vidId = '';
                        if (videoSrc.includes('v=')) vidId = videoSrc.split('v=')[1].split('&')[0];
                        else if (videoSrc.includes('embed/')) vidId = videoSrc.split('embed/')[1].split('?')[0];
                        else if (videoSrc.includes('youtu.be/')) vidId = videoSrc.split('youtu.be/')[1].split('?')[0];
                        if (vidId) vidEmbed = `https://www.youtube.com/embed/${vidId}`;
                    } else if (videoSrc.includes('vimeo.com')) {
                        const vidId = videoSrc.split('/').pop();
                        if (vidId) vidEmbed = `https://player.vimeo.com/video/${vidId}`;
                    } else {
                        vidEmbed = videoSrc;
                    }

                    if (vidEmbed) {
                        finalHtml += `
                            <div class="video-container" style="margin: 2rem 0; border-radius: 12px; overflow: hidden; aspect-ratio: 16/9; background:#000; border:1px solid var(--border);">
                                <iframe src="${vidEmbed}" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>
                            </div>
                        `;
                    }
                }
            }

            // If any images left
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
        const sources = config.sources || [];

        if (sources.length === 0) {
            logTerminal('Hata: En az 1 kaynak URL girilmelidir!', 'error');
            stopBot();
            return;
        }

        const publishDelay = (config.publishDelay || 60) * 1000; // seconds to ms
        let allNewArticles = []; // Collect from all sources

        logTerminal('═══════════════════════════════════════');
        logTerminal(`🚀 Çoklu kaynak taraması başlıyor (${sources.length} kaynak)`, 'success');
        logTerminal('═══════════════════════════════════════');

        // ========== PHASE 1: Fetch from ALL sources ==========
        for (let si = 0; si < sources.length; si++) {
            const source = sources[si];
            const sourceNum = si + 1;
            const sourceColors = ['🟢', '🔵', '🟡', '🔴'];

            logTerminal(`${sourceColors[si]} ─── Kaynak ${sourceNum}: ${source.url} ───`);

            // Try WP API first, then RSS
            let articles = await fetchViaWPAPI(source.url);
            let sourceLabel = 'WP API';

            if (!articles || articles.length === 0) {
                articles = await fetchViaRSS(source.url);
                sourceLabel = 'RSS';
            }

            if (articles && articles.length > 0) {
                logTerminal(`📰 [Kaynak ${sourceNum}] ${sourceLabel} ile ${articles.length} makale bulundu.`, 'success');

                // Filter already scraped
                const newItems = articles.filter(item => !scrapedUrls.includes(item.url));
                logTerminal(`🆕 [Kaynak ${sourceNum}] ${newItems.length} yeni makale.`);

                // Take max 2 per source
                newItems.slice(0, 2).forEach(item => {
                    item._sourceCategory = source.category;
                    item._sourceNum = sourceNum;
                    item._sourceLabel = sourceLabel;
                    allNewArticles.push(item);
                });
            } else {
                // Try proxy fallback for non-WP, non-RSS sites
                logTerminal(`⚠️ [Kaynak ${sourceNum}] WP API ve RSS bulunamadı, proxy deneniyor...`, 'warning');
                const html = await fetchViaProxy(source.url);
                if (html) {
                    const newLinks = await findLinksOnPage(html, source.url);
                    const filteredLinks = newLinks.filter(l => !scrapedUrls.includes(l));
                    logTerminal(`🔗 [Kaynak ${sourceNum}] Proxy ile ${filteredLinks.length} yeni link.`);

                    for (const link of filteredLinks.slice(0, 2)) {
                        const articleHtml = await fetchViaProxy(link);
                        if (articleHtml) {
                            const articleData = await extractArticleData(articleHtml, link);
                            if (articleData.title && articleData.content && articleData.content.length > 200) {
                                articleData._sourceCategory = source.category;
                                articleData._sourceNum = sourceNum;
                                articleData._sourceLabel = 'Proxy';
                                allNewArticles.push(articleData);
                            }
                        }
                    }
                } else {
                    logTerminal(`❌ [Kaynak ${sourceNum}] Erişilemiyor.`, 'error');
                }
            }
        }

        // ========== PHASE 2: Process & Publish with delay ==========
        if (allNewArticles.length === 0) {
            logTerminal('📭 Hiçbir kaynakta yeni makale bulunamadı.', 'warning');
            return;
        }

        logTerminal(`\n📋 Toplam ${allNewArticles.length} yeni makale işlenecek (${config.publishDelay || 60}sn arayla)`, 'success');

        for (let i = 0; i < allNewArticles.length; i++) {
            const articleData = allNewArticles[i];
            const category = articleData._sourceCategory || 'teknoloji';

            // Clean title
            articleData.title = articleData.title.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();

            logTerminal(`\n📝 [${i + 1}/${allNewArticles.length}] [Kaynak ${articleData._sourceNum}] ${articleData.title}`);
            logTerminal(`📸 Kapak: ${articleData.image ? '✓' : '✗'} | Gövde resimleri: ${(articleData.bodyImages || []).length}`);

            if ((articleData.content || '').length < 100) {
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

                publishArticle(finalHtml, articleData, category);

                scrapedUrls.push(articleData.url);
                DB.set('scraped_urls', scrapedUrls);

            } catch (err) {
                logTerminal(`❌ AI İşleme Hatası: ${err.message}`, 'error');
            }

            // Wait between publishes (except after last article)
            if (i < allNewArticles.length - 1) {
                logTerminal(`⏳ Sonraki makale için ${config.publishDelay || 60} saniye bekleniyor...`, 'info');
                await new Promise(r => setTimeout(r, publishDelay));
            }
        }

        logTerminal('✅ Tüm kaynaklar tarandı ve içerikler yayınlandı. Bekleme moduna dönülüyor.', 'success');
    }

    function startBot() {
        const config = saveConfig();
        if (!config.sources || config.sources.length === 0) {
            showAdminToast("Lütfen en az 1 kaynak URL girin!", "error");
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

        logTerminal(`[BAŞLATILDI] Otonom Bot devreye girdi.`, 'success');
        logTerminal(`📡 ${config.sources.length} kaynak | ⏰ ${config.interval} dk tarama | ⏳ ${config.publishDelay}sn yayın aralığı`, 'info');

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

    function resetBotData() {
        if (!confirm('Botun taranmış URL hafızasını ve ayarlarını sıfırlamak istediğinize emin misiniz?')) return;

        DB.delete('bot_config');
        DB.delete('bot_scraped_urls');
        logTerminal(`[SIFIRLANDI] Bot hafızası ve ayarları temizlendi. Sayfayı yenileyin.`, 'warning');

        setTimeout(() => location.reload(), 1500);
    }

    // Expose public API
    const exports = {
        init,
        startBot,
        stopBot,
        saveConfig,
        saveConfigWithToast: function () {
            saveConfig();
            if (typeof showAdminToast === 'function') {
                showAdminToast('✅ Bot ayarları kaydedildi!', 'success');
            } else {
                alert('Ayarlar kaydedildi!');
            }
        },
        loadConfig,
        clearLogs,
        resetBotData
    };

    window.BotEngine = exports;
    return exports;
})();

document.addEventListener('DOMContentLoaded', () => {
    // Run only if we are on the bot.html logic
    if (document.getElementById('botTerminal')) {
        BotEngine.init();

        document.getElementById('btnStartBot').addEventListener('click', () => BotEngine.startBot());
        document.getElementById('btnStopBot').addEventListener('click', () => BotEngine.stopBot());

        // Expose clear function for the inline onclick in html
        window.clearLogs = BotEngine.clearLogs;
    }
});
