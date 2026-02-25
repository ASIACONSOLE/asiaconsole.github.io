// ===================================================
// ASIA CONSOLE - Google OAuth Integration
// ===================================================
// Usage: Include this script, then call GoogleAuth.init('YOUR_CLIENT_ID')
// Get Client ID from: console.cloud.google.com → APIs & Services → Credentials

const GoogleAuth = (function () {
    'use strict';

    // ← REPLACE THIS WITH YOUR CLIENT ID FROM GOOGLE CLOUD CONSOLE
    const DEFAULT_CLIENT_ID = '367594063152-0kagipiibbmh7t8ti3c8chjufe335l0j.apps.googleusercontent.com';

    let _clientId = DEFAULT_CLIENT_ID;
    let _initialized = false;
    let _onSuccess = null;

    function init(clientId, onSuccessCallback) {
        // Priority: argument > localStorage settings > DEFAULT_CLIENT_ID
        if (clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            _clientId = clientId;
        }
        _onSuccess = onSuccessCallback;

        // Override with the admin-configured Client ID if available
        try {
            const settings = JSON.parse(localStorage.getItem('tc_settings') || '{}');
            if (settings.googleClientId && settings.googleClientId.length > 10 &&
                !settings.googleClientId.includes('YOUR_GOOGLE')) {
                _clientId = settings.googleClientId;
            }
        } catch (e) { }

        // Only bail out if we truly have no valid Client ID
        if (!_clientId || _clientId.length < 20 || _clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
            console.warn('[GoogleAuth] No valid Client ID. Google login disabled.');
            _hideGoogleButtons();
            return;
        }

        _loadGSI();
    }

    function _loadGSI() {
        if (document.getElementById('gsi-script')) {
            _initGSI(); return;
        }
        const script = document.createElement('script');
        script.id = 'gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = _initGSI;
        document.head.appendChild(script);
    }

    function _initGSI() {
        if (!window.google || !window.google.accounts) {
            // retry up to 15 times (~4.5 seconds)
            if ((_initGSI._retries || 0) < 15) {
                _initGSI._retries = (_initGSI._retries || 0) + 1;
                setTimeout(_initGSI, 300);
            } else {
                console.warn('[GoogleAuth] GSI library failed to load.');
            }
            return;
        }
        try {
            google.accounts.id.initialize({
                client_id: _clientId,
                callback: _handleCredential,
                auto_select: false,
                cancel_on_tap_outside: true
            });
            _showGoogleButtons();
            _initialized = true;
        } catch (e) {
            console.error('[GoogleAuth] Initialization error:', e);
        }
    }

    function _handleCredential(response) {
        try {
            // Decode JWT payload
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const googleUser = {
                id: 'google_' + payload.sub,
                username: payload.name.replace(/\s+/g, '_'),
                email: payload.email,
                avatar: payload.picture,
                provider: 'google',
                joined: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
                posts: 0,
                active: true,
                accountType: 'standart'
            };

            // Register or find user
            let users = JSON.parse(localStorage.getItem('tc_users') || '[]');
            let existing = users.find(u => u.email === googleUser.email);
            if (!existing) {
                users.push(googleUser);
                localStorage.setItem('tc_users', JSON.stringify(users));
                existing = googleUser;
            }

            // Set session
            localStorage.setItem('tc_user_session', JSON.stringify({ id: existing.id, username: existing.username, email: existing.email }));

            // Save Google avatar as profile photo
            if (payload.picture) {
                localStorage.setItem('tc_avatar_' + existing.id, payload.picture);
            }

            if (_onSuccess) {
                _onSuccess(existing);
            } else {
                window.location.reload();
            }
        } catch (e) {
            console.error('[GoogleAuth] Failed to parse credential:', e);
        }
    }

    function signIn() {
        if (!_initialized) {
            // If we have a valid client ID but GSI hasn't initialized yet, retry
            if (_clientId && _clientId.length > 20 && !_clientId.includes('YOUR_GOOGLE')) {
                _loadGSI();
                // Wait up to 3 seconds for GSI to initialize then prompt
                let attempts = 0;
                const waitAndPrompt = () => {
                    if (_initialized) {
                        google.accounts.id.prompt();
                    } else if (attempts < 10) {
                        attempts++;
                        setTimeout(waitAndPrompt, 300);
                    } else {
                        alert('Google girişi yüklenemedi. Sayfayı yenileyin veya birkaç dakika bekleyin.');
                    }
                };
                setTimeout(waitAndPrompt, 300);
            } else {
                alert('Google Client ID ayarlanmamış. Admin paneli → Site Ayarları → Google OAuth bölümünden ekleyin.');
            }
            return;
        }
        google.accounts.id.prompt();
    }

    function signOut() {
        if (window.google && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        localStorage.removeItem('tc_user_session');
    }

    function isConfigured() {
        // Configured if we have a valid-looking Client ID (either default or from settings)
        if (_clientId && _clientId.length > 20 && !_clientId.includes('YOUR_GOOGLE')) return true;
        try {
            const s = JSON.parse(localStorage.getItem('tc_settings') || '{}');
            return !!(s.googleClientId && s.googleClientId.length > 10);
        } catch (e) { return false; }
    }

    function _showGoogleButtons() {
        document.querySelectorAll('.google-login-btn').forEach(el => {
            el.style.display = 'flex';
        });
    }

    function _hideGoogleButtons() {
        document.querySelectorAll('.google-login-btn').forEach(el => {
            el.style.display = 'none';
        });
    }

    return { init, signIn, signOut, isConfigured };
})();
