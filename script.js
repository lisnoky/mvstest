(function () {
  'use strict';

  const MAIN_TABS = ['home.html','artists.html','citfm.html','onstage.html','related.html'];

  function applyTheme() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand();
      setTheme(tg.colorScheme);
      tg.onEvent('themeChanged', () => setTheme(tg.colorScheme));
    } else {
      setTheme(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e => setTheme(e.matches ? 'dark' : 'light'));
    }
  }
  function setTheme(s) { document.body.classList.toggle('tg-dark', s === 'dark'); }

  function setActiveNav() {
    const page = location.pathname.split('/').pop() || 'home.html';
    if (MAIN_TABS.includes(page)) document.body.classList.add('has-glow');
    document.querySelectorAll('.icon-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const target = link.dataset.target || '';
      const active = href === page
        || (page.startsWith('view_')   && target === 'citfm')
        || (page.startsWith('newsirl') && target === 'citfm')
        || (page === 'pressconf.html'  && target === 'citfm')
        || (page === 'meaverse.html'   && target === 'citfm')
        || (page === 'profile.html'    && target === 'related')
        || (page === 'shop.html'       && target === 'related');
      link.classList.toggle('active', active);
    });
  }

  function addHaptics() {
    document.addEventListener('click', e => {
      if (e.target.closest('a, button'))
        try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch (_) {}
    });
  }

  function renderArtists() {
    const list = document.getElementById('artists-list');
    if (!list) return;
    fetch('artists.json').then(r => r.json()).then(artists => {
      list.innerHTML = '';
      artists.forEach((a, i) => {
        const handle = a.handle.replace(/^@/, '');
        const fallback = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46"><circle cx="23" cy="23" r="23" fill="#e0e4f0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-family="sans-serif" fill="#9098b4">${handle.charAt(0).toUpperCase()}</text></svg>`)}`;
        const el = document.createElement('a');
        el.id = a.id; el.href = a.url; el.target = '_blank'; el.rel = 'noopener';
        el.className = 'artist-container';
        el.style.animationDelay = `${(i * 0.03).toFixed(2)}s`;
        el.innerHTML = `<img class="artist-photo" src="https://t.me/i/userpic/320/${handle}.jpg" alt="${handle}" loading="lazy" onerror="this.src='${fallback}'"><div class="text"><span class="channel_name" id="cn-${a.id}">@${handle}</span><div class="open_date">${a.since} · @${handle}</div></div><span class="artist-chevron">›</span>`;
        list.appendChild(el);
        fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://t.me/${handle}`)}`, {cache:'force-cache'})
          .then(r => r.text()).then(html => {
            const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                     || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
            if (m?.[1]) { const el = document.getElementById(`cn-${a.id}`); if (el) el.textContent = m[1].trim(); }
          }).catch(() => {});
      });
    }).catch(() => { list.innerHTML = '<p style="color:var(--t3);padding:12px 2px;font-size:13px;">Не удалось загрузить список.</p>'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); setActiveNav(); addHaptics(); renderArtists();
  });
})();
