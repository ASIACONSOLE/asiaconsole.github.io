// ===================================================
// TECH COMMUNITY - Admin Panel JavaScript
// ===================================================

// Shared DB from main.js — admin.js extends it
const ADMIN_SESSION_KEY = 'tc_admin_session';

const Admin = {
    login(user, pass) {
        if (user === 'admin' && pass === 'admin123') {
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ user: 'admin', time: Date.now() }));
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

// ---- LOGOUT BUTTON ----
function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', Admin.logout);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    // Check session on every admin page except login
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin');
    if (!isLoginPage) Admin.check();
    setSidebarActive();
    initLogout();
});
