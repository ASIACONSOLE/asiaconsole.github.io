// ---- CONSTANTS & THEMES ----
const THEME_PRESETS = {
    cyberpunk: {
        '--bg-primary': '#050a1a',
        '--bg-secondary': '#0a102b',
        '--bg-card': 'rgba(10, 16, 43, 0.9)',
        '--bg-nav': 'rgba(10, 16, 43, 0.95)',
        '--accent-blue': '#00fff2',
        '--accent-purple': '#ff00c1',
        '--accent-cyan': '#00fff2',
        '--gradient-hero': 'linear-gradient(135deg, #050a1a 0%, #0a1128 50%, #1a0520 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(0, 255, 242, 0.1), rgba(255, 0, 193, 0.1))',
        '--text-primary': '#e6f1ff',
        '--radius': '0px',
        '--radius-lg': '0px',
        '--border-width': '2px',
        '--font-heading': "'Orbitron', sans-serif",
        '--shadow-card': '5px 5px 0px rgba(0, 255, 242, 0.2)'
    },
    matrix: {
        '--bg-primary': '#000000',
        '--bg-secondary': '#080808',
        '--bg-card': '#0d0d0d',
        '--bg-nav': 'rgba(0, 0, 0, 0.9)',
        '--accent-blue': '#00ff41',
        '--accent-purple': '#008f11',
        '--accent-cyan': '#00ff41',
        '--gradient-hero': 'linear-gradient(180deg, #000 0%, #0d0d0d 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(0, 255, 65, 0.05), rgba(0, 143, 17, 0.05))',
        '--text-primary': '#00ff41',
        '--radius': '0px',
        '--radius-lg': '0px',
        '--border-width': '1px',
        '--font-primary': "'Courier New', monospace",
        '--font-heading': "'Courier New', monospace",
        '--shadow-card': 'none'
    },
    space: {
        '--bg-primary': '#0b0e14',
        '--bg-secondary': '#14171d',
        '--bg-card': 'rgba(20, 23, 29, 0.7)',
        '--bg-nav': 'rgba(11, 14, 20, 0.9)',
        '--accent-blue': '#4f8ef7',
        '--accent-purple': '#a855f7',
        '--accent-cyan': '#06b6d4',
        '--gradient-hero': 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(168, 85, 247, 0.1))',
        '--text-primary': '#ffffff',
        '--radius': '12px',
        '--radius-lg': '20px',
        '--font-heading': "'Michroma', sans-serif",
        '--nav-blur': '30px'
    },
    code: {
        '--bg-primary': '#1e1e1e',
        '--bg-secondary': '#252526',
        '--bg-card': '#2d2d2d',
        '--bg-nav': 'rgba(30,30,30,0.95)',
        '--accent-blue': '#007acc',
        '--accent-purple': '#c586c0',
        '--accent-cyan': '#4ec9b0',
        '--gradient-hero': 'linear-gradient(135deg, #1e1e1e 0%, #252526 100%)',
        '--gradient-card': 'none',
        '--text-primary': '#d4d4d4',
        '--radius': '4px',
        '--radius-lg': '6px',
        '--font-primary': "'Consolas', 'Courier New', monospace"
    },
    aurora: {
        '--bg-primary': '#01161e',
        '--bg-secondary': '#124559',
        '--bg-card': 'rgba(255, 255, 255, 0.05)',
        '--bg-nav': 'rgba(1, 22, 30, 0.8)',
        '--accent-blue': '#598392',
        '--accent-purple': '#aec3b0',
        '--accent-cyan': '#eff6e0',
        '--gradient-hero': 'linear-gradient(135deg, #01161e 0%, #124559 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(89, 131, 146, 0.1), rgba(174, 195, 176, 0.1))',
        '--text-primary': '#eff6e0',
        '--radius': '30px',
        '--radius-lg': '60px',
        '--nav-blur': '40px'
    },
    volcano: {
        '--bg-primary': '#0f0f0f',
        '--bg-secondary': '#1a1a1a',
        '--bg-card': '#1a1a1a',
        '--bg-nav': 'rgba(15, 15, 15, 0.95)',
        '--accent-blue': '#ff4d00',
        '--accent-purple': '#ff8800',
        '--accent-cyan': '#ffaa00',
        '--gradient-hero': 'linear-gradient(135deg, #0f0f0f 0%, #1a1200 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 136, 0, 0.1))',
        '--text-primary': '#ffffff',
        '--radius': '6px',
        '--radius-lg': '10px',
        '--border-width': '2px',
        '--shadow-card': '0 10px 30px rgba(255, 77, 0, 0.1)'
    },
    titanium: {
        '--bg-primary': '#111111',
        '--bg-secondary': '#222222',
        '--bg-card': '#1a1a1a',
        '--bg-nav': 'rgba(17, 17, 17, 0.95)',
        '--accent-blue': '#ffffff',
        '--accent-purple': '#888888',
        '--accent-cyan': '#cccccc',
        '--gradient-hero': 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
        '--gradient-card': 'none',
        '--text-primary': '#ffffff',
        '--radius': '4px',
        '--radius-lg': '8px',
        '--border-width': '2px',
        '--shadow-card': '3px 3px 0px #333'
    },
    synthwave: {
        '--bg-primary': '#2b0035',
        '--bg-secondary': '#3f004b',
        '--bg-card': 'rgba(63, 0, 75, 0.6)',
        '--bg-nav': 'rgba(43, 0, 53, 0.9)',
        '--accent-blue': '#ff00ff',
        '--accent-purple': '#7a00ff',
        '--accent-cyan': '#00ffff',
        '--gradient-hero': 'linear-gradient(to bottom, #2b0035 0%, #11001a 100%)',
        '--gradient-card': 'linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(122, 0, 255, 0.1))',
        '--text-primary': '#ffffff',
        '--radius': '10px',
        '--radius-lg': '20px',
        '--font-heading': "'Press Start 2P', cursive",
        '--shadow-card': '0 0 20px rgba(255, 0, 255, 0.3)'
    },
    forest: {
        '--bg-primary': '#0a1a11',
        '--bg-secondary': '#0d2b1a',
        '--bg-card': '#0d2b1a',
        '--bg-nav': 'rgba(10, 26, 17, 0.95)',
        '--accent-blue': '#10b981',
        '--accent-purple': '#065f46',
        '--accent-cyan': '#34d399',
        '--gradient-hero': 'linear-gradient(135deg, #0a1a11 0%, #0d2b1a 100%)',
        '--gradient-card': 'none',
        '--text-primary': '#ecfdf5',
        '--radius': '20px',
        '--radius-lg': '40px'
    },
    cloud: {
        '--bg-primary': '#f8fafc',
        '--bg-secondary': '#ffffff',
        '--bg-card': '#ffffff',
        '--bg-nav': 'rgba(255, 255, 255, 0.9)',
        '--accent-blue': '#3b82f6',
        '--accent-purple': '#8b5cf6',
        '--accent-cyan': '#06b6d4',
        '--gradient-hero': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        '--gradient-card': 'none',
        '--text-primary': '#0f172a',
        '--text-secondary': '#64748b',
        '--border': '#e2e8f0',
        '--radius': '16px',
        '--radius-lg': '32px',
        '--shadow-card': '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        '--nav-blur': '10px'
    }
};

