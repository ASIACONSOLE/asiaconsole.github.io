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
                use_fedcm_for_prompt: true
            });
            _renderOfficialButtons();
            _showGoogleButtons();
            _initialized = true;
        } catch (e) {
            console.error('[GoogleAuth] Initialization error:', e);
        }
    }

    function _handleCredential(response) {
        try {
            // Decode JWT payload safely
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);

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

            console.log('[GoogleAuth] Credential parsed:', googleUser.email);

            // Register or find user
            let users = JSON.parse(localStorage.getItem('tc_users') || '[]');
            let existing = users.find(u => u.email === googleUser.email);
            if (!existing) {
                console.log('[GoogleAuth] Creating new user...');
                users.push(googleUser);
                if (typeof DB !== 'undefined') {
                    DB.set('users', users);
                } else {
                    localStorage.setItem('tc_users', JSON.stringify(users));
                }
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
        console.log('[GoogleAuth] signIn() triggered. Initialized:', _initialized);
        if (!_initialized) {
            console.warn('[GoogleAuth] Not initialized yet, attempting to load GSI...');
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

        try {
            google.accounts.id.prompt((notification) => {
                console.log('[GoogleAuth] Prompt notification:', notification.getMomentType(), notification.getNotDisplayedReason());
                if (notification.isNotDisplayed()) {
                    const reason = notification.getNotDisplayedReason();
                    if (reason === 'opt_out_or_no_session') {
                        alert('Google oturumunuz bulunamadı veya kapalı. Lütfen Google hesabınızda açık olduğundan emin olun.');
                    } else if (reason === 'suppressed_by_user') {
                        alert('Giriş penceresi çok sık kapatıldığı için engellendi. Lütfen tarayıcıyı kapatıp açın veya çerezleri temizleyin.');
                    } else {
                        console.warn('[GoogleAuth] Prompt not displayed. Reason:', reason);
                        // Fallback: One Tap might be suppressed, but we don't have a direct "popup" call in this SDK
                        // without using renderButton. For now, just notifying.
                    }
                }
            });
        } catch (e) {
            console.error('[GoogleAuth] Prompt error:', e);
        }
    }

    function signOut() {
        if (window.google && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        localStorage.removeItem('tc_user_session');
        if (typeof showToast === 'function') showToast('Oturum kapatıldı.', 'info');
        setTimeout(() => window.location.reload(), 500);
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

    function _renderOfficialButtons() {
        // Render the official Google button in specific containers for better reliability
        document.querySelectorAll('.google-login-container').forEach(el => {
            google.accounts.id.renderButton(el, {
                theme: 'outline',
                size: 'large',
                width: el.offsetWidth || 300,
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            });
        });
    }

    return { init, signIn, signOut, isConfigured, renderOfficial: _renderOfficialButtons };
})();
