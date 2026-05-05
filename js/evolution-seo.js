/**
 * AsiaConsole Evolution SEO Module
 * Handles JSON-LD Schema, Meta Optimization and Alt-Text Fixes
 */

const EvolutionSEO = (() => {
    const init = () => {
        console.log('%c[Evolution SEO] SEO modülü aktif edildi... 🔍', 'color: #3b82f6; font-weight: bold;');
        
        injectJSONLD();
        optimizeMetaTags();
        fixMissingAltTags();

        if (window.EvolutionEngine) {
            window.EvolutionEngine.logEvent('seo_init', { status: 'success' });
        }
    };

    // 1. Injects Structured Data (JSON-LD)
    const injectJSONLD = () => {
        if (document.querySelector('script[type="application/ld+json"]')) return;

        const schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "AsiaConsole",
            "url": window.location.origin,
            "description": "Teknoloji, oyun ve uygulama dünyasındaki en güncel haberler.",
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${window.location.origin}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            }
        };

        // If it's an article page, add Article schema
        const isArticle = document.querySelector('.article-text, .post-content');
        if (isArticle) {
            schema["@type"] = "Article";
            schema["headline"] = document.title;
            schema["author"] = { "@type": "Person", "name": "AsiaConsole Admin" };
            schema["datePublished"] = new Date().toISOString();
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    };

    // 2. Meta Tag Optimization
    const optimizeMetaTags = () => {
        // Canonical Tag
        if (!document.querySelector('link[rel="canonical"]')) {
            const canonical = document.createElement('link');
            canonical.rel = 'canonical';
            canonical.href = window.location.href.split('?')[0];
            document.head.appendChild(canonical);
        }

        // Meta Description (ensure it exists)
        if (!document.querySelector('meta[name="description"]')) {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = document.title + " - En son teknoloji haberleri ve topluluk tartışmaları AsiaConsole'da.";
            document.head.appendChild(meta);
        }
    };

    // 3. Fix Missing Alt Tags
    const fixMissingAltTags = () => {
        document.querySelectorAll('img').forEach(img => {
            if (!img.alt || img.alt.trim() === '') {
                // Use page title or filename as alt
                const filename = img.src.split('/').pop().split('.')[0];
                img.alt = filename.replace(/-/g, ' ') || document.title;
                // console.log(`[Evolution SEO] Fixed Alt Tag: ${img.alt}`);
            }
        });
    };

    return { init };
})();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EvolutionSEO.init);
} else {
    EvolutionSEO.init();
}
