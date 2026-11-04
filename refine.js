/* Refinements shared by all three archives.
   On phones, filter panels (Photos, Records, Stories, Timeline) collapse behind one
   "Filters" button that shows how many filters are active; search stays visible. */
(() => {
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
  let uid = 0;
  const updaters = [];
  const updateAll = () => updaters.forEach(u => u());

  function activeCount(scope) {
    let n = 0;
    scope.querySelectorAll('button[aria-pressed="true"]').forEach(b => {
      const v = Object.entries(b.dataset).find(([k]) => k.startsWith('gallery') || k.startsWith('time') || k === 'f');
      if (v && v[1] !== 'all') n++;
    });
    scope.querySelectorAll('select').forEach(s => { if (s.selectedIndex > 0) n++; });
    return n;
  }

  function makeToggle(target, collapsedClass, countScope) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filter-toggle';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', target.id || (target.id = 'refine-filters-' + (++uid)));
    b.innerHTML = `${icon}<span>Filters</span><span class="count"></span>`;
    const update = () => {
      const n = activeCount(countScope());
      b.querySelector('.count').textContent = n ? String(n) : '';
      b.setAttribute('aria-label', n ? `Filters, ${n} active` : 'Filters');
    };
    b.addEventListener('click', () => {
      const open = target.classList.toggle(collapsedClass) === false;
      b.setAttribute('aria-expanded', String(open));
    });
    updaters.push(update);
    target.classList.add(collapsedClass);
    update();
    return b;
  }

  function enhance() {
    // Photos and Records
    document.querySelectorAll('.gallery-controls:not([data-refined])').forEach(c => {
      const search = c.querySelector('.gallery-search');
      if (!search || !c.querySelector('.gallery-filter-group')) return;
      c.dataset.refined = '1';
      search.after(makeToggle(c, 'refine-collapsed', () => c));
    });
    // Timeline
    document.querySelectorAll('.timeline-tools:not([data-refined])').forEach(t => {
      if (t.children.length < 2) return;
      t.dataset.refined = '1';
      const wrap = t.parentElement;
      t.after(makeToggle(t, 'refine-collapsed', () => wrap));
    });
    // Stories
    const opts = document.querySelector('#v-stories .story-options:not([data-refined])');
    if (opts) {
      opts.dataset.refined = '1';
      const view = document.getElementById('v-stories');
      const row = document.createElement('div');
      row.className = 'refine-toggle-row';
      row.append(makeToggle(view, 'refine-stories-collapsed', () => opts));
      opts.before(row);
    }
  }

  // Filters also change outside their panels (Clear filters, links that open a topic),
  // so recount every badge after any click, change or navigation.
  const later = () => setTimeout(updateAll, 60);
  document.addEventListener('click', later, true);
  document.addEventListener('change', later, true);
  window.addEventListener('hashchange', later);

  const start = () => {
    enhance();
    new MutationObserver(() => enhance()).observe(document.body, { childList: true, subtree: true });
    // The app may apply a filter from the address after the controls exist.
    [300, 1200].forEach(ms => setTimeout(updateAll, ms));
  };
  window.addEventListener('load', later);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* Phone conveniences shared by all three archives:
   swipe through photographs, the phone's own share sheet, and a browser bar that
   matches the site's color. */
(() => {
  const coarse = matchMedia('(pointer:coarse)').matches;
  const canShare = typeof navigator.share === 'function';

  // Browser bar color follows the header color of the site and theme.
  const setThemeColor = () => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.append(meta); }
    const c = getComputedStyle(document.documentElement).getPropertyValue('--navy').trim();
    if (c) meta.content = c;
  };
  setThemeColor();
  new MutationObserver(setThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-site'] });

  // Share: on phones that offer a share sheet, "Copy link" becomes "Share".
  if (coarse && canShare) {
    const relabel = () => document.querySelectorAll('[data-copy-link]:not([data-share-ready])').forEach(b => {
      b.dataset.shareReady = '1';
      if (/copy/i.test(b.textContent)) b.textContent = b.textContent.replace(/Copy( profile)? link/i, (m, p) => p ? 'Share profile' : 'Share');
    });
    relabel();
    new MutationObserver(relabel).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', async e => {
      const b = e.target.closest('[data-copy-link]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const title = (document.querySelector('#v-story h1, .panel.on h2, .panel.on h1')?.textContent || document.title).trim();
      try { await navigator.share({ title, text: title, url: b.dataset.copyLink }); }
      catch (err) { if (err && err.name !== 'AbortError') { try { await navigator.clipboard.writeText(b.dataset.copyLink); b.textContent = 'Link copied'; } catch {} } }
    }, true);
  }

  // Photo viewer: swipe left or right for the next or previous photo, down to close.
  const lb = document.getElementById('lb');
  if (lb) {
    let x0 = 0, y0 = 0, t0 = 0, tracking = false;
    lb.addEventListener('touchstart', e => {
      if (e.touches.length !== 1 || e.target.closest('.photo-compare, input, [role=slider]')) { tracking = false; return; }
      tracking = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (!tracking) return; tracking = false;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Date.now() - t0 > 700) return;
      const visible = el => el && !el.hidden && !el.closest('[hidden]') && el.offsetParent !== null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        const step = lb.querySelector(`[data-photo-step="${dx < 0 ? 1 : -1}"]`);
        if (visible(step) && !step.disabled) step.click();
      } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.6 && (lb.scrollTop || 0) <= 0) {
        document.getElementById('lbx')?.click();
      }
    }, { passive: true });
  }
})();
