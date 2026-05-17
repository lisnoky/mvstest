/* ═══════════════════════════════════════
   MEAVERSE script.js v3
   — TG theme detection
   — Nav active state
   — Artists auto-render from artists.json
     с живыми данными канала через
     Telegram public API (no token needed)
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

  /* ── 2. Активный пункт nav ── */
  function setActiveNav () {
    const page = location.pathname.split('/').pop() || 'home.html';
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

  /* ── 4. Рендер артистов ──────────────────────────────────────
     Загружает artists.json (только handle и url),
     для каждого канала тянет живые данные через:
       https://t.me/{username} — парсинг og:image, og:title
     Это работает без токена — Telegram отдаёт публичные meta.

     Но поскольку TG WebApp может блокировать cross-origin fetch,
     используем tgstat.ru как прокси для аватарок, а название
     и дату берём из нашего JSON (ты сама задаёшь `since`).
     Если хочешь живое имя канала — нужен бэкенд.

     Итог: добавить артиста = одна строка в artists.json.
     Аватарка подтягивается автоматически с tgstat.
  ──────────────────────────────────────────────────────────── */
  function renderArtists () {
    const list = document.getElementById('artists-list');
    if (!list) return;

    fetch('artists.json')
      .then(r => r.json())
      .then(artists => {
        list.innerHTML = '';
        artists.forEach((a, i) => {
          const item = document.createElement('a');
          item.id    = a.id;
          item.href  = a.url;
          item.target = '_blank';
          item.rel   = 'noopener';
          item.className = 'artist-container';
          item.style.animationDelay = `${(i * 0.03).toFixed(2)}s`;

          // Аватарка: пробуем загрузить с tgstat по handle
          const handle = a.handle.replace(/^@/, '');
          const photoSrc = `https://t.me/i/userpic/320/${handle}.jpg`;

          item.innerHTML = `
            <img class="artist-photo" src="${photoSrc}" alt="${handle}"
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2246%22 height=%2246%22><circle cx=%2223%22 cy=%2223%22 r=%2223%22 fill=%22%23e0e4f0%22/><text x=%2250%25%22 y=%2254%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%239098b4%22>${handle.charAt(0).toUpperCase()}</text></svg>'">
            <div class="text">
              <span class="channel_name" id="cn-${a.id}">@${handle}</span>
              <div class="open_date">${a.since} · @${handle}</div>
            </div>
            <span class="artist-chevron">›</span>
          `;
          list.appendChild(item);

          // Пробуем подтянуть живое имя канала через виджет TG
          // (работает если сервер отдаёт CORS — на GitHub Pages обычно ок)
          fetchChannelTitle(handle, a.id);
        });
      })
      .catch(() => {
        list.innerHTML = '<p style="color:var(--t3);padding:12px 2px;font-size:13px;">Не удалось загрузить список.</p>';
      });
  }

  /* Пробуем получить название канала.
     Telegram отдаёт og:title в meta при запросе страницы.
     Работает через сторонний CORS-proxy или нативно на сервере.
     На GitHub Pages — fetch напрямую не пройдёт из-за CORS,
     поэтому пробуем и молча фейлим если не получилось. */
  function fetchChannelTitle (handle, id) {
    const proxy = `https://corsproxy.io/?url=${encodeURIComponent(`https://t.me/${handle}`)}`;
    fetch(proxy, { cache: 'force-cache' })
      .then(r => r.text())
      .then(html => {
        const m = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
                 || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
        if (m && m[1]) {
          const el = document.getElementById(`cn-${id}`);
          if (el) el.textContent = m[1].trim();
        }
      })
      .catch(() => {}); // silently ignore — fallback уже @handle
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setActiveNav();
    addHaptics();
    renderArtists();
  });
})();
