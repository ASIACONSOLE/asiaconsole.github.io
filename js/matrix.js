/* ===================================================
   ASIA CONSOLE - Matrix Rain Animation
   =================================================== */

(function () {
    'use strict';

    let _animFrameId = null;
    let _isPaused = false;

    function initMatrix() {
        try {
            if (window.innerWidth <= 768) return; // Mobil cihazlarda performansı korumak için animasyonu kapat

            const canvas = document.createElement('canvas');
            canvas.id = 'matrixCanvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
                z-index: -1;
                opacity: 0.07;
            `;
            document.body.insertBefore(canvas, document.body.firstChild);

            const ctx = canvas.getContext('2d');
            if (!ctx) return; // Canvas not supported

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            resize();
            window.addEventListener('resize', resize);

            // Matrix characters - mix of katakana, latin, numbers
            const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>[]{}|=+-*';
            const charArr = chars.split('');

            const fontSize = 14;
            let columns = Math.floor(canvas.width / fontSize);
            const drops = [];

            function initDrops() {
                columns = Math.floor(canvas.width / fontSize);
                if (columns <= 0) columns = 1;
                drops.length = 0;
                for (let i = 0; i < columns; i++) {
                    drops[i] = Math.random() * -100;
                }
            }
            initDrops();
            window.addEventListener('resize', initDrops);

            // Get accent color from CSS variable
            function getAccentColor() {
                try {
                    const style = getComputedStyle(document.documentElement);
                    return style.getPropertyValue('--accent-blue').trim() || '#4f8ef7';
                } catch (e) { return '#4f8ef7'; }
            }

            function hexToRgb(hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 79, g: 142, b: 247 };
            }

            let accentHex = getAccentColor();
            let rgb = hexToRgb(accentHex);

            // Refresh color only when it likely changes (e.g. after theme toggle)
            document.addEventListener('dbUpdated', (e) => {
                if (e.detail && e.detail.key === 'settings') {
                    accentHex = getAccentColor();
                    rgb = hexToRgb(accentHex);
                }
            });

            // PERFORMANCE: Pause animation when tab is not visible
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    _isPaused = true;
                    if (_animFrameId) {
                        cancelAnimationFrame(_animFrameId);
                        _animFrameId = null;
                    }
                } else {
                    _isPaused = false;
                    if (!_animFrameId) {
                        _animFrameId = requestAnimationFrame(draw);
                    }
                }
            });

            const fps = 30;
            const interval = 1000 / fps;
            let lastTime = 0;

            function draw(timestamp) {
                if (_isPaused) return;

                _animFrameId = requestAnimationFrame(draw);

                try {
                    const elapsed = timestamp - lastTime;
                    if (elapsed < interval) return;
                    lastTime = timestamp - (elapsed % interval);

                    // Fade trail
                    ctx.fillStyle = 'rgba(13, 17, 23, 0.15)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.font = fontSize + 'px monospace';

                    for (let i = 0; i < drops.length; i++) {
                        const char = charArr[Math.floor(Math.random() * charArr.length)];
                        const x = i * fontSize;
                        const y = drops[i] * fontSize;

                        // Head (Bright)
                        if (y > 0) {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.fillText(char, x, y);
                        }

                        // Body (Accent)
                        const bodyY = (drops[i] - 1) * fontSize;
                        if (bodyY > 0) {
                            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
                            ctx.fillText(charArr[Math.floor(Math.random() * charArr.length)], x, bodyY);
                        }

                        // Reset drop randomly
                        if (y > canvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i] += 0.5;
                    }
                } catch (e) {
                    console.error('[Matrix] Draw error:', e);
                    // Stop animation on repeated errors to prevent CPU drain
                    if (_animFrameId) cancelAnimationFrame(_animFrameId);
                    _animFrameId = null;
                }
            }

            _animFrameId = requestAnimationFrame(draw);
        } catch (e) {
            console.error('[Matrix] Init error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMatrix);
    } else {
        initMatrix();
    }
})();
