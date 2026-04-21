/**
 * AsiaConsole Home Page Logic
 * Optimized for reliability and data loading order.
 */

let lastRenderedHash = "";

function renderHome() {
    try {
        const DB = window.DB;
        if (!DB) return;

        const articles = (DB.get('articles') || [])
            .filter(a => a && typeof a === 'object' && a.title)
            .map(a => ({ ...a, type: 'article' }));

        const forumPosts = (DB.get('forum_posts') || []).filter(p => p && (p.status === 'approved' || !p.status));
        const users = DB.get('users') || [];

        // --- ANTI-FLICKER: Content Hash Check ---
        // We only re-render the DOM if the essential data has changed.
        // This prevents the "flash" when Firebase syncs the same data we already have from LocalStorage.
        const currentDataHash = JSON.stringify({
            articleIds: articles.map(a => a.id),
            forumIds: forumPosts.map(f => f.id),
            userCount: users.length,
            firstArticleTitle: articles[0]?.title || ''
        });

        if (currentDataHash === lastRenderedHash) {
            return; // Data is identical, skip DOM manipulation to prevent flickering
        }
        lastRenderedHash = currentDataHash;
        // ----------------------------------------

        // Stats
        const statArticles = document.getElementById('statArticles');
        const statTopics = document.getElementById('statTopics');
        const statMembers = document.getElementById('statMembers');

        if (statArticles) statArticles.textContent = articles.length.toLocaleString('tr-TR');
        if (statTopics) statTopics.textContent = forumPosts.length.toLocaleString('tr-TR');
        if (statMembers && users.length > 3) {
            statMembers.textContent = (1240 + users.length - 3).toLocaleString('tr-TR');
        }

        // Category counts
        const techCount = articles.filter(a => a.category === 'teknoloji').length;
        const gameCount = articles.filter(a => a.category === 'oyun').length;
        const appCount = articles.filter(a => a.category === 'uygulama').length;

        const elTech = document.getElementById('catTechCount');
        const elGame = document.getElementById('catGameCount');
        const elApp = document.getElementById('catAppCount');
        const elForum = document.getElementById('catForumCount');

        if (elTech) elTech.textContent = techCount + ' makale';
        if (elGame) elGame.textContent = gameCount + ' makale';
        if (elApp) elApp.textContent = appCount + ' makale';
        if (elForum) elForum.textContent = forumPosts.length + ' konu';

        // News Ticker
        const tickerContainer = document.getElementById('newsTicker');
        const tickerContent = document.getElementById('tickerItems');
        if (tickerContainer && tickerContent) {
            const latestArticles = articles.slice(0, 5);
            if (latestArticles.length > 0) {
                tickerContainer.style.display = 'flex';
                const tickerHTML = latestArticles.map(a => `
                    <a href="makale-detay.html?id=${a.id}" class="ticker-item">
                        <span class="dot"></span>
                        ${a.title}
                    </a>
                `).join('');
                tickerContent.innerHTML = tickerHTML + tickerHTML;
            } else {
                tickerContainer.style.display = 'none';
            }
        }

        // --- PORTAL RENDER (Slider & Side Content) ---
        const portalSlider = document.getElementById('portalSlider');
        const portalSide = document.getElementById('portalSideItems');
        const videoGrid = document.getElementById('videoHighlightGrid');

        if (portalSlider && articles.length > 0) {
            const sliderArticles = articles.slice(0, 5);
            portalSlider.innerHTML = sliderArticles.map((a, i) => `
                <a href="makale-detay.html?id=${a.id}" class="portal-slide-item ${i === 0 ? 'active' : ''}" data-index="${i}">
                    <img src="${a.cover || a.image || ''}" class="portal-slide-img" alt="${a.title}">
                    <div class="portal-slide-content">
                        <div class="portal-slide-badge">${a.category}</div>
                        <h2 class="portal-slide-title">${a.title}</h2>
                        <p>${a.desc ? a.desc.slice(0, 100) + '...' : ''}</p>
                    </div>
                </a>
            `).join('');

            // Simple Auto-Slider logic
            if (!window._sliderInterval) {
                let currentIdx = 0;
                window._sliderInterval = setInterval(() => {
                    const slides = document.querySelectorAll('.portal-slide-item');
                    if (!slides.length) return;
                    slides[currentIdx].classList.remove('active');
                    currentIdx = (currentIdx + 1) % slides.length;
                    slides[currentIdx].classList.add('active');
                }, 5000);
            }
        }

        if (portalSide && articles.length > 5) {
            const sideArticles = articles.slice(5, 8);
            portalSide.innerHTML = sideArticles.map(a => `
                <a href="makale-detay.html?id=${a.id}" class="side-item">
                    <img src="${a.cover || a.image || ''}" class="side-item-img" alt="${a.title}">
                    <div class="side-item-content">
                        <div class="side-item-title">${a.title}</div>
                        <div class="side-item-meta">👁️ ${a.views || 0} okuma</div>
                    </div>
                </a>
            `).join('');
        }

        if (videoGrid) {
            // Filter articles that might have videos or just featured ones
            const videoArticles = articles.filter(a => a.category === 'oyun').slice(0, 3);
            videoGrid.innerHTML = videoArticles.map(a => `
                <div class="video-card">
                    <img src="${a.cover || a.image || ''}" alt="${a.title}">
                    <div class="video-play-btn">▶</div>
                    <div class="portal-slide-content" style="padding:1rem; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                        <div style="font-size:0.9rem; font-weight:700;">${a.title}</div>
                    </div>
                </div>
            `).join('');
        }

        // Featured Articles (Below Portal)
        const combinedFeed = [...articles].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8);
        const grid = document.getElementById('featuredArticles');

        if (grid) {
            if (combinedFeed.length === 0) {
                grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><h3>Henüz içerik yok</h3><p>Yeni içerikler yakında burada olacak.</p></div>';
            } else {
                const catMap = { teknoloji: 'badge-tech', oyun: 'badge-game', uygulama: 'badge-app' };
                const catLabel = { teknoloji: '💻 Teknoloji', oyun: '🎮 Oyun', uygulama: '📱 Uygulama' };
                
                grid.innerHTML = combinedFeed.map(item => {
                    const isProj = item.type === 'project';
                    const link = isProj ? `proje-izle.html?id=${item.id}` : `makale-detay.html?id=${item.id}`;
                    const badgeClass = catMap[item.category] || 'badge-tech';
                    const labelText = isProj ? `🚀 Proje: ${item.title}` : (catLabel[item.category] || item.category);
                    const imgSrc = item.cover || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"%3E%3Crect width="400" height="225" fill="%232a2a2a"/%3E%3C/svg%3E';

                    return `
                        <a href="${link}" class="card animate-fadeInUp" style="text-decoration:none; display:block; cursor:pointer; padding:0; overflow:hidden;">
                            <div style="height:160px; position:relative; background: #1a1a1a; overflow: hidden;">
                                <img src="${imgSrc}" alt="${item.title}" loading="lazy" style="width:100%; height:100%; object-fit:cover; display:block;">
                                <div class="card-badge ${badgeClass}" style="position:absolute; top:0.75rem; left:0.75rem;">${labelText}</div>
                            </div>
                            <div style="padding:1.25rem;">
                                <div class="card-title">${item.title}</div>
                                <div class="card-desc">${item.desc || ''}</div>
                                <div class="card-meta">
                                    <span>👤 ${item.author || 'Editor'}</span>
                                    <span>📅 ${item.date || ''}</span>
                                    <span>👁️ ${(item.views || 0).toLocaleString('tr-TR')}</span>
                                </div>
                                <div style="margin-top:0.75rem; font-size:0.82rem; color:var(--accent-blue); font-weight:600;"> Devamını oku →</div>
                            </div>
                        </a>
                    `;
                }).join('');
            }
        }

        // Forum
        const forumEl = document.getElementById('homeForumList');
        if (forumEl) {
            const topPosts = forumPosts.slice(0, 6);
            if (topPosts.length === 0) {
                forumEl.innerHTML = '<div class="empty-state"><h3>Henüz konu yok</h3></div>';
            } else {
                forumEl.innerHTML = topPosts.map(p => `
                    <a href="forum-detay.html?id=${p.id}" class="forum-topic" style="text-decoration:none; display:flex;">
                        <div class="forum-avatar">${p.authorInit || (p.author || '?')[0].toUpperCase()}</div>
                        <div class="forum-content">
                            <div class="forum-title">${p.title}</div>
                            <div class="forum-meta">@${p.author} · ${p.date}</div>
                        </div>
                    </a>
                `).join('');
            }
        }
    } catch (e) { console.error('[Home] Render error:', e); }
}

