/* ===================================================
   ASIA CONSOLE - Matrix Rain Animation
   =================================================== */

(function () {
    'use strict';

    function initMatrix() {
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
            drops.length = 0;
            for (let i = 0; i < columns; i++) {
                drops[i] = Math.random() * -100;
            }
        }
        initDrops();
        window.addEventListener('resize', initDrops);

        // Get accent color from CSS variable
        function getAccentColor() {
            const style = getComputedStyle(document.documentElement);
            return style.getPropertyValue('--accent-blue').trim() || '#4f8ef7';
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
        // Refresh color every 2 seconds in case it changes
        setInterval(() => {
            accentHex = getAccentColor();
            rgb = hexToRgb(accentHex);
        }, 2000);

        function draw() {
            // Fade trail
            ctx.fillStyle = 'rgba(13, 17, 23, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = charArr[Math.floor(Math.random() * charArr.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Head of drop — bright white/accent
                if (drops[i] * fontSize > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
                    ctx.fillText(char, x, y);
                }

                // Body — accent color with fade
                const bodyChar = charArr[Math.floor(Math.random() * charArr.length)];
                if ((drops[i] - 1) * fontSize > 0) {
                    const alpha = 0.6 + Math.random() * 0.3;
                    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
                    ctx.fillText(bodyChar, x, (drops[i] - 1) * fontSize);
                }

                // Dim older characters
                for (let j = 2; j < 8; j++) {
                    if ((drops[i] - j) * fontSize > 0) {
                        const alpha = Math.max(0, 0.4 - j * 0.05);
                        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
                        const oldChar = charArr[Math.floor(Math.random() * charArr.length)];
                        ctx.fillText(oldChar, x, (drops[i] - j) * fontSize);
                    }
                }

                // Reset drop randomly
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i] += 0.5;
            }
        }

        // Run at ~30fps for performance
        setInterval(draw, 33);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMatrix);
    } else {
        initMatrix();
    }
})();