// ---- DAILY SNIPPETS DATA ----
const SNIPPETS = [
    {
        title: "C# Pattern Matching",
        desc: "C# 9.0 ve sonrasında gelen pattern matching ile kodunuzu daha okunabilir kılın.",
        code: "if (input is string { Length: > 5 } s)\n{\n    Console.WriteLine($\"Uzun metin: {s}\");\n}",
        category: "📂 C# / .NET",
        difficulty: "⚡ Orta"
    },
    {
        title: "JS Optional Chaining",
        desc: "Undefined veya null referans hatalarından kurtulmak için ?. operatörünü kullanın.",
        code: "const city = user?.address?.city || 'Bilinmiyor';\nconsole.log(city);",
        category: "📂 JavaScript",
        difficulty: "⚡ Kolay"
    },
    {
        title: "CSS Glassmorphism",
        desc: "Modern ve şık bir cam efekti için backdrop-filter kullanın.",
        code: ".glass {\n    background: rgba(255, 255, 255, 0.1);\n    backdrop-filter: blur(10px);\n    border: 1px solid rgba(255, 255, 255, 0.1);\n}",
        category: "📂 CSS / Tasarım",
        difficulty: "⚡ Kolay"
    },
    {
        title: "C# Records",
        desc: "Veri taşıyan sınıflar için immutable 'record' tipini kullanarak boiler-plate kodu azaltın.",
        code: "public record User(string Name, int Age);\n\nvar user1 = new User(\"Asia\", 5);\nvar user2 = user1 with { Name = \"Console\" };",
        category: "📂 C# / .NET",
        difficulty: "⚡ Orta"
    },
    {
        title: "JS Destructuring",
        desc: "Objelerden veri çekmeyi daha kısa ve temiz hale getirin.",
        code: "const person = { name: 'Ali', job: 'Dev' };\nconst { name, job } = person;\n\nconsole.log(`${name} is a ${job}`);",
        category: "📂 JavaScript",
        difficulty: "⚡ Kolay"
    }
];

function renderDailySnippet() {
    // Check if modal or elements exist
    if (!document.getElementById('snippetTitle')) return;

    // Calculate daily index based on date
    const now = new Date();
    const dayTimestamp = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const index = dayTimestamp % SNIPPETS.length;
    const snippet = SNIPPETS[index];

    // Format Date
    const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Inject to UI
    const elDate = document.getElementById('snippetDate');
    const elTitle = document.getElementById('snippetTitle');
    const elDesc = document.getElementById('snippetDesc');
    const elCode = document.getElementById('snippetCode');
    const elCat = document.getElementById('snippetCategory');
    const elDiff = document.getElementById('snippetDifficulty');

    if (elDate) elDate.innerText = dateStr;
    if (elTitle) elTitle.innerText = snippet.title;
    if (elDesc) elDesc.innerText = snippet.desc;
    if (elCode) elCode.innerText = snippet.code;
    if (elCat) elCat.innerText = snippet.category;
    if (elDiff) elDiff.innerText = snippet.difficulty;

    // Copy event listener
    const copyBtn = document.getElementById('copySnippetBtn');
    if (copyBtn) {
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(snippet.code).then(() => {
                const originalSvg = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span style="font-size:0.8rem">Kopyalandı! ✅</span>';
                setTimeout(() => { copyBtn.innerHTML = originalSvg; }, 2000);
            });
        };
    }
}

function openTipModal() {
    const modal = document.getElementById('dailyTipModal');
    if (modal) {
        modal.classList.add('is-active');
        renderDailySnippet();

        // Close on click outside card
        modal.onclick = (e) => {
            if (e.target === modal) closeTipModal();
        }
    }
}

function closeTipModal() {
    const modal = document.getElementById('dailyTipModal');
    if (modal) {
        modal.classList.remove('is-active');
    }
}

// ---- MEDIA STORAGE (IndexedDB for Large Assets) ----
const MediaDB = {
    dbName: 'AsiaConsoleMedia',
    storeName: 'media',
    _db: null,
    async init() {
        if (this._db) return this._db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject('IDB Error');
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => {
                this._db = e.target.result;
                resolve(this._db);
            };
        });
    },
    async set(key, value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(value, key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(false);
        });
    },
    async get(key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(null);
        });
    }
};

