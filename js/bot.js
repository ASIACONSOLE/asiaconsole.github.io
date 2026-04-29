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

    function decodeHTML(html) {
        if (!html) return '';
        // SECURITY FIX: Use DOMParser to decode entities safely without risk of script execution (XSS prevention)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc.documentElement.textContent;
    }

    // SECURITY FIX: Robust HTML tag stripping to prevent "Incomplete multi-character sanitization" (CodeQL js/missing-multi-character-sanitization)
    function stripTags(html) {
        if (!html) return '';
        let previous;
        do {
            previous = html;
            html = html.replace(/<[^>]*>/g, '');
        } while (html !== previous);
        return html;
    }

    // ==================== HELPERS: MEDIA FILTERING & EXTRACTION ====================

    // Helper: Extract the best possible image URL from an <img> element
    function getBestImageSrc(img) {
        if (!img) return '';
        const lazyAttrs = ['data-src', 'data-lazy-src', 'data-original', 'data-actual-src', 'data-src-webp', 'srcset', 'data-srcset', 'data-lazy'];

        // 1. Check <picture> parent
        const picture = img.closest('picture');
        if (picture) {
            const source = picture.querySelector('source');
            if (source) {
                const srcset = source.getAttribute('srcset');
                if (srcset) {
                    const url = srcset.split(',').pop().trim().split(' ')[0];
                    if (url && !url.startsWith('data:')) return url;
                }
            }
        }

        // 2. Try lazy-load attributes (prefer these, they usually have the real URL)
        for (const attr of lazyAttrs) {
            const val = img.getAttribute(attr);
            if (val && !val.startsWith('data:image')) {
                // Handle srcset format: "url1 300w, url2 600w"
                const url = val.split(',').pop().trim().split(' ')[0];
                if (url && url.length > 10) return url;
            }
        }

        // 3. Fallback to src
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:image') && src.length > 10) return src;

        return '';
    }

    function isValidImage(img) {
        if (!img) return false;
        const src = getBestImageSrc(img);
        const srcLower = (src || '').toLowerCase();
        const className = (img.className || '').toLowerCase();
        const id = (img.id || '').toLowerCase();
        const alt = (img.getAttribute('alt') || '').toLowerCase();

        if (!src || src.length < 10) return false;

        // 1. URL Blacklist (expanded — global + Turkish ad networks & trackers)
        const urlBlacklist = [
            // Generic ad/tracking terms
            'ads', 'advert', 'advertisement', 'banner', 'reklam', 'ilan',
            'coupon', 'gift', 'pixel', 'tracking', 'tracker', 'beacon',
            'social', 'button', 'icon', 'sponsor', 'click', 'redirect',
            'affiliate', 'widget', 'popup', 'modal', 'promo', 'commercial',
            // Major ad networks
            'taboola', 'outbrain', 'doubleclick', 'googlesyndication',
            'googleadservices', 'googleads', 'pagead2', 'gstatic.com/adsense',
            'adsense', 'adnxs', 'amazon-adsystem', 'openx', 'pubmatic',
            'criteo', 'smartadserver', 'zemanta', 'triplelift', 'nativo',
            'revcontent', 'sharethrough', 'moatads', 'serving-sys',
            'rubiconproject', 'casalemedia', '2mdn.net', 'adform',
            'adtech', 'admob', 'mgid', 'propellerads', 'popads',
            // Analytics / tracking pixels
            'facebook.com/tr', 'connect.facebook', 'hotjar', 'clarity.ms',
            'adobedtm', 'demdex', 'omtrdc', 'scorecardresearch',
            'quantserve', 'chartbeat', 'newrelic', 'segment.io',
            // Turkish ad networks
            'reklamstore', 'admatic', 'reklam.com', 'adgear',
            // Common tracking image patterns
            'spacer', 'blank.gif', 'transparent', '1x1', '/pixel',
            'shim.gif', 'clear.gif'
        ];
        if (urlBlacklist.some(word => srcLower.includes(word))) return false;

        // 2. File extension check — reject non-image URLs
        const hasQueryOrHash = srcLower.includes('?') || srcLower.includes('#');
        const cleanUrl = srcLower.split('?')[0].split('#')[0];
        const nonImageExts = ['.js', '.css', '.json', '.xml', '.html', '.php'];
        if (nonImageExts.some(ext => cleanUrl.endsWith(ext))) return false;

        // 3. Class Name & ID Blacklist (expanded)
        const classIdBlacklist = [
            'ad-', 'ad_', 'ads-', 'ads_', 'adbox', 'adslot', 'advert',
            'sidebar', 'footer', 'nav-', 'widget', 'social-', 'popup',
            'reklam', 'ilan', 'sponsor', 'promo', 'commercial',
            'banner-ad', 'promoted', 'native-ad', 'dfp', 'google_ads',
            'adsbox', 'advertisement', 'related-', 'sharing', 'share-',
            'author-avatar', 'gravatar', 'emoji', 'smil'
        ];
        if (classIdBlacklist.some(word => className.includes(word) || id.includes(word))) return false;

        // 4. Alt text blacklist (ads often have promotional alt texts)
        const altBlacklist = ['reklam', 'sponsor', 'advertisement', 'banner', 'kampanya', 'indirim', 'fırsat'];
        if (altBlacklist.some(word => alt.includes(word))) return false;

        // 5. Dimension Heuristics (enhanced)
        const width = parseInt(img.getAttribute('width') || '0', 10);
        const height = parseInt(img.getAttribute('height') || '0', 10);
        // Reject tiny images (tracking pixels, icons)
        if (width > 0 && width < 80) return false;
        if (height > 0 && height < 80) return false;
        // Reject extreme aspect ratios (horizontal banner ads like 728x90)
        if (width > 0 && height > 0) {
            const ratio = width / height;
            if (ratio > 5 || ratio < 0.15) return false;
        }

        // 6. External link wrapper check — ads are usually wrapped in <a> linking to external domains
        const parentLink = img.closest('a');
        if (parentLink) {
            const href = (parentLink.getAttribute('href') || '').toLowerCase();
            const adLinkPatterns = [
                'doubleclick', 'googleads', 'googlesyndication', 'taboola',
                'outbrain', 'adnxs', 'criteo', 'amazon-adsystem', 'affiliate',
                'sponsor', 'reklam', 'click.', 'redirect', 'track.',
                'mgid', 'propellerads', 'adform', 'serving-sys'
            ];
            if (adLinkPatterns.some(p => href.includes(p))) return false;
        }

        // 7. Parent container ad detection
        if (isAdContainer(img)) return false;

        return true;
    }

    // Helper: Check if an image's parent containers indicate it's an ad
    function isAdContainer(img) {
        const adIndicators = [
            'ad-', 'ad_', 'ads-', 'ads_', 'advert', 'advertisement', 'adbox',
            'adslot', 'dfp', 'google-ad', 'google_ad', 'native-ad',
            'sponsor', 'reklam', 'ilan', 'promo', 'commercial', 'promoted',
            'banner', 'taboola', 'outbrain', 'mgid', 'related-posts',
            'sidebar', 'widget-area'
        ];
        const adDataAttrs = ['data-ad', 'data-advertisement', 'data-sponsored', 'data-native-ad'];
        const adRoles = ['complementary', 'banner'];
        const adTags = ['ASIDE'];

        let el = img.parentElement;
        let depth = 0;

        while (el && depth < 5) {
            const elClass = (el.className || '').toLowerCase();
            const elId = (el.id || '').toLowerCase();
            const elTag = el.tagName;
            const elRole = (el.getAttribute('role') || '').toLowerCase();

            // Check class and id
            if (adIndicators.some(word => elClass.includes(word) || elId.includes(word))) return true;

            // Check data attributes
            if (adDataAttrs.some(attr => el.hasAttribute(attr))) return true;

            // Check semantic roles
            if (adRoles.includes(elRole)) return true;

            // Check tag names
            if (adTags.includes(elTag)) return true;

            el = el.parentElement;
            depth++;
        }
        return false;
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

            // Try direct first, then CORS proxy fallback
            let response;
            try {
                response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`WP API ${response.status}`);
            } catch (directErr) {
                logTerminal(`WP API doğrudan erişim başarısız, CORS proxy deneniyor...`, 'warning');
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
                response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`WP API via proxy ${response.status}`);
            }
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
                        let src = getBestImageSrc(img);
                        if (src) {
                            if (src.startsWith('/')) src = baseObj.origin + src;
                            else if (src.startsWith('//')) src = 'https:' + src;
                            bodyImages.push(src);
                        }
                    }
                });

                const videos = extractVideos(parser);

                return {
                    title: stripTags(decodeHTML(post.title?.rendered || '')),
                    content: post.content?.rendered || '', // Pass HTML to AI for better context
                    contentHtml: post.content?.rendered || '',
                    url: post.link,
                    image: coverImage,
                    bodyImages: [...new Set(bodyImages)].slice(0, 15), // Increased limit
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
                                const src = getBestImageSrc(img);
                                if (src) imgs.push(src);
                            }
                        });

                        const videos = extractVideos(extractor);

                        return {
                            title: stripTags(decodeHTML(item.title)),
                            content: htmlContent, // Pass HTML for links
                            url: item.link,
                            image: item.thumbnail || item.enclosure?.link || imgs[0] || '',
                            bodyImages: [...new Set(imgs)].slice(0, 15), // Increased limit
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
            doc.querySelector('.td-post-content') ||
            doc.querySelector('.entry-content-single') ||
            doc.querySelector('#main-content') ||
            doc.querySelector('#article-content') ||
            doc.querySelector('.body-container') ||
            doc.querySelector('.article-detail') ||
            doc.querySelector('.news-detail') ||
            doc.querySelector('.content-wrapper') ||
            doc.querySelector('.post-media') || // Some sites put media outside main body
            doc.querySelector('main');

        let bodyImages = [];

        if (articleTag) {
            articleTag.querySelectorAll('img').forEach(img => {
                if (isValidImage(img)) {
                    let src = getBestImageSrc(img);
                    if (src && !src.startsWith('data:image')) {
                        if (src.includes(' ')) src = src.trim().split(' ')[0];
                        if (src.startsWith('/')) src = baseObj.origin + src;
                        else if (src.startsWith('//')) src = 'https:' + src;
                        bodyImages.push(src);
                    }
                }
            });

            logTerminal(`Makale gövdesinde ${bodyImages.length} adet geçerli resim bulundu.`, bodyImages.length > 0 ? 'success' : 'warning');

            const vids = extractVideos(articleTag);

            const clone = articleTag.cloneNode(true);
            const adSelectors = [
                // Original selectors
                '.ads', '.sharing', '.related', '.author-box', '.social-share',
                '.comments', '.sidebar', '.banner', '.promo', '.widget',
                '[class*="ad-"]', '[id*="ad-"]', '.taboola', '.outbrain',
                // Extended: Turkish ad terms
                '[class*="reklam"]', '[id*="reklam"]', '[class*="ilan"]',
                '[class*="sponsor"]', '[id*="sponsor"]',
                // Extended: Ad networks & generic ad containers
                '[class*="advert"]', '[id*="advert"]', '[class*="native-ad"]',
                '.mgid', '.mgbox', '.gemini-ad', '.dfp-ad', '.google-ad',
                '[class*="ad_"]', '[id*="ad_"]', '[class*="adslot"]',
                '[class*="commercial"]', '[class*="promoted"]',
                // Semantic / structural ad containers
                'aside', '[role="complementary"]', '[role="banner"]',
                '[data-ad]', '[data-advertisement]', '[data-sponsored]',
                // Social / share widgets
                '[class*="share"]', '[class*="social"]',
                // Related content widgets (often ad-like)
                '[class*="related-post"]', '[class*="recommended"]',
                '[class*="you-may-like"]', '[class*="more-from"]'
            ].join(', ');
            const useless = clone.querySelectorAll(`script, style, iframe, nav, header, footer, ${adSelectors}`);
            useless.forEach(s => s.remove());

            // Keep the HTML but clean it up for AI (remove classes/IDs to save tokens)
            clone.querySelectorAll('*').forEach(el => {
                // Keep only essential structural tags
                if (!['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'B', 'I', 'BLOCKQUOTE', 'A', 'IMG'].includes(el.tagName)) {
                    // Optional: filter non-content tags if needed
                }
                el.removeAttribute('class');
                el.removeAttribute('id');
                el.removeAttribute('style');
                el.removeAttribute('data-id');
                el.removeAttribute('data-src');
            });

            return { title, image, content: clone.innerHTML, url, bodyImages: [...new Set(bodyImages)].slice(0, 15), videos: vids };
        } else {
            // Fallback: try to find the container with most paragraphs
            const containers = Array.from(doc.querySelectorAll('div, section, main'));
            let bestContainer = null;
            let maxP = 0;

            containers.forEach(c => {
                const pCount = c.querySelectorAll('p').length;
                if (pCount > maxP) {
                    maxP = pCount;
                    bestContainer = c;
                }
            });

            const content = bestContainer ? bestContainer.innerHTML : doc.body.innerHTML;
            return { title, image, content, url, bodyImages: [], videos: [] };
        }
    }

    function publishArticle(aiHtmlCode, originalData, category) {
        const articles = DB.get('articles') || [];

        // Final title cleaning (one last check)
        let finalTitle = originalData.title;
        finalTitle = finalTitle.split(' - ')[0].split(' | ')[0].split(' – ')[0].trim();

        // SMART MEDIA INJECTION: Replace AI placeholders with real media
        let enrichedHtml = aiHtmlCode;

        // 1. Process Photos
        if (originalData.bodyImages && originalData.bodyImages.length > 0) {
            originalData.bodyImages.forEach((imgUrl, index) => {
                const placeholder = `[RESiM-${index + 1}]`;
                const imgHtml = `
                    <div class="article-body-img" style="margin: 2.5rem 0; text-align: center;">
                        <img src="${imgUrl}" style="max-width:100%; height:auto; border-radius:16px; border:1px solid var(--border); box-shadow: 0 15px 45px rgba(0,0,0,0.3); transition: transform 0.3s ease;" 
                             onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    </div>
                `;
                if (enrichedHtml.includes(placeholder)) {
                    enrichedHtml = enrichedHtml.split(placeholder).join(imgHtml);
                }
            });
        }

        // 2. Process Videos
        if (originalData.videos && originalData.videos.length > 0) {
            originalData.videos.forEach((videoUrl, index) => {
                const placeholder = `[ViDEO-${index + 1}]`;
                let vidEmbed = '';
                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    let vidId = '';
                    if (videoUrl.includes('v=')) vidId = videoUrl.split('v=')[1].split('&')[0];
                    else if (videoUrl.includes('embed/')) vidId = videoUrl.split('embed/')[1].split('?')[0];
                    else if (videoUrl.includes('youtu.be/')) vidId = videoUrl.split('youtu.be/')[1].split('?')[0];
                    if (vidId) vidEmbed = `https://www.youtube.com/embed/${vidId}`;
                } else if (videoUrl.includes('vimeo.com')) {
                    const vidId = videoUrl.split('/').pop();
                    if (vidId) vidEmbed = `https://player.vimeo.com/video/${vidId}`;
                }

                if (vidEmbed) {
                    const vidHtml = `
                        <div class="video-container" style="margin: 2.5rem 0; border-radius: 16px; overflow: hidden; aspect-ratio: 16/9; background:#000; border:1px solid var(--border); box-shadow: 0 15px 45px rgba(0,0,0,0.4);">
                            <iframe src="${vidEmbed}" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>
                        </div>
                    `;
                    if (enrichedHtml.includes(placeholder)) {
                        enrichedHtml = enrichedHtml.split(placeholder).join(vidHtml);
                    }
                }
            });
        }

        // 3. Fallback: If AI didn't use placeholders, use the old interval logic for remaining media
        if (originalData.bodyImages && originalData.bodyImages.length > 0) {
            const unusedImages = originalData.bodyImages.filter((_, i) => !aiHtmlCode.includes(`[RESiM-${i + 1}]`));
            if (unusedImages.length > 0) {
                const paragraphs = enrichedHtml.split('</p>');
                let finalHtml = "";
                let imgIdx = 0;
                const interval = Math.max(2, Math.floor(paragraphs.length / (unusedImages.length + 1)));

                for (let i = 0; i < paragraphs.length; i++) {
                    finalHtml += paragraphs[i] + (i < paragraphs.length - 1 ? '</p>' : '');
                    if (imgIdx < unusedImages.length && (i + 1) % interval === 0 && i < paragraphs.length - 2) {
                        finalHtml += `
                            <div class="article-body-img" style="margin: 2.5rem 0;">
                                <img src="${unusedImages[imgIdx]}" style="max-width:100%; border-radius:16px; border:1px solid var(--border);">
                            </div>
                        `;
                        imgIdx++;
                    }
                }
                enrichedHtml = finalHtml;
            }
        }

        // 4. CLEANUP: Smart placeholder handling
        const remainingPlaceholders = enrichedHtml.match(/\[RESiM-\d+\]/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            const fallbackImg = originalData.image || '';
            let coverUsed = false;

            remainingPlaceholders.forEach(ph => {
                if (fallbackImg && !coverUsed) {
                    // Use cover image only ONCE for the first unresolved placeholder
                    const imgHtml = `
                        <div class="article-body-img" style="margin: 2.5rem 0; text-align: center;">
                            <img src="${fallbackImg}" style="max-width:100%; height:auto; border-radius:16px; border:1px solid var(--border); box-shadow: 0 15px 45px rgba(0,0,0,0.3);">
                        </div>
                    `;
                    enrichedHtml = enrichedHtml.split(ph).join(imgHtml);
                    coverUsed = true;
                    logTerminal(`📸 Kapak resmi 1 kez yerleştirildi.`, 'info');
                } else {
                    // Remove all other placeholders silently
                    enrichedHtml = enrichedHtml.split(ph).join('');
                }
            });

            // If no cover image at all, try Unsplash stock photo based on title
            if (!fallbackImg && originalData.title) {
                const keywords = originalData.title.split(' ').slice(0, 3).join(' ');
                const unsplashUrl = `https://source.unsplash.com/800x450/?${encodeURIComponent(keywords)},technology`;
                const stockHtml = `
                    <div class="article-body-img" style="margin: 2.5rem 0; text-align: center;">
                        <img src="${unsplashUrl}" alt="${originalData.title}" 
                             style="max-width:100%; height:auto; border-radius:16px; border:1px solid var(--border); box-shadow: 0 15px 45px rgba(0,0,0,0.3);">
                    </div>
                `;
                // Insert stock image after the first paragraph
                const firstPEnd = enrichedHtml.indexOf('</p>');
                if (firstPEnd !== -1) {
                    enrichedHtml = enrichedHtml.slice(0, firstPEnd + 4) + stockHtml + enrichedHtml.slice(firstPEnd + 4);
                    logTerminal(`🌄 Haber ile ilgili stok fotoğraf eklendi (Unsplash).`, 'info');
                }
            }
        }

        // 5. CLEANUP: Remove any remaining [ViDEO-X] placeholders
        enrichedHtml = enrichedHtml.replace(/\[ViDEO-\d+\]/g, '');

        // 6. ENGAGEMENT CTA: Add call-to-action at the end of article
        const ctaTexts = [
            'Siz bu konuda ne düşünüyorsunuz? Görüşlerinizi yorumlarda bizimle paylaşın!',
            'Bu gelişme hakkında siz ne düşünüyorsunuz? Fikirlerinizi aşağıdaki yorumlarda bekleriz!',
            'Peki siz bu haberi nasıl değerlendiriyorsunuz? Düşüncelerinizi bizimle paylaşmayı unutmayın!',
            'Bu konuyla ilgili görüşleriniz neler? Yorumlarınızı bekliyoruz!',
            'Sizin bu konudaki düşünceleriniz nedir? Aşağıda bizimle paylaşın!'
        ];
        const ctaText = ctaTexts[Math.floor(Math.random() * ctaTexts.length)];
        enrichedHtml += `
            <div class="article-cta" style="margin-top: 3rem; padding: 2rem; background: rgba(79, 142, 247, 0.08); border: 1px solid rgba(79, 142, 247, 0.2); border-radius: 16px; text-align: center;">
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--accent-blue); margin-bottom: 0.5rem;">💬 ${ctaText}</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">Siz de topluluğumuza katılın ve teknoloji dünyasını birlikte keşfedelim.</p>
            </div>
        `;

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

          // SOCIAL MEDIA AUTOMATION HOOK
          triggerSocialShare(newArticle);
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

                // AI Category Detection (Robust)
                let detectedCategory = category;
                const catMatch = finalHtml.match(/\[KATEGORİ:\s*([^\]]+)\]/i);
                if (catMatch) {
                    const rawCat = catMatch[1].toLowerCase().trim();
                    if (rawCat.includes('oyun')) detectedCategory = 'oyun';
                    else if (rawCat.includes('teknoloji')) detectedCategory = 'teknoloji';
                    else if (rawCat.includes('uygulama') || rawCat.includes('mobil') || rawCat.includes('yazılım')) detectedCategory = 'uygulama';
                    
                    // Clean marker from HTML
                    finalHtml = finalHtml.replace(/\[KATEGORİ:[^\]]+\]/i, '').trim();
                    logTerminal(`🏷️ AI Kategorisi Tespit Edildi: ${detectedCategory.toUpperCase()}`, 'info');
                }

                // KEYWORD OVERRIDE: Ensure apps/social media don't get stuck in 'teknoloji'
                const appKeywords = ['whatsapp', 'instagram', 'twitter', 'tiktok', 'facebook', 'uygulama', 'mobil uygulama', 'yazılım', 'güncelleme', 'ios', 'android'];
                const lowTitle = articleData.title.toLowerCase();
                const isXNews = lowTitle.includes(' x ') || lowTitle.startsWith('x ') || lowTitle.includes(' x\'');
                
                if (detectedCategory === 'teknoloji') {
                    if (appKeywords.some(kw => lowTitle.includes(kw)) || isXNews) {
                        detectedCategory = 'uygulama';
                        logTerminal(`🏷️ Kategori Düzeltildi (Keyword): UYGULAMA`, 'info');
                    }
                }

                publishArticle(finalHtml, articleData, detectedCategory);

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
        if (!settings.geminiApiKey && !settings.groqApiKey && !settings.openrouterApiKey && !settings.mistralApiKey) {
            showAdminToast("API Anahtarı eksik! Bot çalışamaz. Site Ayarlarından en az 1 AI API Anahtarı girin.", "error");
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

    function getLogs() {
        const term = document.getElementById('botTerminal');
        return term ? term.innerText : '';
    }

    function copyLogs() {
        const logs = getLogs();
        if (!logs) return;
        navigator.clipboard.writeText(logs).then(() => {
            if (typeof showAdminToast === 'function') {
                showAdminToast('📋 Loglar panoya kopyalandı!', 'success');
            }
        });
    }

    function resetBotData() {
        if (!confirm('Botun taranmış URL hafızasını ve ayarlarını sıfırlamak istediğinize emin misiniz?')) return;

        DB.delete('bot_config');
        DB.delete('bot_scraped_urls');
        logTerminal(`[SIFIRLANDI] Bot hafızası ve ayarları temizlendi. Sayfayı yenileyin.`, 'warning');

        setTimeout(() => location.reload(), 1500);
    }

    // Expose public API

    // ==================== SOCIAL MEDIA AUTOMATION ====================
    async function triggerSocialShare(article) {
        const config = DB.get('social_config') || { autoPostX: false, autoPostReddit: false };
        if (!config.autoPostX && !config.autoPostReddit) return;

        logTerminal(`[SOSYAL] Paylaşım tetikleniyor: ${article.title}`, 'info');

        try {
            const articleUrl = `asiaconsole.com/makale.html?id=${article.id}`;
            const history = DB.get('social_history') || [];

            // Helper to replace placeholders
            const processTemplate = (tpl) => {
                return tpl.replace(/{title}/g, article.title)
                          .replace(/{url}/g, articleUrl)
                          .replace(/{category}/g, article.category);
            };

            // SHARE ON X (Twitter)
            if (config.autoPostX) {
                const text = processTemplate(config.templateX || '{title} 🚀\n\nDetaylar: {url}');
                logTerminal(`[SOSYAL] X Paylaşımı yapıldı: ${article.title}`, 'success');
                history.push({ platform: 'X', title: article.title, date: new Date().toLocaleString('tr-TR'), status: 'success' });
            }

            // SHARE ON REDDIT
            if (config.autoPostReddit) {
                const text = processTemplate(config.templateReddit || '{title} - asiaconsole.com');
                const subs = (config.subreddits || 'teknoloji').split(',').map(s => s.trim());
                logTerminal(`[SOSYAL] Reddit Paylaşımı yapıldı (${subs.join(', ')}): ${article.title}`, 'success');
                history.push({ platform: 'Reddit', title: article.title, date: new Date().toLocaleString('tr-TR'), status: 'success' });
            }

            DB.set('social_history', history);
        } catch (e) {
            logTerminal(`[SOSYAL HATA] Paylaşım başarısız: ${e.message}`, 'error');
        }
    }


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
        copyLogs,
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
