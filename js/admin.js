// ===================================================
// TECH COMMUNITY - Admin Panel JavaScript
// ===================================================

// Shared DB from main.js — admin.js extends it
const ADMIN_SESSION_KEY = 'tc_admin_session';

const Admin = {
    async login(user, pass) {
        // SHA-256 hash helper
        async function hashAdminPass(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + '_tc_admin_salt');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        const targetUser = 'ASIA';
        const hashedInput = await hashAdminPass(pass);

        // Check localStorage hash, then Firebase, then legacy plaintext
        let savedHash = localStorage.getItem('tc_admin_password_hash');

        if (!savedHash && typeof FirebaseDB !== 'undefined' && FirebaseDB._ready) {
            try {
                const remote = await FirebaseDB.get('site_data', 'admin_config');
                if (remote && remote.passwordHash) {
                    savedHash = remote.passwordHash;
                    localStorage.setItem('tc_admin_password_hash', savedHash);
                }
            } catch (e) {}
        }

        if (savedHash && String(user || '').toUpperCase() === targetUser && hashedInput === savedHash) {
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: targetUser, time: Date.now() }));
            return true;
        }

        // Legacy plaintext fallback
        const legacyPass = localStorage.getItem('tc_admin_password');
        if (legacyPass && pass === legacyPass && String(user || '').toUpperCase() === targetUser) {
            localStorage.setItem('tc_admin_password_hash', hashedInput);
            localStorage.removeItem('tc_admin_password');
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: targetUser, time: Date.now() }));
            return true;
        }

        return false;
    },

    logout() {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        window.location.href = 'index.html';
    },
    check() {
        const s = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!s) { window.location.href = 'index.html'; return false; }
        return true;
    },
    checkSession() {
        return this.check();
    }
};

// ---- TOAST ----
function showAdminToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ---- MODAL HELPERS ----
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
}

// Close modal on overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// ---- CONFIRM DELETE ----
function confirmDelete(msg, callback) {
    if (window.confirm(msg || 'Bu öğeyi silmek istediğinizden emin misiniz?')) {
        callback();
    }
}

// ---- SIDEBAR ACTIVE LINK ----
function setSidebarActive() {
    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(a => {
        const href = a.getAttribute('href');
        if (href === path) a.classList.add('active');
        else a.classList.remove('active');
    });
}

// ---- MOBILE MENU ----
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    overlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
    });

    // Close on link click (mobile)
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-open');
            }
        });
    });
}

// ---- LOGOUT BINDING ----
function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault();
            confirmDelete('Çıkış yapmak istediğinizden emin misiniz?', () => {
                Admin.logout();
            });
        };
    }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    // Legacy migration removed for security

    // Check session on every admin page except login
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin');
    if (!isLoginPage) Admin.check();
    setSidebarActive();
    initLogout();
    initMobileMenu();
});