// ---- DATA MANAGEMENT ----
var DB = {
    _unwrapData(val) {
        let v = val;
        // 1. Traverse any deep { data: ... } wrappers (MAX 10 depth to prevent infinite loop)
        let depth = 0;
        while (v && typeof v === 'object' && !Array.isArray(v) && 'data' in v && v.data !== undefined && depth < 10) {
            v = v.data;
            depth++;
        }
        if (depth >= 10) console.warn('[DB] _unwrapData hit depth limit — possible circular reference');
        // 2. Recover Firebase sparse arrays (Objects where all keys are just numbers like '0', '1', '2')
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const keys = Object.keys(v);
            if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
                return Object.values(v).filter(item => item !== null && item !== undefined);
            }
        }
        return v;
    },
    get(key) {
        try {
            // 1. PRIORITIZE CACHE (IndexedDB) for specific large keys
            if (this._cache && this._cache[key] && (key === 'articles' || key === 'messages' || key === 'profiles' || key === 'bot_config')) {
                return this._unwrapData(this._cache[key]);
            }

            // 2. FALLBACK TO LOCAL STORAGE
            let local = JSON.parse(localStorage.getItem('tc_' + key));

            // 3. FINAL FALLBACK FOR OTHER CACHED KEYS
            let finalVal = local;
            if (!local && this._cache && this._cache[key]) {
                finalVal = this._cache[key];
            }

            return this._unwrapData(finalVal || null);
        } catch (e) { return null; }
    },
    // NEW: Background pre-load for large keys
    async preLoadLargeKeys() {
        const largeKeys = ['articles', 'messages', 'profiles', 'bot_config', 'scraped_urls', 'pending_articles', 'user_projects', 'project_reviews'];
        for (const key of largeKeys) {
            try {
                const val = await MediaDB.get(key);
                if (val) {
                    this._cache[key] = val;
                }
            } catch (e) { console.warn(`[DB] Pre-load failed for ${key}`); }
        }
        console.log('[DB] Large keys pre-loaded from IDB ✓');
        // Trigger UI update ONLY after DOM is ready to prevent race condition
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.dispatchEvent(new CustomEvent('dbUpdated', { detail: { all: true } }));
            }, { once: true });
        } else {
            document.dispatchEvent(new CustomEvent('dbUpdated', { detail: { all: true } }));
        }
    },
    // NEW: Async getter for large values
    async getAsync(key) {
        let local = this.get(key);
        if (local) return local;
        // Check MediaDB
        const idbVal = await MediaDB.get(key);
        if (idbVal) {
            this._cache = this._cache || {};
            this._cache[key] = idbVal;
            return idbVal;
        }
        return null;
    },
    _cache: {},
    set(key, val, syncToCloud = true) {
        // TRIPLE-GUARD: Ensure incoming 'val' is NOT already wrapped (MAX 10 depth)
        let cleanVal = val;
        let unwrapDepth = 0;
        while (cleanVal && typeof cleanVal === 'object' && 'data' in cleanVal && cleanVal.data !== undefined && unwrapDepth < 10) {
            cleanVal = cleanVal.data;
            unwrapDepth++;
        }

        // 1. Always update memory cache for instant sync access
        this._cache[key] = cleanVal;

        // 2. Prepare data for storage check
        const newVal = JSON.stringify(cleanVal);
        const oldVal = localStorage.getItem('tc_' + key);

        // Skip if data hasn't changed (save performance)
        if (oldVal === newVal) return;

        // 3. Size-based proactive offloading for known large keys
        if (key === 'articles' && newVal.length > 2000000) { // > 2MB
            console.warn(`[DB] ${key} size is large (${(newVal.length / 1024).toFixed(0)}KB), offloading to MediaDB...`);
            MediaDB.set(key, cleanVal);
            localStorage.removeItem('tc_' + key);
        } else {
            // Save to local for instant access if space permits
            try {
                localStorage.setItem('tc_' + key, newVal);
            } catch (e) {
                // Only log QuotaExceeded as a warning if we don't have a cache fallback
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    if (!this._cache[key]) {
                        console.warn(`[DB] LocalStorage full for ${key}, but no IDB fallback available yet!`);
                    }
                    // Fallback to MediaDB (IndexedDB) for large data
                    MediaDB.set(key, cleanVal);
                    localStorage.removeItem('tc_' + key);
                } else {
                    console.error(`[DB] Storage error for ${key}:`, e);
                }
            }
        }

        // Dispatch local event for instant UI update
        document.dispatchEvent(new CustomEvent('dbUpdated', { detail: { key, data: cleanVal } }));

        // Sync to Firebase Cloud if initialized AND requested (with DEBOUNCE to save quota)
        if (syncToCloud && typeof FirebaseDB !== 'undefined') {
            // GUARD: Never sync seed/default articles to cloud (IDs 1-8 only)
            if (key === 'articles' && Array.isArray(cleanVal) && cleanVal.length <= 8) {
                const isDefaultSeed = cleanVal.every(a => typeof a.id === 'number' && a.id >= 1 && a.id <= 8);
                if (isDefaultSeed) {
                    console.log('[Firebase] Skipping cloud sync — detected default seed articles.');
                    return;
                }
            }

            this._cloudSyncTimers = this._cloudSyncTimers || {};
            clearTimeout(this._cloudSyncTimers[key]);
            
            this._cloudSyncTimers[key] = setTimeout(() => {
                FirebaseDB.onReady(() => {
                try {
                    // Final POJO cleaning
                    const finalData = JSON.parse(JSON.stringify(cleanVal));
                    const jsonStr = JSON.stringify(finalData);
                    const size = new Blob([jsonStr]).size;

                    // CHUNKED STORAGE: If articles exceed 500KB, split into chunks
                    if (key === 'articles' && Array.isArray(finalData) && size > 500000) {
                        const CHUNK_SIZE = 500000; // 500KB per chunk (safely under 1MB)
                        const chunks = [];
                        let currentChunk = [];
                        let currentSize = 0;

                        for (const article of finalData) {
                            const articleSize = new Blob([JSON.stringify(article)]).size;
                            if (currentSize + articleSize > CHUNK_SIZE && currentChunk.length > 0) {
                                chunks.push(currentChunk);
                                currentChunk = [];
                                currentSize = 0;
                            }
                            currentChunk.push(article);
                            currentSize += articleSize;
                        }
                        if (currentChunk.length > 0) chunks.push(currentChunk);

                        // Write chunk metadata
                        FirebaseDB.set('site_data', 'articles', {
                            data: '__CHUNKED__',
                            chunkCount: chunks.length,
                            totalArticles: finalData.length,
                            lastSync: Date.now()
                        });

                        // Write each chunk as separate document
                        chunks.forEach((chunk, i) => {
                            FirebaseDB.set('site_data', `articles_chunk_${i}`, { data: chunk, lastSync: Date.now() });
                        });

                        // Clean up old chunks beyond current count
                        for (let i = chunks.length; i < 20; i++) {
                            FirebaseDB.delete('site_data', `articles_chunk_${i}`);
                        }

                        console.log(`[Firebase] Articles synced in ${chunks.length} chunks (${(size / 1024).toFixed(0)}KB total) ✓`);
                        if (DB._cloudStaleKeys) DB._cloudStaleKeys.delete(key);
                        return;
                    }

                    // Enhanced: Prevent syncing excessively large data (>1MB per document limit)
                    if (size > 1000000) {
                        console.error(`[Firebase] Data size too large for ${key}: ${(size / 1024 / 1024).toFixed(2)}MB (Limit: 1MB)`);
                        if (typeof showAdminToast === 'function') showAdminToast(`⚠️ ${key} verisi çok büyük! (1MB limit)`, 'error');
                        DB._cloudStaleKeys = DB._cloudStaleKeys || new Set();
                        DB._cloudStaleKeys.add(key);
                        return;
                    }
                    if (DB._cloudStaleKeys) DB._cloudStaleKeys.delete(key);

                    FirebaseDB.set('site_data', key, { data: finalData, lastSync: Date.now() })
                        .then(ok => {
                            if (ok) console.log(`[Firebase] ${key} synced successfully ✓`);
                            else console.warn(`[Firebase] ${key} sync failed.`);
                        });
                } catch (e) {
                    console.error('[Firebase] Serialization failed for ' + key, e);
                }
            });
        }
    },
    // NEW: Sync all local data to cloud (Force Sync)
    async syncToCloud() {
        if (typeof FirebaseDB === 'undefined' || !FirebaseDB._ready) return;
        const keys = [
            'settings', 'articles', 'users', 'forum_posts', 'user_projects',
            'user_tiers', 'profiles', 'custom_pages', 'article_comments',
            'site_logo_base64', 'bot_config', 'scraped_urls', 'messages',
            'pending_articles', 'bot_queue', 'bot_drafts'
        ];
        for (const key of keys) {
            const val = this.get(key);
            if (val) await FirebaseDB.set('site_data', key, { data: val });
        }
        console.log('[Firebase] All data synced to cloud ✓');
    },
    // NEW: Load from cloud to local (with chunked article support)
    async loadFromCloud() {
        if (typeof FirebaseDB === 'undefined' || !FirebaseDB._ready) return;
        const keys = [
            'settings', 'articles', 'users', 'forum_posts', 'user_projects',
            'user_tiers', 'profiles', 'custom_pages', 'article_comments',
            'site_logo_base64', 'bot_config', 'scraped_urls', 'messages',
            'pending_articles', 'bot_queue', 'bot_drafts'
        ];
        for (const key of keys) {
            const remote = await FirebaseDB.get('site_data', key);
            if (remote && remote.data) {
                // Handle chunked articles
                if (key === 'articles' && remote.data === '__CHUNKED__' && remote.chunkCount) {
                    let allArticles = [];
                    for (let i = 0; i < remote.chunkCount; i++) {
                        const chunk = await FirebaseDB.get('site_data', `articles_chunk_${i}`);
                        if (chunk && Array.isArray(chunk.data)) {
                            allArticles = allArticles.concat(chunk.data);
                        }
                    }
                    DB.set('articles', allArticles, false);
                    console.log(`[Firebase] Loaded ${allArticles.length} articles from ${remote.chunkCount} chunks`);
                } else {
                    DB.set(key, remote.data, false);
                }
            }
        }
    },
    init() {
        // Default settings
        const defaultSettings = {
            siteName: 'AsiaConsole',
            siteSlogan: 'Teknoloji, Oyun ve Uygulama Dünyasına Kapınız',
            accentColor: '#00fff2',
            footerText: '© 2025 AsiaConsole. Tüm hakları saklıdır.',
            activeTheme: 'cyberpunk',
            socialTwitter: '#',
            socialGithub: '#',
            socialYoutube: '#',
            socialDiscord: '#',
            aiEnabled: true,
            aiName: 'Editor',
            aiGreeting: 'Merhaba! Ben Editör, size nasıl yardımcı olabilirim?',
            geminiApiKey: '',
            groqApiKey: '',
            openrouterApiKey: '',
            siteFont: "'Inter', sans-serif",
            brandAnim: 'none',
            brandAnimSpeed: 2.0,
            navbarStyle: 'blur',
            logoSize: 36,
            siteNameSize: 1.4,
            heroHeight: 100,
            heroBgOpacity: 0.3,
            heroTitleSize: 5.5,
            googleClientId: '367594063152-0kagipiibbmh7t8ti3c8chjufe335l0j.apps.googleusercontent.com'
        };
        const currentSettings = this.get('settings') || {};
        // If current key is empty but default has a key, use the default
        if (!currentSettings.geminiApiKey && defaultSettings.geminiApiKey) {
            currentSettings.geminiApiKey = defaultSettings.geminiApiKey;
        }
        if (!currentSettings.groqApiKey && defaultSettings.groqApiKey) {
            currentSettings.groqApiKey = defaultSettings.groqApiKey;
        }
        if (!currentSettings.openrouterApiKey && defaultSettings.openrouterApiKey) {
            currentSettings.openrouterApiKey = defaultSettings.openrouterApiKey;
        }
        if (!currentSettings.googleClientId && defaultSettings.googleClientId) {
            currentSettings.googleClientId = defaultSettings.googleClientId;
        }
        this.set('settings', { ...defaultSettings, ...currentSettings }, false);

        // --- SEED PROTECTION ---
        // Only seed defaults if NOT in cache (IndexedDB) AND NOT in localStorage
        const hasArticles = this.get('articles');
        if (!hasArticles) {
            console.log('[DB] Seeding default articles...');
            this.set('articles', [
                { id: 1, title: 'Yapay Zeka 2025: Geleceğin Teknolojileri', category: 'teknoloji', desc: 'ChatGPT, Gemini ve yeni nesil AI araçlarının iş dünyasını nasıl değiştireceğini keşfediyoruz.', author: 'Editör', date: '24 Şub 2025', views: 1240, image: '🤖', featured: true },
                { id: 2, title: 'GTA VI Çıkış Tarihi Açıklandı!', category: 'oyun', desc: 'Rockstar Games\'in uzun süredir beklenen GTA VI oyununun resmi çıkış tarihi ve yeni detayları paylaşıldı.', author: 'Editör', date: '23 Şub 2025', views: 5620, image: '🎮', featured: true },
                { id: 3, title: 'Flutter 4.0 ile Mobil Uygulama Geliştirme', category: 'uygulama', desc: 'Flutter\'ın yeni sürümüyle tek kod tabanından iOS ve Android uygulamaları nasıl oluşturulur?', author: 'Editör', date: '22 Şub 2025', views: 890, image: '📱', featured: false },
                { id: 4, title: 'Kuantum Bilgisayarlar Artık Gerçek', category: 'teknoloji', desc: 'IBM ve Google\'ın kuantum bilgisayar yarışı hız kazanıyor. Günlük hayatımızı nasıl etkileyecek?', author: 'Editör', date: '21 Şub 2025', views: 2100, image: '⚡', featured: false },
                { id: 5, title: 'Baldur\'s Gate 3 GOTY Ödülü Aldı', category: 'oyun', desc: 'Larian Studios\'un masterpiece oyunu bu yılın en iyi oyunu ödülünü kazandı. İnceleme ve detaylar.', author: 'Editör', date: '20 Şub 2025', views: 3400, image: '🏆', featured: false },
                { id: 6, title: 'React Native vs Flutter 2025 Karşılaştırması', category: 'uygulama', desc: 'Hangi framework daha iyi? Performans, ekosistem ve geliştirici deneyimi açısından kapsamlı karşılaştırma.', author: 'Editör', date: '19 Şub 2025', views: 1560, image: '⚖️', featured: false },
                { id: 7, title: 'Cyberpunk 2077 Phantom Liberty Genişlemesi', category: 'oyun', desc: 'CD Projekt RED\'in beklenen genişleme paketi incelemesi. Yeni hikaye, karakterler ve Night City.', author: 'Editör', date: '18 Şub 2025', views: 2890, image: '🌆', featured: false },
                { id: 8, title: 'Apple Vision Pro Kullanıcı Deneyimi', category: 'teknoloji', desc: 'Spatial computing çağını başlatan Vision Pro ile bir ay geçirdikten sonra gerçek düşüncelerimiz.', author: 'Editör', date: '17 Şub 2025', views: 4200, image: '👓', featured: false },
            ], false);
        }

        if (!this.get('forum_posts')) this.set('forum_posts', [], false);

        if (!this.get('users')) {
            this.set('users', [
                { id: 1, username: 'CodeMaster', email: 'codemaster@asiaconsole.com', password: '123456', joined: '01 Oca 2025', posts: 47, active: true },
                { id: 2, username: 'GamerPro', email: 'gamerpro@asiaconsole.com', password: '123456', joined: '15 Oca 2025', posts: 31, active: true },
                { id: 3, username: 'AppDev', email: 'appdev@asiaconsole.com', password: '123456', joined: '10 Şub 2025', posts: 12, active: true },
                { id: 4, username: 'ASIA', email: 'admin@asiaconsole.com', password: '160515apO.008', joined: '01 Oca 2024', active: true, role: 'admin' },
                { id: 5, username: 'GameEditor', email: 'editor@asiaconsole.com', password: '123456', joined: '05 Oca 2025', active: true },
                { id: 6, username: 'DevTeam', email: 'dev@asiaconsole.com', password: '123456', joined: '12 Oca 2025', active: true },
                { id: 7, username: 'TechWriter', email: 'writer@asiaconsole.com', password: '123456', joined: '20 Oca 2025', active: true },
                { id: 8, username: 'TechFan', email: 'fan@asiaconsole.com', password: '123456', joined: '22 Oca 2025', active: true },
                { id: 9, username: 'DevGuru', email: 'guru@asiaconsole.com', password: '123456', joined: '25 Oca 2025', active: true },
                { id: 10, username: 'SteamUser', email: 'steam@asiaconsole.com', password: '123456', joined: '30 Oca 2025', active: true }
            ], false);
        } else {
            // MIGRATION: Ensure Admin credentials are updated to the new ASIA / 160515apO.008
            let users = this.get('users');
            let admin = users.find(u => u.role === 'admin' || u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'asia');
            if (admin) {
                if (admin.username !== 'ASIA' || admin.password !== '160515apO.008') {
                    admin.username = 'ASIA';
                    admin.password = '160515apO.008';
                    this.set('users', users, true); // Sync migration to cloud
                    console.log('[Migration] Admin account updated to ASIA / new password ✓');
                }
            }
        }

        if (!this.get('user_projects')) this.set('user_projects', [], false);
        // Default project reviews init
        if (!this.get('project_reviews')) {
            this.set('project_reviews', [], false);
        }
        // Default membership tiers
        if (!this.get('user_tiers')) {
            this.set('user_tiers', {
                standart: { name: 'Standart', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.05)', icon: '👤', perks: ['Sınırsız proje izleme', 'Topluluk forumu erişimi', 'Haftalık haber bülteni'] },
                pro: { name: 'Pro Member', color: 'var(--accent-blue)', bg: 'rgba(79,142,247,0.1)', icon: '🛡️', perks: ['Tüm Standart özellikler', 'Proje yükleme sınırı: 10', 'Özel rozet', 'Reklamsız deneyim'] },
                vip: { name: 'VIP Elite', color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.1)', icon: '💎', perks: ['Tüm Pro özellikler', 'Sınırsız proje yükleme', 'Öncelikli onay', 'VIP forum bölümü', 'Doğrudan destek'] }
            }, false);
        }

        // --- DATA MIGRATION: Update old author names to "Editör" ---
        let currentArticles = this.get('articles');
        if (Array.isArray(currentArticles)) {
            let changed = false;
            currentArticles.forEach(a => {
                const oldAuthors = ['Admin', 'asiadmin', 'asiabot', 'AsiaBot', 'GameEditor', 'DevTeam', 'TechWriter'];
                if (oldAuthors.some(old => a.author && a.author.includes(old))) {
                    a.author = 'Editor';
                    changed = true;
                }
            });
            if (changed) {
                console.log('[Migration] Article authors updated to Editör ✓');
                this.set('articles', currentArticles, false); // NEVER sync migration to cloud
            }
        }
    }
};

