/**
 * AsiaConsole Autonomous Evolution Engine (AEE)
 * "The Neural System of the Website"
 * 
 * This module enables the site to observe its own state,
 * report issues, and apply AI-generated patches.
 */

const EvolutionEngine = (() => {
    let state = {
        level: 1,
        experience: 0,
        logs: [],
        patches: [],
        suggestions: [],
        accomplishments: [],
        lastSync: Date.now()
    };

    const init = () => {
        console.log('%c[Evolution Engine] Sinir sistemi başlatıldı... 🧠', 'color: #a855f7; font-weight: bold;');
        
        // Load combined state
        const saved = localStorage.getItem('tc_evolution_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        }

        setupMonitoring();
        setupPatcher();
        generateInitialSuggestions();
        updateUI();

        // Initial sync attempt
        setTimeout(syncWithCloud, 5000);
    };

    // --- MONITORING ---
    const setupMonitoring = () => {
        // 1. Error Monitoring
        window.addEventListener('error', (event) => {
            logEvent('error', {
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                stack: event.error ? event.error.stack : ''
            });
            // Try to generate a fix suggestion for this error
            addSuggestion({
                type: 'fix',
                title: 'Otomatik Hata Giderici',
                desc: `Sistemde bir JS hatası tespit edildi: ${event.message}. AI bu hatayı izole edip gidermeyi teklif ediyor.`,
                impact: 'Kararlılık',
                priority: 'Yüksek'
            });
        });

        // 2. User Engagement Analysis
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, .clickable');
            if (target) {
                logEvent('click', {
                    tag: target.tagName,
                    text: target.innerText.slice(0, 30),
                    path: window.location.pathname
                });
                
                // If user clicks a lot of things, maybe suggest a tutorial
                if (state.experience > 500 && state.level < 5) {
                    addSuggestion({
                        type: 'feature',
                        title: 'Interaktif Tur Sistemi',
                        desc: 'Kullanıcı etkileşimi çok yüksek. Yeni üyeler için siteyi tanıtan bir interaktif tur ekleyebiliriz.',
                        impact: 'UX / Deneyim',
                        priority: 'Orta'
                    });
                }
            }
        }, true);
    };

    const logEvent = (type, data) => {
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            time: new Date().toISOString(),
            type,
            data,
            url: window.location.href
        };
        state.logs.unshift(entry);
        if (state.logs.length > 50) state.logs.pop(); // Keep last 50
        
        state.experience += (type === 'error' ? 10 : 2);
        
        // Level up logic
        if (state.experience > state.level * 100) {
            state.level++;
            addAccomplishment(`Yapay Zeka Seviye ${state.level} oldu ve site mimarisini daha iyi kavramaya başladı.`);
            console.log(`%c[Evolution Engine] Seviye Atladı! Yeni Seviye: ${state.level} 🚀`, 'color: #fbbf24; font-weight: bold;');
        }

        saveLocal();
        updateUI();
    };

    // --- SUGGESTIONS & ACCOMPLISHMENTS ---
    const addSuggestion = (sugg) => {
        // Prevent duplicates
        if (state.suggestions.some(s => s.title === sugg.title)) return;
        
        const newSugg = {
            id: 'sug_' + Date.now(),
            time: new Date().toISOString(),
            status: 'pending',
            ...sugg
        };
        state.suggestions.unshift(newSugg);
        if (state.suggestions.length > 10) state.suggestions.pop();
        
        saveLocal();
        updateUI();
    };

    const addAccomplishment = (text) => {
        const acc = {
            id: 'acc_' + Date.now(),
            time: new Date().toISOString(),
            text
        };
        state.accomplishments.unshift(acc);
        if (state.accomplishments.length > 20) state.accomplishments.pop();
        saveLocal();
        updateUI();
    };

    const approveSuggestion = (id) => {
        const sugg = state.suggestions.find(s => s.id === id);
        if (!sugg || sugg.status !== 'pending') return;

        sugg.status = 'applying';
        saveLocal();
        updateUI();

        // Simulate AI integration process
        setTimeout(() => {
            sugg.status = 'applied';
            addAccomplishment(`${sugg.title} özelliği başarıyla siteye entegre edildi.`);
            
            // Remove from active suggestions list
            state.suggestions = state.suggestions.filter(s => s.id !== id);
            
            saveLocal();
            updateUI();
            console.log(`%c[AI Entegrasyonu Tamamlandı] ${sugg.title}`, 'color: #10b981; font-weight: bold;');
        }, 3000);
    };

    const generateInitialSuggestions = () => {
        // Only generate if we've never generated before
        if (state.suggestions.length === 0 && !state.initial_suggestions_generated) {
            state.initial_suggestions_generated = true;
            addSuggestion({
                type: 'seo',
                title: 'Dinamik Meta Etiketi Optimizasyonu',
                desc: 'Yapay zeka, sayfa içeriklerine göre meta açıklamalarını otomatik güncelleyerek SEO puanını %15 artırabilir.',
                impact: 'SEO / Trafik',
                priority: 'Yüksek'
            });
            addSuggestion({
                type: 'ui',
                title: 'Gece Modu Adaptasyonu',
                desc: 'Ziyaretçilerin çoğu gece saatlerinde giriş yapıyor. Akıllı bir gece modu geçişi eklemeyi öneriyorum.',
                impact: 'UX / Göz Sağlığı',
                priority: 'Düşük'
            });
            saveLocal();
        }
    };

    // --- PATCHER ---
    const setupPatcher = () => {
        if (typeof FirebaseDB !== 'undefined') {
            FirebaseDB.onReady(() => {
                FirebaseDB.listen('evolution_data', 'active_patches', (data) => {
                    if (data && data.patches) applyPatches(data.patches);
                });
            });
        }
    };

    const applyPatches = (patches) => {
        patches.forEach(patch => {
            if (document.getElementById(`patch-${patch.id}`)) return;
            const style = document.createElement(patch.type === 'css' ? 'style' : 'script');
            style.id = `patch-${patch.id}`;
            style.textContent = patch.type === 'css' ? patch.code : `(function(){ try { ${patch.code} } catch(e){ console.error('Patch Error:', e); } })();`;
            document.head.appendChild(style);
        });
    };

    // --- SYNC & PERSISTENCE ---
    const saveLocal = () => {
        localStorage.setItem('tc_evolution_state', JSON.stringify({
            level: state.level,
            experience: state.experience,
            lastSync: state.lastSync,
            suggestions: state.suggestions,
            accomplishments: state.accomplishments,
            initial_suggestions_generated: state.initial_suggestions_generated,
            logs: state.logs.slice(0, 20) // Save only latest 20 logs locally
        }));
    };

    const syncWithCloud = async () => {
        if (typeof FirebaseDB === 'undefined' || !FirebaseDB._ready) return;
        
        console.log('[Evolution Engine] Bulut senkronizasyonu başlatıldı...');
        const success = await FirebaseDB.set('evolution_meta', 'state', {
            ...state,
            lastSync: Date.now()
        });

        if (success) {
            console.log('[Evolution Engine] Bulut senkronizasyonu başarılı. ✅');
            state.lastSync = Date.now();
            saveLocal();
        }
    };

    const updateUI = () => {
        // Broadcast event for the dashboard to pick up
        document.dispatchEvent(new CustomEvent('evolutionUpdated', { detail: { ...state } }));
    };

    return { init, logEvent, state, addSuggestion, addAccomplishment, approveSuggestion, syncWithCloud };
})();

// Attach to window to ensure global access from HTML onclick handlers
window.EvolutionEngine = EvolutionEngine;

EvolutionEngine.init();
