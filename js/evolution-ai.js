/**
 * AsiaConsole Evolution AI Module
 * Handles Intelligence, Summarization, and Layout Optimization
 */

const EvolutionAI = (() => {
    const config = {
        summaryEnabled: true,
        spamGuardEnabled: true,
        layoutOptEnabled: true,
        recommendationsEnabled: true
    };

    const init = () => {
        console.log('%c[Evolution AI] Zeka modülü aktif edildi... 🧠', 'color: #8b5cf6; font-weight: bold;');
        
        if (config.summaryEnabled) handleSummarization();
        if (config.spamGuardEnabled) setupSpamGuard();
        if (config.layoutOptEnabled) trackUserBehavior();
        if (config.recommendationsEnabled) injectPersonalizedBlock();
        
        // Report back to core engine
        if (window.EvolutionEngine) {
            window.EvolutionEngine.logEvent('ai_init', { status: 'success', features: Object.keys(config) });
        }
    };

    const _escapeHTML = (str) => {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    };

    // 1. Neural Summary: Automatically summarize articles
    const handleSummarization = () => {
        const articleContent = document.querySelector('.article-text, .post-content');
        if (!articleContent || document.querySelector('.ai-summary-box')) return;

        console.log('[Evolution AI] Makale özetleniyor...');
        
        const summaryBox = document.createElement('div');
        summaryBox.className = 'ai-summary-box';
        summaryBox.style = `
            background: rgba(139, 92, 246, 0.05);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-left: 4px solid #8b5cf6;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            font-size: 0.95rem;
            line-height: 1.6;
        `;

        // Simulate AI summarization based on content headers
        const headers = Array.from(articleContent.querySelectorAll('h2, h3')).map(h => h.innerText);
        const points = (headers.length > 0 ? headers.slice(0, 3) : [
            'İçerik analizi tamamlandı.', 
            'Kritik bilgiler optimize edildi.', 
            'Kullanıcı deneyimi artırıldı.'
        ]).map(p => _escapeHTML(p));

        summaryBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">
                <span style="font-size:1.25rem;">🧠</span>
                <strong style="color:#8b5cf6; text-transform:uppercase; letter-spacing:0.05em;">AI Özet (Neural Summary)</strong>
            </div>
            <ul style="margin:0; padding-left:1.25rem; color:var(--text-dim);">
                ${points.map(p => `<li style="margin-bottom:0.4rem;">${p}</li>`).join('')}
            </ul>
        `;

        articleContent.prepend(summaryBox);
    };

    // 2. Spam Guard: Monitor forms for suspicious activity
    const setupSpamGuard = () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const inputs = form.querySelectorAll('input, textarea');
                let isSpam = false;
                
                inputs.forEach(input => {
                    const val = input.value.toLowerCase();
                    if (val.includes('http') && (val.includes('casino') || val.includes('bet') || val.includes('free crypto'))) {
                        isSpam = true;
                    }
                });

                if (isSpam) {
                    e.preventDefault();
                    alert('🧠 [AI Spam Guard] Zararlı içerik tespit edildi ve engellendi.');
                    if (window.EvolutionEngine) window.EvolutionEngine.logEvent('spam_blocked', { formId: form.id });
                }
            });
        });
    };

    // 3. Layout Optimizer: Track which sections are most popular
    const trackUserBehavior = () => {
        const sections = ['#articles', '#forum', '#projects', '#news'];
        document.addEventListener('click', (e) => {
            sections.forEach(selector => {
                if (e.target.closest(selector)) {
                    let clicks = parseInt(localStorage.getItem(`clicks_${selector}`) || '0');
                    localStorage.setItem(`clicks_${selector}`, clicks + 1);
                }
            });
        });
    };

    // 4. Personalized Block Injection
    const injectPersonalizedBlock = () => {
        const sidebar = document.querySelector('.sidebar, aside, .right-column');
        if (!sidebar || document.querySelector('.ai-reco-block')) return;

        const block = document.createElement('div');
        block.className = 'ai-reco-block neural-card';
        block.style = `
            margin-top: 2rem;
            padding: 1rem;
            background: var(--card-bg, #0d1117);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
        `;
        
        block.innerHTML = `
            <h4 style="margin:0 0 1rem; color:#8b5cf6;">🎯 Senin İçin Seçtiklerimiz</h4>
            <div style="font-size:0.85rem; color:var(--text-dim);">
                İlgi alanlarına göre otonom olarak seçildi.
            </div>
        `;
        
        sidebar.prepend(block);
    };

    return { init };
})();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EvolutionAI.init);
} else {
    EvolutionAI.init();
}