// ---- SETTINGS ----
function applySettings() {
    try {
    const s = DB.get('settings');
    if (!s) return;
    document.querySelectorAll('.site-name').forEach(el => el.textContent = s.siteName);
    document.querySelectorAll('.site-slogan').forEach(el => el.textContent = s.siteSlogan);
    document.querySelectorAll('.footer-text').forEach(el => el.textContent = s.footerText || ('© 2025 ' + (s.siteName || 'AsiaConsole') + '. Tüm hakları saklıdır.'));
    document.querySelectorAll('.social-twitter').forEach(el => { el.href = s.socialTwitter || '#'; });
    document.querySelectorAll('.social-github').forEach(el => { el.href = s.socialGithub || '#'; });
    document.querySelectorAll('.social-youtube').forEach(el => { el.href = s.socialYoutube || '#'; });
    document.querySelectorAll('.social-discord').forEach(el => { el.href = s.socialDiscord || '#'; });
    // Theme application
    if (s.activeTheme && s.activeTheme !== 'custom' && THEME_PRESETS[s.activeTheme]) {
        // Reset structural defaults first
        const defaults = {
            '--radius': '12px', '--radius-lg': '20px', '--border-width': '1px',
            '--font-primary': "'Inter', sans-serif", '--font-heading': "'Inter', sans-serif",
            '--shadow-card': '0 4px 24px rgba(0, 0, 0, 0.4)', '--nav-blur': '20px'
        };
        for (const [p, v] of Object.entries(defaults)) document.documentElement.style.setProperty(p, v);

        const theme = THEME_PRESETS[s.activeTheme];
        for (const [prop, val] of Object.entries(theme)) {
            document.documentElement.style.setProperty(prop, val);
        }
    } else if (s.accentColor) {
        document.documentElement.style.setProperty('--accent-blue', s.accentColor);
    }
    // Font size & typography
    if (s.baseFontSize) document.documentElement.style.setProperty('--base-font-size', s.baseFontSize);
    if (s.lineHeight) document.documentElement.style.setProperty('--line-height', s.lineHeight);
    if (s.headingScale) document.documentElement.style.setProperty('--heading-scale', s.headingScale);
    if (s.fontFamily) document.body.style.fontFamily = s.fontFamily;
    // Announcement ticker
    if (s.tickerEnabled && s.tickerText && !document.getElementById('announcementTicker')) {
        const messages = s.tickerText.split('|').map(m => m.trim()).filter(Boolean);
        const speeds = { slow: 40, normal: 28, fast: 18 };
        const speed = speeds[s.tickerSpeed || 'normal'];
        const ticker = document.createElement('div');
        ticker.id = 'announcementTicker';
        ticker.style.cssText = `background:${s.tickerBg || '#4f8ef7'}; color:${s.tickerColor || '#fff'}; padding:7px 0; font-size:0.84rem; font-weight:600; overflow:hidden; white-space:nowrap; position:relative; z-index:999;`;
        const inner = document.createElement('div');
        inner.style.cssText = `display:inline-block; animation:tickerScroll ${speed}s linear infinite; will-change: transform;`;
        const fullText = messages.join('  •  ') + '  •  ' + messages.join('  •  ');
        inner.textContent = fullText;
        ticker.appendChild(inner);
        if (!document.getElementById('tickerKeyframes')) {
            const style = document.createElement('style');
            style.id = 'tickerKeyframes';
            style.textContent = '@keyframes tickerScroll { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }';
            document.head.appendChild(style);
        }
        document.body.insertBefore(ticker, document.body.firstChild);
    }
    // Banner customization
    const hero = document.querySelector('.hero');
    if (hero) {
        if (s.bannerEnabled === false) {
            hero.style.display = 'none';
        } else {
            hero.style.display = 'flex';
            const bannerH1 = hero.querySelector('h1');
            if (bannerH1 && s.bannerTitle) {
                // SECURITY: Allow only <br> for newline, escape everything else
                const safeTitle = Comments.escapeHTML(s.bannerTitle).replace(/&lt;br&gt;/g, '<br>').replace(/\n/g, '<br>');
                bannerH1.innerHTML = safeTitle;
            }
            const bannerSub = document.querySelector('.site-slogan');
            if (bannerSub && s.bannerSubtitle) bannerSub.textContent = s.bannerSubtitle;
            const btn1 = hero.querySelector('.btn-primary');
            if (btn1 && s.bannerBtn1) btn1.textContent = s.bannerBtn1;
            const btn2 = hero.querySelector('.btn-secondary');
            if (btn2 && s.bannerBtn2) btn2.textContent = s.bannerBtn2;
        }
    }

    // Hero Background Opacity
    if (hero) {
        const opacity = s.heroBgOpacity !== undefined ? s.heroBgOpacity : 0.3;
        document.documentElement.style.setProperty('--hero-bg-opacity', opacity);
    }
    // Site logo (Priority: URL > Firebase Base64 > Local MediaDB)
    const applyLogo = (src) => {
        document.querySelectorAll('.brand-icon').forEach(el => {
            const sz = s.logoSize ? s.logoSize + 'px' : '36px';
            el.style.width = sz;
            el.style.height = sz;
            if (src) {
                // SECURITY: Sanitize src to avoid XSS in img tag
                const safeSrc = Comments.escapeHTML(src);
                el.innerHTML = `<img src="${safeSrc}" alt="Logo" style="width:100%; height:100%; object-fit:contain; border-radius:4px;">`;
            }
        });
    };

    if (s.logoUrl) {
        applyLogo(s.logoUrl);
    } else {
        // Try getting the globally synced Base64 logo first
        const syncedLogo = DB.get('site_logo_base64');
        if (syncedLogo) {
            applyLogo(syncedLogo);
            // Also cache it locally to MediaDB just in case
            MediaDB.set('site_logo', syncedLogo).catch(() => { });
        } else {
            // Fallback to purely local MediaDB or legacy
            MediaDB.get('site_logo').then(src => {
                if (src) applyLogo(src);
                else applyLogo(DB.get('site_logo'));
            });
        }
    }
    // Site name font size + Font Family + Animation
    document.querySelectorAll('.navbar-brand').forEach(el => {
        if (s.siteNameSize) el.style.fontSize = parseFloat(s.siteNameSize) + 'rem';
        if (s.siteFont) {
            el.style.fontFamily = s.siteFont;
            // Add Google Font if not loaded (basic check)
            const fontName = s.siteFont.split(',')[0].replace(/['"]/g, '');
            if (fontName !== 'Inter' && !document.getElementById('font-' + fontName)) {
                const link = document.createElement('link');
                link.id = 'font-' + fontName;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@700;800;900&display=swap`;
                document.head.appendChild(link);
            }
        }
        // Brand Animation (Isolate to .site-name)
        const nameEl = el.querySelector('.site-name');
        if (nameEl) {
            // Remove old anim classes but keep site-name
            nameEl.className = 'site-name';
            if (s.brandAnim && s.brandAnim !== 'none') {
                nameEl.classList.add('anim-' + s.brandAnim);
                if (s.brandAnimSpeed) {
                    nameEl.style.animationDuration = s.brandAnimSpeed + 's';
                }
            } else {
                nameEl.style.animationDuration = '';
            }
        }
    });

    // Navbar Style
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (s.navbarStyle === 'solid') {
            navbar.style.background = '#0d1117';
            navbar.style.backdropFilter = 'none';
            navbar.style.webkitBackdropFilter = 'none';
        } else if (s.navbarStyle === 'trans') {
            navbar.style.background = 'transparent';
            navbar.style.backdropFilter = 'none';
            navbar.style.webkitBackdropFilter = 'none';
        } else {
            navbar.style.background = 'rgba(13, 17, 23, 0.85)';
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.webkitBackdropFilter = 'blur(20px)';
        }
    }

    // Hero height & Background
    if (hero) {
        if (s.heroHeight) {
            hero.style.minHeight = s.heroHeight + 'vh';
            // Hide visual grid if hero is too small
            const visual = document.querySelector('.hero-visual');
            if (visual) {
                visual.style.display = (parseInt(s.heroHeight) < 40) ? 'none' : 'grid';
            }
        }

        // Fetch background (Priority: URL > Local MediaDB > Legacy)
        const applyBg = (src) => {
            if (src) {
                hero.style.backgroundImage = `url('${src}')`;
                hero.classList.add('has-bg');
            } else {
                hero.style.backgroundImage = 'none';
                hero.classList.remove('has-bg');
            }
        };

        if (s.heroBgUrl) {
            applyBg(s.heroBgUrl);
        } else {
            MediaDB.get('heroBg').then(bg => {
                if (bg) applyBg(bg);
                else applyBg(s.heroBg);
            });
        }
    }
    // Home Hero title size (Only for index.html hero)
    if (s.heroTitleSize) {
        const homeH1 = document.querySelector('.hero h1');
        if (homeH1) homeH1.style.fontSize = s.heroTitleSize + 'rem';
    }

    // Navbar Animation Style
    const navEl = document.querySelector('.navbar');
    const mobileNavEl = document.getElementById('mobileNav');
    if (navEl) {
        // Remove all nav-style-* classes first
        navEl.className = navEl.className.split(' ').filter(c => !c.startsWith('nav-style-')).join(' ');
        const animStyle = s.navbarAnimStyle || 'neon'; // Default to neon
        navEl.classList.add('nav-style-' + animStyle);

        if (mobileNavEl) {
            mobileNavEl.className = mobileNavEl.className.split(' ').filter(c => !c.startsWith('nav-style-')).join(' ');
            mobileNavEl.classList.add('nav-style-' + animStyle);
        }
    }

    // --- Dynamic Category Hero Processing ---
    const path = window.location.pathname.toLowerCase();
    const heroIcon = document.querySelector('.page-hero-icon');
    const heroH1 = document.querySelector('.page-hero h1');
    const heroP = document.querySelector('.page-hero p');

    if (path.includes('teknoloji.html')) {
        if (heroIcon) heroIcon.textContent = s.iconTeknoloji || '💻';
        if (heroH1 && s.titleTeknoloji) heroH1.textContent = s.titleTeknoloji;
        if (heroP && s.subTeknoloji) heroP.textContent = s.subTeknoloji;
    } else if (path.includes('oyun.html')) {
        if (heroIcon) heroIcon.textContent = s.iconOyun || '🎮';
        if (heroH1 && s.titleOyun) heroH1.textContent = s.titleOyun;
        if (heroP && s.subOyun) heroP.textContent = s.subOyun;
    } else if (path.includes('uygulama.html')) {
        if (heroIcon) heroIcon.textContent = s.iconUygulama || '📱';
        if (heroH1 && s.titleUygulama) heroH1.textContent = s.titleUygulama;
        if (heroP && s.subUygulama) heroP.textContent = s.subUygulama;
    }

    // Apply category icons to cards globally (if they exist)
    document.querySelectorAll('.card-badge, .card i').forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('teknoloji')) el.innerHTML = `${s.iconTeknoloji || '💻'} Teknoloji`;
        if (text.includes('oyun')) el.innerHTML = `${s.iconOyun || '🎮'} Oyun`;
        if (text.includes('uygulama')) el.innerHTML = `${s.iconUygulama || '📱'} Uygulama`;
    });
    } catch (e) { console.error('[applySettings] Error:', e); }
}

// ---- DYNAMIC NAVBAR ITEMS ----
function renderDynamicNav() {
    const customPages = DB.get('custom_pages') || [];
    const navItems = customPages.filter(p => p.inNavbar);
    if (!navItems.length) return;

    const desktopNav = document.querySelector('.navbar-nav');
    const mobileNav = document.querySelector('.mobile-nav');

    navItems.forEach(page => {
        const url = `sayfa.html?slug=${page.slug}`;

        // Add to desktop
        if (desktopNav) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${url}">${page.title}</a>`;
            desktopNav.appendChild(li);
        }

        // Add to mobile
        if (mobileNav) {
            const a = document.createElement('a');
            a.href = url;
            a.textContent = page.title;
            mobileNav.appendChild(a);
        }
    });
}

// ---- HERO PROJECTS SHOWCASE ----
function renderHeroProjects() {
    try {
    const grid = document.getElementById('heroProjectGrid');
    if (!grid) return;

    const allProjects = DB.get('user_projects');
    if (!Array.isArray(allProjects)) {
        console.warn('[UI] user_projects is not an array, skipping hero render');
        _renderHeroPlaceholders(grid);
        return;
    }

    const approved = allProjects.filter(p => p && (p.status === 'approved' || !p.status));
    const latest = approved.sort((a, b) => {
        const idA = String(a.id || 0);
        const idB = String(b.id || 0);
        return idB.localeCompare(idA, undefined, { numeric: true, sensitivity: 'base' });
    }).slice(0, 4);

    if (latest.length === 0) {
        _renderHeroPlaceholders(grid);
        return;
    }

    grid.innerHTML = latest.map((p, idx) => `
        <a href="proje-izle.html?id=${p.id}" class="hero-card-mini animate-stagger" style="--delay: ${idx * 0.1}s">
            <div class="mini-icon">${p.icon || '🚀'}</div>
            <div class="mini-title">${Comments.escapeHTML(p.title || 'İsimsiz Proje')}</div>
            <div class="mini-tag">${p.category || 'PROJE'}</div>
        </a>
    `).join('');
}

function _renderHeroPlaceholders(grid) {
    if (!grid) return;
    grid.innerHTML = `
        <div class="hero-card-mini"><div class="mini-icon">💻</div><div class="mini-title">Haberler</div></div>
        <div class="hero-card-mini"><div class="mini-icon">🎮</div><div class="mini-title">Oyunlar</div></div>
        <div class="hero-card-mini"><div class="mini-icon">📱</div><div class="mini-title">Uygulama</div></div>
        <div class="hero-card-mini"><div class="mini-icon">💬</div><div class="mini-title">Forum</div></div>
    `;
    } catch (e) { console.error('[renderHeroProjects] Error:', e); }
}

// Refresh hero projects only on data updates
document.addEventListener('dbUpdated', (e) => {
    if (e.detail.key === 'user_projects') {
        renderHeroProjects();
    }
});

// ---- NAVBAR ACTIVE STATE ----
function setNavActive() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav a, .mobile-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === path || (path === 'index.html' && href === 'index.html') || (path === '' && href === 'index.html')) {
            a.classList.add('active');
        }
    });
}

