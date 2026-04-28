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
        lastSync: Date.now()
    };

    const init = () => {
        console.log('%c[Evolution Engine] Sinir sistemi başlatıldı... 🧠', 'color: #a855f7; font-weight: bold;');
        
        // Load local state
        const saved = localStorage.getItem('tc_evolution_state');
        if (saved) state = { ...state, ...JSON.parse(saved) };

        setupMonitoring();
        setupPatcher();
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
                colno: event.colno,
                stack: event.error ? event.error.stack : ''
            });
        });

        // 2. Performance Monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const navData = performance.getEntriesByType('navigation')[0];
                if (navData && navData.duration > 3000) {
                    logEvent('performance_warning', {
                        duration: navData.duration,
                        page: window.location.pathname
                    });
                }
            });
        }

        // 3. User Engagement (Click Heatmap Lite)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, .clickable');
            if (target) {
                logEvent('click', {
                    tag: target.tagName,
                    text: target.innerText.slice(0, 30),
                    id: target.id,
                    classes: target.className,
                    path: window.location.pathname
                });
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
        state.logs.push(entry);
        state.experience += (type === 'error' ? 5 : 1);
        
        // Level up logic (placeholder)
        if (state.experience > state.level * 100) {
            state.level++;
            console.log(`%c[Evolution Engine] Seviye Atladı! Yeni Seviye: ${state.level} 🚀`, 'color: #fbbf24; font-weight: bold;');
        }

        saveLocal();
        
        // Critical error trigger immediate sync
        if (type === 'error') syncWithCloud();
    };

    // --- PATCHER ---
    const setupPatcher = () => {
        // Listen for new patches from Firebase
        if (typeof FirebaseDB !== 'undefined') {
            FirebaseDB.onReady(() => {
                FirebaseDB.listen('evolution_data', 'active_patches', (data) => {
                    if (data && data.patches) {
                        applyPatches(data.patches);
                    }
                });
            });
        }
    };

    const applyPatches = (patches) => {
        patches.forEach(patch => {
            // Check if already applied
            if (document.getElementById(`patch-${patch.id}`)) return;

            console.log(`%c[Evolution Engine] Yama Uygulanıyor: ${patch.name}`, 'color: #10b981;');
            
            if (patch.type === 'css') {
                const style = document.createElement('style');
                style.id = `patch-${patch.id}`;
                style.textContent = patch.code;
                document.head.appendChild(style);
            } else if (patch.type === 'js') {
                try {
                    const script = document.createElement('script');
                    script.id = `patch-${patch.id}`;
                    script.textContent = `(function(){ try { ${patch.code} } catch(e){ console.error('Patch Error:', e); } })();`;
                    document.body.appendChild(script);
                } catch (e) {
                    logEvent('patch_error', { patchId: patch.id, error: e.message });
                }
            }
        });
    };

    // --- SYNC & PERSISTENCE ---
    const saveLocal = () => {
        localStorage.setItem('tc_evolution_state', JSON.stringify({
            level: state.level,
            experience: state.experience,
            lastSync: state.lastSync
        }));
    };

    const syncWithCloud = async () => {
        if (typeof FirebaseDB === 'undefined' || !FirebaseDB._ready) return;
        if (state.logs.length === 0) return;

        console.log('[Evolution Engine] Veriler buluta senkronize ediliyor...');
        const logsToSync = [...state.logs];
        state.logs = []; // Clear current logs
        
        const success = await FirebaseDB.set('evolution_logs', 'session_' + Date.now(), {
            logs: logsToSync,
            metadata: {
                level: state.level,
                exp: state.experience,
                agent: navigator.userAgent
            }
        });

        if (success) {
            state.lastSync = Date.now();
            saveLocal();
        } else {
            // Put back logs if failed
            state.logs = [...logsToSync, ...state.logs];
        }
    };

    const updateUI = () => {
        // This will be called to update any visual indicators
        const el = document.getElementById('evolution-level-val');
        if (el) el.textContent = state.level;
        
        const bar = document.getElementById('evolution-progress-bar');
        if (bar) {
            const progress = (state.experience % (state.level * 100)) / (state.level);
            bar.style.width = `${progress}%`;
        }
    };

    return { init, logEvent, state };
})();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EvolutionEngine.init);
} else {
    EvolutionEngine.init();
}