let renderTimer;
function debouncedRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderHome, 150);
}

// ---- ROBUST INITIALIZATION ----
// Handles all timing scenarios:
// 1. DB already initialized before this script ran
// 2. DB initializes after DOMContentLoaded
// 3. DB fires dbReady before DOMContentLoaded
function tryRender() {
    if (window.DB && window.DB._isInitialized) {
        debouncedRender();
    }
}

// If DOM is already ready and DB is up — render immediately
if (document.readyState !== 'loading') {
    tryRender();
} else {
    document.addEventListener('DOMContentLoaded', tryRender);
}

// dbReady fires when main.js finishes DB.init() (primary trigger)
document.addEventListener('dbReady', debouncedRender);

// dbUpdated fires on any data change (Firebase sync, admin edits, etc.)
document.addEventListener('dbUpdated', (e) => {
    const key = e.detail?.key;
    if (!key || ['articles', 'forum_posts', 'users', 'settings'].includes(key) || e.detail.all) {
        debouncedRender();
    }
});

// Fallback: if nothing triggered within 2 seconds, force render
// (handles edge cases where events are missed)
setTimeout(() => {
    if (window.DB) {
        if (!window.DB._isInitialized) {
            window.DB.init();
            window.DB._isInitialized = true;
        }
        renderHome();
    }
}, 2000);