// ---- HAMBURGER MENU ----
function initHamburger() {
    const btn = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('mobileNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
        nav.classList.toggle('open');
    });
    document.addEventListener('click', e => {
        if (!btn.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove('open');
        }
    });
}

// ---- AUTH ----
const Auth = {
    currentUser() { return DB.get('user_session'); },
    login(emailOrUser, password) {
        const users = DB.get('users') || [];
        const loginInput = String(emailOrUser || '').toLowerCase();
        const user = users.find(u =>
            (String(u.email || '').toLowerCase() === loginInput ||
                String(u.username || '').toLowerCase() === loginInput) &&
            u.password === password &&
            u.active
        );
        if (user) {
            DB.set('user_session', { id: user.id, username: user.username, email: user.email });
            // Trigger cloud load to get synced data on new device
            DB.loadFromCloud().then(() => {
                console.log('[Auth] Cloud data restored after login');
            });
            return true;
        }
        return false;
    },
    register(username, email, password) {
        const users = DB.get('users') || [];
        if (users.find(u => u.email === email)) return { ok: false, msg: 'Bu e-posta zaten kayıtlı.' };
        if (users.find(u => u.username === username)) return { ok: false, msg: 'Bu kullanıcı adı alınmış.' };
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            joined: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
            posts: 0,
            active: true,
            accountType: 'standart'
        };
        users.push(newUser);
        DB.set('users', users);
        DB.set('user_session', { id: newUser.id, username, email });
        // Initial cloud sync setup
        DB.loadFromCloud();
        return { ok: true };
    },
    logout() {
        localStorage.removeItem('tc_user_session');
        if (typeof GoogleAuth !== 'undefined' && GoogleAuth.signOut) {
            GoogleAuth.signOut();
        }
    }
};

