/**
 * AsiaConsole Evolution Speed Module
 * Handles Lazy Loading, Pre-fetching and Performance Optimization
 */

const EvolutionSpeed = (() => {
    const init = () => {
        console.log('%c[Evolution Speed] Hız modülü aktif edildi... ⚡', 'color: #10b981; font-weight: bold;');
        
        setupLazyLoading();
        setupPreFetching();
        optimizeResources();

        if (window.EvolutionEngine) {
            window.EvolutionEngine.logEvent('speed_init', { status: 'success' });
        }
    };

    // 1. Smart Lazy Loading for Images
    const setupLazyLoading = () => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        if (image.dataset.src) {
                            image.src = image.dataset.src;
                            image.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(image);
                    }
                });
            });

            // Apply to all images without loading="lazy" (polyfilling or enhancing)
            document.querySelectorAll('img').forEach(img => {
                if (!img.getAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                imageObserver.observe(img);
            });
        }
    };

    // 2. Intelligent Pre-fetching: Prefetch pages on hover
    const setupPreFetching = () => {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (link.hostname === window.location.hostname && !link.hash) {
                link.addEventListener('mouseenter', () => {
                    const url = link.href;
                    if (!document.querySelector(`link[href="${url}"]`)) {
                        const prefetch = document.createElement('link');
                        prefetch.rel = 'prefetch';
                        prefetch.href = url;
                        document.head.appendChild(prefetch);
                        // console.log(`[Evolution Speed] Pre-fetching: ${url}`);
                    }
                }, { once: true });
            }
        });
    };

    // 3. Resource Optimization: Prioritize critical scripts
    const optimizeResources = () => {
        // Add dns-prefetch for external resources
        const domains = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://www.gstatic.com'];
        domains.forEach(domain => {
            if (!document.querySelector(`link[href="${domain}"]`)) {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = domain;
                document.head.appendChild(link);
            }
        });
    };

    return { init };
})();

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', EvolutionSpeed.init);
} else {
    EvolutionSpeed.init();
}
