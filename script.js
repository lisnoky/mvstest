/* ═══════════════════════════════
   MEAVERSE — script.js v2
   TG theme · Nav · Artists JSON
   ═══════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Telegram тема ── */
  function applyTheme() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setTheme(tg.colorScheme);
      tg.onEvent('themeChanged', () => setTheme(tg.colorScheme));
    } else if (window.matchMedia) {
      // fallback — OS preference
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => setTheme(e.matches ? 'dark' : 'light'));
    }
  }
  function setTheme(scheme) {
    document.body.classList.toggle('tg-dark', scheme === 'dark');
  }

  /* ── 2. Активный пункт nav ── */
  function setActiveNav() {
    const page = location.pathname.split('/').pop() || 'home.html';
    document.querySelectorAll('.icon-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const target = link.dataset.target || '';
      const active =
        href === page ||
        (page.startsWith('view_')    && target === 'citfm') ||
        (page.startsWith('newsirl')  && target === 'citfm') ||
        (page === 'pressconf.html'   && target === 'citfm') ||
        (page === 'profile.html'     && target === 'related') ||
        (page === 'shop.html'        && target === 'related');
      link.classList.toggle('active', active);
    });
  }

  /* ── 3. Haptic при тапах ── */
  function addHaptics() {
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch (_) {}
      });
    });
  }

  /* ── 4. Автоматический рендер артистов ──
     Подгружает artists.json и рендерит список.
     Работает на странице artists.html.
     Чтобы добавить/убрать артиста — редактируй только artists.json.
  ── */
  function renderArtists() {
    const container = document.getElementById('artists-list');
    if (!container) return;

    fetch('artists.json')
      .then(r => r.json())
      .then(artists => {
        container.innerHTML = artists.map((a, i) => `
          <a id="${a.id}" href="${a.url}" class="artist-container"
             target="_blank" rel="noopener"
             style="animation-delay:${(i * 0.04).toFixed(2)}s">
            <img src="${a.photo}" class="artist-photo" alt="${a.name}" loading="lazy"
                 onerror="this.src='IMAGES/placeholder.png'">
            <div class="text">
              <span class="channel_name">${a.name}</span>
              <div class="open_date">${a.date} · ${a.handle}</div>
            </div>
            <span class="artist-chevron">›</span>
          </a>
        `).join('');
      })
      .catch(() => {
        // Если fetch упал (открыто с file://) — показываем заглушку
        container.innerHTML = '<p style="color:var(--t3);padding:12px 4px;font-size:13px;">Не удалось загрузить список артистов.</p>';
      });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setActiveNav();
    addHaptics();
    renderArtists();
  });
})();