// ---- TOAST ----
function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ---- SCROLL ANIMATIONS ----
function initScrollAnimations() {
    // Add global styles for scroll animations once if they don't exist
    if (!document.getElementById('scrollAnimStyles')) {
        const style = document.createElement('style');
        style.id = 'scrollAnimStyles';
        style.textContent = `
            .scroll-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
            .scroll-reveal.visible { opacity: 1; transform: translateY(0); }
        `;
        document.head.appendChild(style);
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Performance: stop observing once revealed
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .forum-topic, .dash-stat').forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}

// ---- NAVBAR USER STATE ----
function updateNavAuth() {
    const user = Auth.currentUser();
    const loginBtn = document.getElementById('navLoginBtn');
    const registerBtn = document.getElementById('navRegisterBtn');
    const userMenuEl = document.getElementById('navUserMenu');
    const navUsernameEl = document.getElementById('navUsername');
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenuEl) userMenuEl.style.display = 'flex';
        if (navUsernameEl) {
            // Make username a clickable profile link
            navUsernameEl.innerHTML = `<a href="profil.html?user=${encodeURIComponent(user.username)}"
                style="color:var(--text-secondary); text-decoration:none; font-weight:600; transition:color 0.2s;"
                onmouseover="this.style.color='var(--accent-blue)'"
                onmouseout="this.style.color='var(--text-secondary)'"
            >${user.username}</a>`;
        }
        // Add message icon with unread badge (after navUsername span)
        let msgIcon = document.getElementById('navMsgIconGlobal');
        if (!msgIcon && userMenuEl) {
            msgIcon = document.createElement('a');
            msgIcon.id = 'navMsgIconGlobal';
            msgIcon.href = 'mesajlar.html';
            msgIcon.className = 'nav-msg-badge';
            msgIcon.title = 'Mesajlarım';
            msgIcon.style.cssText = 'font-size:1.15rem; text-decoration:none; padding:0.1rem 0.3rem;';
            msgIcon.innerHTML = '💬 <span id="navMsgBadgeGlobal" class="badge-dot" style="display:none;"></span>';
            userMenuEl.appendChild(msgIcon);
        }
        // navPanelBtnGlobal removed (integrated into profile)

        // Add logout button
        let logoutBtn = document.getElementById('navLogoutBtnGlobal');
        if (!logoutBtn && userMenuEl) {
            logoutBtn = document.createElement('button');
            logoutBtn.id = 'navLogoutBtnGlobal';
            logoutBtn.className = 'btn-nav-logout';
            logoutBtn.innerHTML = '🚪 Çıkış Yap';
            logoutBtn.style.cssText = 'font-size:0.75rem; padding:0.25rem 0.5rem; background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:6px; cursor:pointer; margin-left:0.5rem; transition:all 0.2s;';
            logoutBtn.onmouseover = () => { logoutBtn.style.background = 'rgba(239,68,68,0.2)'; };
            logoutBtn.onmouseout = () => { logoutBtn.style.background = 'rgba(239,68,68,0.1)'; };
            logoutBtn.onclick = () => { Auth.logout(); window.location.reload(); };
            userMenuEl.appendChild(logoutBtn);
        }
        // Show unread count
        const unread = Messaging.unreadCount(user.username);
        const badgeEl = document.getElementById('navMsgBadgeGlobal');
        if (badgeEl) {
            if (unread > 0) { badgeEl.textContent = unread > 9 ? '9+' : unread; badgeEl.style.display = 'flex'; }
            else badgeEl.style.display = 'none';
        }
    }
}

