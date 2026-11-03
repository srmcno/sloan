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
