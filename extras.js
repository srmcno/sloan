/* Extras shared by all three archives:
   - Listen: reads a story aloud with the browser's own voice, paragraph by paragraph.
   - Surprise me: opens a random story.
   - Keyboard shortcuts, with a help sheet on "?".
   - Evidence badges explain themselves when tapped.
   - Back to top on long pages.
   Nothing here changes the research data; it only reads the page. */
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('extras.' + k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('extras.' + k, v); } catch { /* private mode */ } }
  };
  const app = () => window.ArchiveApp || { stories: [], evidence: {} };
  const onStory = () => location.hash.startsWith('#/story/');

  /* ---------- Surprise me ---------- */
  function randomStory() {
    const list = app().stories;
    if (!list.length) return;
    const here = decodeURIComponent((location.hash.match(/^#\/story\/([^/]+)/) || [])[1] || '');
    let pick = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && pick.id === here) pick = list[(list.indexOf(pick) + 1) % list.length];
    location.hash = '#/story/' + encodeURIComponent(pick.id);
  }
  const dice = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/></svg>';
  function addSurprise() {
    const spots = [$('#v-home .cta'), $('#v-stories .story-results-bar')];
    spots.forEach(spot => {
      if (!spot || spot.querySelector('.surprise')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn surprise';
      b.innerHTML = dice + '<span>Surprise me</span>';
      b.title = 'Open a random story (shortcut: R)';
      b.onclick = randomStory;
      spot.append(b);
    });
  }

  /* ---------- Listen ---------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let fails = 0;
  const say = t => { const st = $('#storyBody .link-status'); if (st) st.textContent = t; };
  let queue = [], qi = 0, speaking = false, paused = false, activeEl = null, listenBtn = null, stopBtn = null, rateSel = null;
  const rates = [['0.8', 'Slower'], ['1', 'Normal'], ['1.2', 'Faster'], ['1.5', 'Fastest']];
  const clean = t => t.replace(/\s+/g, ' ').replace(/\[(\d+)\]/g, '').trim();
  function chunks(text) {
    const parts = text.match(/[^.!?;]+[.!?;]+["”’)]*\s*|[^.!?;]+$/g) || [text];
    const out = []; let cur = '';
    parts.forEach(p => { if ((cur + p).length > 220 && cur) { out.push(cur); cur = p; } else cur += p; });
    if (cur.trim()) out.push(cur);
    return out.map(clean).filter(Boolean);
  }
  function storyParts() {
    const body = $('#storyBody');
    if (!body) return [];
    const els = [body.querySelector('h1'), body.querySelector('.hook'),
      ...body.querySelectorAll(':scope > p:not(.hook):not(.story-subject):not(#reading-notice):not(.link-status), :scope > blockquote')];
    const parts = [];
    els.filter(Boolean).forEach(el => {
      const text = clean(el.innerText || el.textContent || '');
      if (text.length > 1) chunks(text).forEach(c => parts.push({ el, text: c }));
    });
    return parts;
  }
  function mark(el) {
    if (activeEl === el) return;
    if (activeEl) activeEl.classList.remove('speaking');
    activeEl = el;
    if (el) {
      el.classList.add('speaking');
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function pickVoice() {
    const vs = synth.getVoices();
    const want = (document.documentElement.lang || 'en').slice(0, 2);
    return vs.find(v => v.lang && v.lang.startsWith(want) && /natural|neural|premium|enhanced/i.test(v.name))
      || vs.find(v => v.lang && v.lang.startsWith(want) && v.default)
      || vs.find(v => v.lang && v.lang.startsWith(want)) || null;
  }
  function speakNext() {
    if (!speaking) return;
    if (qi >= queue.length) { stopListening(); return; }
    const part = queue[qi];
    const u = new SpeechSynthesisUtterance(part.text);
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = +store.get('rate', '1') || 1;
    u.onstart = () => { fails = 0; mark(part.el); };
    u.onend = () => { if (speaking && !paused) { qi++; speakNext(); } };
    u.onerror = e => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      if (++fails > 1 || /synthesis-failed|not-allowed|audio-hardware|voice-unavailable|synthesis-unavailable/.test(e.error)) {
        stopListening();
        say(e.error === 'not-allowed' ? 'Tap Listen again to start reading aloud.' : 'This browser has no voice for reading aloud. Try another browser or your device\u2019s reading settings.');
        return;
      }
      qi++; speakNext();
    };
    u.onboundary = () => { fails = 0; };
    synth.speak(u);
  }
  function syncListen() {
    if (!listenBtn) return;
    listenBtn.querySelector('span').textContent = !speaking ? 'Listen' : paused ? 'Resume' : 'Pause';
    listenBtn.setAttribute('aria-pressed', String(speaking && !paused));
    stopBtn.hidden = !speaking;
  }
  function startListening(fromEl) {
    queue = storyParts();
    if (!queue.length) return;
    qi = 0;
    if (fromEl) { const k = queue.findIndex(p => p.el === fromEl); if (k > 0) qi = k; }
    synth.cancel();
    fails = 0; say('');
    speaking = true; paused = false;
    speakNext(); syncListen();
  }
  function togglePause() {
    if (!speaking) { startListening(); return; }
    if (paused) {
      paused = false;
      // Resuming a cancelled utterance is unreliable across browsers; restart the current chunk.
      synth.cancel(); speakNext();
    } else {
      paused = true; synth.cancel();
    }
    syncListen();
  }
  function stopListening() {
    speaking = false; paused = false;
    if (synth) synth.cancel();
    mark(null); syncListen();
  }
  function addListen() {
    if (!synth || !onStory()) return;
    const tools = $('#storyBody .readtools');
    if (!tools || tools.querySelector('.listen')) return;
    listenBtn = document.createElement('button');
    listenBtn.type = 'button';
    listenBtn.className = 'btn listen';
    listenBtn.title = 'Read this story aloud (shortcut: L)';
    listenBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Listen</span>';
    listenBtn.setAttribute('aria-pressed', 'false');
    listenBtn.onclick = togglePause;
    stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'btn listen-stop';
    stopBtn.textContent = 'Stop';
    stopBtn.hidden = true;
    stopBtn.onclick = stopListening;
    rateSel = document.createElement('select');
    rateSel.className = 'filter listen-rate';
    rateSel.setAttribute('aria-label', 'Reading speed');
    rateSel.innerHTML = rates.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
    rateSel.value = store.get('rate', '1');
    rateSel.onchange = () => { store.set('rate', rateSel.value); if (speaking && !paused) { synth.cancel(); speakNext(); } };
    const time = tools.querySelector('.reading-time');
    (time ? time.after.bind(time) : tools.prepend.bind(tools))(listenBtn, stopBtn, rateSel);
  }

  // Tap a paragraph while listening to jump there (one delegated listener for the page).
  document.addEventListener('click', e => {
    if (!speaking) return;
    const p = e.target.closest && e.target.closest('#storyBody > p, #storyBody > blockquote');
    if (p && !e.target.closest('a,button')) startListening(p);
  });

  /* ---------- Evidence badges ---------- */
  // Same wording as the About page, so the explanation never claims more than the grade means.
  const EVIDENCE = {
    proven: 'An original record names it.',
    probable: 'A good secondary source that agrees with the records.',
    lead: 'A family claim or copied-tree link no record has confirmed. Treat it with care.'
  };
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function showPop(badge) {
    const kind = ['proven', 'probable', 'lead'].find(k => badge.classList.contains(k));
    if (!kind) return;
    closePop();
    pop = document.createElement('div');
    pop.className = 'ev-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'What "' + kind + '" means');
    pop.innerHTML = `<b class="badge ${kind}">${kind}</b><p>${EVIDENCE[kind]}</p><a href="#/about">How the evidence is graded</a>`;
    document.body.append(pop);
    const r = badge.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    pop.style.width = w + 'px';
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) + 'px';
    const below = r.bottom + 8 + pop.offsetHeight < innerHeight - 80;
    pop.style.top = (below ? r.bottom + 8 : Math.max(12, r.top - pop.offsetHeight - 8)) + scrollY + 'px';
    pop.querySelector('a').focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    if (pop && !pop.contains(e.target)) closePop();
    const badge = e.target.closest('.badge.proven, .badge.probable, .badge.lead');
    if (!badge || badge.closest('a, .ev-pop')) return;
    e.preventDefault();
    showPop(badge);
  });
  function decorateBadges() {
    $$('.badge.proven, .badge.probable, .badge.lead').forEach(b => {
      if (b.closest('a, .ev-pop') || b.hasAttribute('tabindex')) return;
      b.tabIndex = 0;
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', 'Evidence: ' + b.textContent.trim() + '. What does this mean?');
    });
  }
  document.addEventListener('keydown', e => {
    const b = e.target.closest && e.target.closest('.badge[role=button]');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showPop(b); }
  });

  /* ---------- Back to top ---------- */
  const top = document.createElement('button');
  top.type = 'button';
  top.className = 'scroll-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  top.hidden = true;
  top.onclick = () => {
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const h = $$('.view:not([hidden]) h1')[0];
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  document.body.append(top);
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { top.hidden = scrollY < innerHeight * 1.5; ticking = false; });
  }, { passive: true });

  /* ---------- Keyboard shortcuts ---------- */
  const goto = { h: '#/', s: '#/stories', t: '#/tree', p: '#/people', f: '#/photos', r: '#/records', l: '#/timeline', a: '#/about', v: '#/stories/saved' };
  const keys = [
    ['/', 'Search the archive'], ['R', 'Open a random story'], ['L', 'Listen to the story (on a story page)'],
    ['N / P', 'Next or previous story'], ['G then H', 'Home'], ['G then S', 'Stories'], ['G then T', 'Family tree'],
    ['G then P', 'People'], ['G then F', 'Photos'], ['G then R', 'Records'], ['G then L', 'Timeline'], ['G then V', 'Saved stories'],
    ['?', 'Show this list'], ['Esc', 'Close a window or panel']
  ];
  let help = null;
  function openHelp() {
    if (!help) {
      help = document.createElement('dialog');
      help.className = 'keys-help';
      help.setAttribute('aria-label', 'Keyboard shortcuts');
      help.innerHTML = `<h2>Keyboard shortcuts</h2><dl>${keys.map(([k, t]) => `<div><dt>${k.split(' ').map(x => x === 'then' || (x === '/' && k !== '/') ? `<span>${x}</span>` : `<kbd>${x}</kbd>`).join(' ')}</dt><dd>${t}</dd></div>`).join('')}</dl><form method="dialog"><button class="btn primary">Close</button></form>`;
      document.body.append(help);
    }
    if (!help.open) help.showModal();
  }
  let gPending = 0;
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (help && help.open) return;
    if (document.body.classList.contains('modal-open') || document.body.classList.contains('tree-focus-open') || document.querySelector('dialog[open]')) return;
    const k = e.key;
    if (k === 'Escape') { closePop(); return; }
    if (gPending && Date.now() - gPending < 1500) {
      gPending = 0;
      const dest = goto[k.toLowerCase()];
      if (dest) { e.preventDefault(); location.hash = dest; }
      return;
    }
    if (k === '/') { const q = $('#q'); if (q) { e.preventDefault(); q.focus(); q.select(); } }
    else if (k === '?') { e.preventDefault(); openHelp(); }
    else if (k === 'g' || k === 'G') gPending = Date.now();
    else if (k === 'r' || k === 'R') { e.preventDefault(); randomStory(); }
    else if ((k === 'l' || k === 'L') && onStory() && listenBtn) { e.preventDefault(); togglePause(); }
    else if ((k === 'n' || k === 'N') && onStory()) { const a = $('#storyBody .pager a.next'); if (a) { e.preventDefault(); a.click(); } }
    else if ((k === 'p' || k === 'P') && onStory()) { const a = $('#storyBody .pager a:not(.next)'); if (a) { e.preventDefault(); a.click(); } }
  });
  function addHelpLink() {
    const bar = $('.footer-bottom');
    if (!bar || bar.querySelector('.keys-link') || matchMedia('(pointer: coarse)').matches) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'keys-link'; b.textContent = 'Keyboard shortcuts';
    b.onclick = openHelp;
    bar.append(b);
  }

  /* ---------- Read markers ---------- */
  const readKey = () => 'read.' + ((window.SITE && SITE.id) || 'archive');
  let readSet;
  try { readSet = new Set(JSON.parse(store.get(readKey(), '[]'))); } catch { readSet = new Set(); }
  function noteRead() {
    const m = location.hash.match(/^#\/story\/([^/]+)/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (readSet.has(id)) return;
    readSet.add(id);
    store.set(readKey(), JSON.stringify([...readSet].slice(-3000)));
  }
  function markCards() {
    $$('a.scard[href^="#/story/"]').forEach(a => {
      const id = decodeURIComponent(a.getAttribute('href').slice(8));
      const done = readSet.has(id);
      if (done === a.hasAttribute('data-read')) return;
      a.toggleAttribute('data-read', done);
      const meta = a.querySelector('.meta');
      if (done && meta && !meta.querySelector('.read-mark')) meta.insertAdjacentHTML('beforeend', '<span class="read-mark">Read</span>');
    });
    const bar = $('#v-stories .story-results-bar');
    if (bar && !$('#v-stories').hidden) {
      const total = app().stories.length;
      const n = app().stories.filter(x => readSet.has(x.id)).length;
      let el = bar.parentElement.querySelector('.read-progress-note');
      if (!el) { el = document.createElement('p'); el.className = 'read-progress-note'; bar.after(el); }
      if (el.dataset.n === String(n)) return;
      el.dataset.n = String(n);
      el.hidden = !n;
      el.innerHTML = n ? `<span>You have read <b>${n}</b> of ${total} stories on this device.</span><span class="read-meter" aria-hidden="true"><i style="width:${Math.max(2, Math.round(n / total * 100))}%"></i></span>` : '';
    }
  }

  /* ---------- wiring ---------- */
  function refresh() {
    noteRead();
    markCards();
    addSurprise();
    addListen();
    decorateBadges();
  }
  addEventListener('hashchange', () => {
    stopListening(); closePop();
    listenBtn = null;
    setTimeout(refresh, 0);
  });
  addEventListener('pagehide', stopListening);
  const boot = () => { refresh(); addHelpLink(); };
  if (window.ArchiveApp) boot(); else document.addEventListener('archive:ready', boot, { once: true });
  // Person panels and filtered lists render later; keep badges explainable there too.
  new MutationObserver(() => { clearTimeout(window.__extrasT); window.__extrasT = setTimeout(() => { decorateBadges(); addListen(); markCards(); }, 120); })
    .observe(document.body, { childList: true, subtree: true });
})();