// ---- PROJECT REVIEWS ----
const ProjectReviews = {
    getAll() { return DB.get('project_reviews') || []; },
    getByProject(projectId) {
        const all = this.getAll();
        return all.filter(r => r.projectId === projectId).sort((a, b) => b.id - a.id);
    },
    add(projectId, username, rating, comment) {
        const all = this.getAll();
        const newReview = {
            id: Date.now(),
            projectId,
            username,
            rating,
            comment,
            date: new Date().toLocaleDateString('tr-TR')
        };
        all.push(newReview);
        DB.set('project_reviews', all);
        return newReview;
    }
};

// ---- USER TIERS HELPER ----
const UserTiers = {
    getAll() { return DB.get('user_tiers') || {}; },
    get(id) { return this.getAll()[id] || this.getAll()['standart']; }
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    DB.init();
    applySettings();
    renderDynamicNav();
    setNavActive();
    initHamburger();
    updateNavAuth();
    renderHeroProjects();
    setTimeout(initScrollAnimations, 100);
});

/* ================================================
   MESSAGING SYSTEM
   ================================================ */
const Messaging = {
    getConversations(username) {
        const messages = DB.get('messages') || [];
        const convMap = {};
        messages.forEach(m => {
            if (m.from !== username && m.to !== username) return;
            const other = m.from === username ? m.to : m.from;
            if (!convMap[other]) convMap[other] = { with: other, messages: [], unread: 0 };
            convMap[other].messages.push(m);
            if (!m.read && m.to === username) convMap[other].unread++;
        });
        return Object.values(convMap).sort((a, b) => {
            const aLast = a.messages[a.messages.length - 1]?.ts || 0;
            const bLast = b.messages[b.messages.length - 1]?.ts || 0;
            return bLast - aLast;
        });
    },

    getMessages(user1, user2) {
        const messages = DB.get('messages') || [];
        return messages.filter(m =>
            (m.from === user1 && m.to === user2) ||
            (m.from === user2 && m.to === user1)
        ).sort((a, b) => a.ts - b.ts);
    },

    send(from, to, text) {
        if (!text.trim()) return false;
        const messages = DB.get('messages') || [];
        messages.push({ id: Date.now() + Math.random(), from, to, text: text.trim(), ts: Date.now(), read: false });
        DB.set('messages', messages);
        return true;
    },

    markRead(me, other) {
        const messages = DB.get('messages') || [];
        let changed = false;
        messages.forEach(m => { if (m.from === other && m.to === me && !m.read) { m.read = true; changed = true; } });
        if (changed) DB.set('messages', messages);
    },

    unreadCount(username) {
        const messages = DB.get('messages') || [];
        return messages.filter(m => m.to === username && !m.read).length;
    }
};

// ================================================
const ProfileData = {
    get(userId) {
        const profiles = DB.get('profiles') || [];
        return profiles.find(p => p.userId === userId) || {};
    },
    save(userId, data) {
        const profiles = DB.get('profiles') || [];

        // SECURITY: Escape all string fields in profile data
        const safeData = { ...data };
        if (safeData.bio) safeData.bio = Comments.escapeHTML(safeData.bio);
        if (safeData.socialTwitter) safeData.socialTwitter = Comments.escapeHTML(safeData.socialTwitter);
        if (safeData.socialGithub) safeData.socialGithub = Comments.escapeHTML(safeData.socialGithub);
        if (safeData.socialYoutube) safeData.socialYoutube = Comments.escapeHTML(safeData.socialYoutube);

        const idx = profiles.findIndex(p => p.userId === userId);
        if (idx !== -1) profiles[idx] = { ...profiles[idx], ...safeData, userId };
        else profiles.push({ userId, ...safeData });
        DB.set('profiles', profiles);
    }
};

/* ================================================
   ARTICLE COMMENTS SYSTEM
   ================================================ */
