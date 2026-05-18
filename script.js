/* ═══════════════════════════════════════
   MEAVERSE script.js v4
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Тема ── */
  function applyTheme () {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setTheme(tg.colorScheme);
      tg.onEvent('themeChanged', () => setTheme(tg.colorScheme));
    } else {
      const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(dark ? 'dark' : 'light');
      window.matchMedia?.('(prefers-color-scheme: dark)')
        .addEventListener('change', e => setTheme(e.matches ? 'dark' : 'light'));
    }
  }
  function setTheme (s) {
    document.body.classList.toggle('tg-dark', s === 'dark');
  }

  /* ── 2. Активный пункт nav + розовый блик на главных страницах ── */
  const MAIN_TABS = ['home.html', 'artists.html', 'citfm.html', 'onstage.html', 'related.html'];

  function setActiveNav () {
    const page = location.pathname.split('/').pop() || 'home.html';

    // Розовый градиент только на главных вкладках
    if (MAIN_TABS.includes(page)) {
      document.body.classList.add('has-glow');
    }

    document.querySelectorAll('.icon-link').forEach(link => {
      const href   = link.getAttribute('href') || '';
      const target = link.dataset.target || '';

      const active =
        href === page ||
        (page.startsWith('view_')   && target === 'citfm')   ||
        (page.startsWith('newsirl') && target === 'citfm')   ||
        (page === 'pressconf.html'  && target === 'citfm')   ||
        (page === 'meaverse.html'   && target === 'citfm')   ||
        (page === 'profile.html'    && target === 'related') ||
        (page === 'shop.html'       && target === 'related');

      link.classList.toggle('active', active);
    });
  }

  /* ── 3. Haptic ── */
  function addHaptics () {
    document.addEventListener('click', e => {
      if (e.target.closest('a, button')) {
        try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch (_) {}
      }
    });
  }

  /* ── 4. Автоматический рендер артистов ──
     Читает artists.json. Каждая строка там:
       { "id": "...", "handle": "username_без_@", "url": "https://t.me/...", "since": "дата" }

     Аватарка берётся с t.me/i/userpic/320/{handle}.jpg (живая, без токена).
     Название канала: пробуем подтянуть через CORS-proxy из og:title страницы.
     Если не получилось — показывает @handle.

     ДОБАВИТЬ АРТИСТА → одна строка в artists.json (инструкция ниже).
  ── */
  function renderArtists () {
    const list = document.getElementById('artists-list');
    if (!list) return;

    fetch('artists.json')
      .then(r => r.json())
      .then(artists => {
        list.innerHTML = '';
        artists.forEach((a, i) => {
          const handle = a.handle.replace(/^@/, '');
          const item = document.createElement('a');
          item.id = a.id;
          item.href = a.url;
          item.target = '_blank';
          item.rel = 'noopener';
          item.className = 'artist-container';
          item.style.animationDelay = `${(i * 0.03).toFixed(2)}s`;

          // Fallback аватарка — первая буква handle
          const fallbackSVG = `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46"><circle cx="23" cy="23" r="23" fill="#e0e4f0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-family="sans-serif" fill="#9098b4">${handle.charAt(0).toUpperCase()}</text></svg>`
          )}`;

          item.innerHTML = `
            <img class="artist-photo"
                 src="https://t.me/i/userpic/320/${handle}.jpg"
                 alt="${handle}" loading="lazy"
                 onerror="this.src='${fallbackSVG}'">
            <div class="text">
              <span class="channel_name" id="cn-${a.id}">@${handle}</span>
              <div class="open_date">${a.since} · @${handle}</div>
            </div>
            <span class="artist-chevron">›</span>
          `;
          list.appendChild(item);

          // Живое название канала
          fetchTitle(handle, a.id);
        });
      })
      .catch(() => {
        list.innerHTML = '<p style="color:var(--t3);padding:12px 2px;font-size:13px;">Не удалось загрузить список.</p>';
      });
  }

  function fetchTitle (handle, id) {
    const url = `https://corsproxy.io/?url=${encodeURIComponent(`https://t.me/${handle}`)}`;
    fetch(url, { cache: 'force-cache' })
      .then(r => r.text())
      .then(html => {
        const m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
        if (m?.[1]) {
          const el = document.getElementById(`cn-${id}`);
          if (el) el.textContent = m[1].trim();
        }
      })
      .catch(() => {});
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setActiveNav();
    addHaptics();
    renderArtists();
  });
})();
