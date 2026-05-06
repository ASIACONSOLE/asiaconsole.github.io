/**
 * AsiaConsole Badge & Points System
 * Injects UI elements into the profile page dynamically to avoid HTML conflicts.
 */

function initBadgesSystem() {
    // 1. Inject Points Stat into the Stats Bar
    const viewsBox = document.querySelector('.profile-stats-bar .profile-stat:last-child');
    if (viewsBox && !document.getElementById('statPoints')) {
        const pointsBox = document.createElement('div');
        pointsBox.className = 'profile-stat';
        pointsBox.style.background = 'rgba(79, 142, 247, 0.1)';
        pointsBox.style.border = '1px solid rgba(79, 142, 247, 0.2)';
        pointsBox.innerHTML = `
            <div class="profile-stat-num" id="statPoints" style="color: var(--accent-blue);">0</div>
            <div class="profile-stat-label">Puan</div>
        `;
        viewsBox.after(pointsBox);
    }

    // 2. Inject Badges Card into the Sidebar
    const bioCard = document.querySelector('.profile-sidebar .card');
    if (bioCard && !document.getElementById('profileBadges')) {
        const badgesCard = document.createElement('div');
        badgesCard.className = 'card';
        badgesCard.style.marginTop = '1rem';
        badgesCard.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(79, 142, 247, 0.05))';
        badgesCard.innerHTML = `
            <h3 style="font-size:0.9rem; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">🏅 Rozetler</h3>
            <div id="profileBadges" style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                <p style="font-size:0.75rem; color:var(--text-muted);">Yükleniyor...</p>
            </div>
        `;
        bioCard.after(badgesCard);
    }
}

// Global calculation function called by renderProfile
window.updatePointsAndBadges = function(username, forumCount, projectCount) {
    const points = (forumCount * 10) + (projectCount * 50);
    const pEl = document.getElementById('statPoints');
    if (pEl) pEl.textContent = points.toLocaleString('tr-TR');

    const bEl = document.getElementById('profileBadges');
    if (bEl) {
        const b = [];
        if (points >= 10) b.push({ icon: '✍️', name: 'Yazar', color: '#4f8ef7', desc: 'İlk forum konusunu açtı' });
        if (points >= 50) b.push({ icon: '🚀', name: 'Girişimci', color: '#a855f7', desc: 'İlk projesini yayınladı' });
        if (points >= 200) b.push({ icon: '🔥', name: 'Popüler', color: '#f59e0b', desc: '200 puana ulaştı' });
        if (points >= 500) b.push({ icon: '👑', name: 'Efsane', color: '#ef4444', desc: 'Topluluğun efsane üyesi' });
        if (projectCount >= 3) b.push({ icon: '🛠️', name: 'Usta Geliştirici', color: '#10b981', desc: '3+ proje yayınladı' });

        if (b.length === 0) {
            bEl.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted);">Henüz rozet kazanılmadı.</p>';
        } else {
            bEl.innerHTML = b.map(i => `
                <div class="badge-item" title="${i.desc}" style="background:${i.color}22; border:1px solid ${i.color}44; color:${i.color}; padding:4px 10px; border-radius:8px; font-size:0.75rem; font-weight:700; display:flex; align-items:center; gap:4px; cursor:help;">
                    <span>${i.icon}</span> ${i.name}
                </div>
            `).join('');
        }
    }
};

document.addEventListener('DOMContentLoaded', initBadgesSystem);
document.addEventListener('dbReady', initBadgesSystem);