const Comments = {
    // SECURITY: Helper to escape HTML characters
    escapeHTML(str) {
        if (!str) return "";
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    getAll() {
        let data = DB.get('article_comments') || [];
        // Triple-Guard unwrap (MAX 10 depth)
        let d = 0;
        while (data && typeof data === 'object' && 'data' in data && data.data !== undefined && d < 10) {
            data = data.data;
            d++;
        }
        return Array.isArray(data) ? data : [];
    },
    getByArticle(articleId) {
        return this.getAll().filter(c => c.articleId === articleId).sort((a, b) => b.ts - a.ts);
    },
    add(articleId, username, text) {
        if (!text || !text.trim()) return false;
        const all = this.getAll();
        const safeText = this.escapeHTML(text.trim()); // XSS PROTECTION
        const newComm = {
            id: Date.now() + Math.random(),
            articleId,
            username: this.escapeHTML(username), // Also escape username just in case
            text: safeText,
            ts: Date.now(),
            date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
        all.push(newComm);
        DB.set('article_comments', all);
        return newComm;
    },
    delete(commentId, username) {
        let all = this.getAll();
        const idx = all.findIndex(c => c.id === commentId && c.username === username);
        if (idx !== -1) {
            all.splice(idx, 1);
            DB.set('article_comments', all);
            return true;
        }
        return false;
    }
};

// DB.init() is called inside DOMContentLoaded handler above

// Auto-sync from cloud on startup
if (typeof FirebaseDB !== 'undefined') {
    FirebaseDB.onReady(async () => {
        // CRITICAL: Load cloud data FIRST before listeners to prevent defaults from overwriting
        try {
            await DB.loadFromCloud();
            console.log('[Firebase] Initial cloud data loaded ✓');
            // settings are applied via the listen loop or explicitly when needed
        } catch (e) {
            console.warn('[Firebase] Initial cloud load failed:', e);
        }

        const syncKeys = [
            'settings', 'articles', 'users', 'forum_posts', 'user_projects',
            'user_tiers', 'profiles', 'custom_pages', 'article_comments',
            'site_logo_base64', 'bot_config', 'scraped_urls', 'messages',
            'pending_articles', 'bot_queue', 'bot_drafts'
        ];

        // Debounce timer for Firebase listener updates to prevent rapid re-renders
        const _fbDebounceTimers = {};

        syncKeys.forEach(key => {
            FirebaseDB.listen('site_data', key, (remote) => {
                if (!remote) return;

                // Debounce: Prevent rapid consecutive updates for the same key
                clearTimeout(_fbDebounceTimers[key]);
                _fbDebounceTimers[key] = setTimeout(() => {
                    _processFirebaseUpdate(key, remote);
                }, key === 'settings' ? 200 : 100);
            });
        });

        // Extracted handler for Firebase updates (debounced)
        function _processFirebaseUpdate(key, remote) {
            try {
                // RECURSIVE UNWRAP: Clean any accidental nesting from old bugs (MAX 10 depth)
                let remoteData = remote;
                let uwDepth = 0;
                while (remoteData && typeof remoteData === 'object' && 'data' in remoteData && remoteData.data !== undefined && uwDepth < 10) {
                    remoteData = remoteData.data;
                    uwDepth++;
                }

                if (remoteData === undefined || remoteData === null) return;

                // GUARD: If this key's local data is NEWER than cloud (cloud write failed due to size),
                // do NOT overwrite local with stale cloud data!
                if (DB._cloudStaleKeys && DB._cloudStaleKeys.has(key)) {
                    console.warn(`[Firebase] Skipping remote overwrite for '${key}' — local data is newer.`);
                    return;
                }

                // Handle CHUNKED articles: if cloud says '__CHUNKED__', fetch all chunks
                if (key === 'articles' && remoteData === '__CHUNKED__' && remote.chunkCount) {
                    (async () => {
                        let allArticles = [];
                        for (let i = 0; i < remote.chunkCount; i++) {
                            const chunk = await FirebaseDB.get('site_data', `articles_chunk_${i}`);
                            if (chunk && Array.isArray(chunk.data)) {
                                allArticles = allArticles.concat(chunk.data);
                            }
                        }
                        // Only apply if cloud has more or equal articles
                        const localArticles = DB.get('articles');
                        if (Array.isArray(localArticles) && localArticles.length > allArticles.length) {
                            console.warn(`[Firebase] Skipping chunked remote — local has ${localArticles.length} vs cloud ${allArticles.length}`);
                            return;
                        }
                        // Use DB.set with syncToCloud=false to leverage MediaDB fallback automatically
                        DB.set('articles', allArticles, false);
                        console.log(`[Firebase] Loaded ${allArticles.length} articles from ${remote.chunkCount} cloud chunks`);
                        document.dispatchEvent(new CustomEvent('dbUpdated', { detail: { key: 'articles' } }));
                    })();
                    return;
                }

                // For articles: if local has MORE items, cloud data is stale — protect local
                // BUT: don't protect if local only has default/seed articles (IDs 1-8)
                if (key === 'articles') {
                    const localArticles = DB.get('articles');
                    if (Array.isArray(localArticles) && Array.isArray(remoteData) && localArticles.length > remoteData.length) {
                        // Check if local data is just the default seed (IDs 1-8)
                        const isDefaultData = localArticles.length <= 8 && localArticles.every(a => a.id >= 1 && a.id <= 8);
                        if (!isDefaultData) {
                            console.warn(`[Firebase] Skipping remote overwrite for 'articles' — local has ${localArticles.length} items vs cloud ${remoteData.length}`);
                            return;
                        }
                        // Default data — allow cloud to overwrite
                        console.log(`[Firebase] Local has default articles, allowing cloud overwrite.`);
                    }
                }

                // Clean any accidental nesting in remoteData before comparison (MAX 10 depth)
                let cleanRemote = remoteData;
                let crDepth = 0;
                while (cleanRemote && typeof cleanRemote === 'object' && 'data' in cleanRemote && cleanRemote.data !== undefined && crDepth < 10) {
                    cleanRemote = cleanRemote.data;
                    crDepth++;
                }

                const currentLocalData = DB.get(key);
                const remoteJSON = JSON.stringify(cleanRemote);
                const localJSON = JSON.stringify(currentLocalData);

                // Only update if data is actually different
                if (localJSON !== remoteJSON) {
                    console.log(`[Firebase] Remote change for ${key} (verified difference)`);

                    // Use DB.set with syncToCloud=false to handle LS vs IDB logic automatically
                    DB.set(key, cleanRemote, false);

                    // Specific reactions
                    if (key === 'settings' || key === 'site_logo_base64') {
                        applySettings();
                    } else if (key === 'user_tiers' && typeof renderTiers === 'function') {
                        renderTiers();
                    } else if (key === 'custom_pages' && typeof renderDynamicNav === 'function') {
                        renderDynamicNav();
                    }

                    // Dispatch event is already handled by DB.set()
                }
            } catch (e) {
                console.error(`[Firebase] Error processing update for '${key}':`, e);
            }
        }

        // Detect connectivity status for UI
        function updateBadge(status, message) {
            const badge = document.getElementById('cloudSyncStatus');
            if (!badge) return;
            badge.className = 'status-badge';

            if (status === 'connected') {
                badge.innerHTML = '<span style="color:#10b981;">● Bulut Bağlı</span>';
                badge.title = 'Verileriniz bulut ile senkronize ediliyor.';
            } else if (status === 'connecting') {
                badge.innerHTML = '<span style="color:#f59e0b;">◌ Bağlanıyor...</span>';
            } else if (status === 'error') {
                const shortMsg = message ? (message.length > 30 ? message.substring(0, 30) + '...' : message) : 'Bilinmeyen Hata';
                badge.innerHTML = `<span style="color:#ef4444;" title="${message || 'Bilinmeyen bir hata oluştu.'}">⚠ Bulut Hatası: ${shortMsg}</span>`;
            }
        }

        document.addEventListener('firebaseStatus', (e) => updateBadge(e.detail.status, e.detail.message));

        // Initial check if already ready or failed
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB._lastStatus !== 'connecting') {
            updateBadge(FirebaseDB._lastStatus, FirebaseDB._lastErrorMessage);
        }
    });
}

// Make DB globally accessible
window.DB = DB;

// AUTO-START: Pre-load IndexedDB data and Initialize
(async function () {
    try {
        if (window.DB) {
            await window.DB.preLoadLargeKeys();
            
            const initDB = () => {
                if (!window.DB._isInitialized) {
                    window.DB.init();
                    window.DB._isInitialized = true;
                    if (typeof applySettings === 'function') applySettings();
                    // Dispatch a custom event that DB is fully ready
                    document.dispatchEvent(new CustomEvent('dbReady'));
                }
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initDB);
            } else {
                initDB();
            }
        }
    } catch (e) {
        console.error('[DB] Pre-load startup error:', e);
    }
})();
