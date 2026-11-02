/* Reads the Moffitt & Thompson archive (data.json + tree.json) into the shared model used by app.js:
   T = {root, people:{id:{n,g,s,x,b,bp,d,dp,lv,f,m,sp,ch,ph,gen,side,ev,note,img,profile}}}
   C = {hero, grandparents, stories, timeline, fixes, restorations, archivePhotos, lines}
   The published data files are read as-is; nothing here changes them. */
export function adaptFamily(D, tree) {
  const ALL = [...(D.P || []), ...(D.EXTRA || [])];
  const byId = Object.fromEntries(ALL.map(x => [x.id, x]));
  // Keep old story URLs and tree associations usable after overlapping stories merge.
  const rawAliases = D.STORY_ALIASES || {};
  const storyAliases = Object.fromEntries(Object.entries(rawAliases).filter(([oldId, newId]) =>
    oldId !== newId && byId[oldId] && byId[newId] && !rawAliases[newId]));
  const canonical = id => storyAliases[id] || id;
  const SIDE = { thompson: 'N', hulsey: 'N', moffitt: 'J', smith: 'J' };
  const PH = D.PH || {};
  const best = v => v && (v.o || v.r || v.c);

  /* ---------- photographs and their restored editions ---------- */
  const restorations = {};
  for (const v of Object.values(PH)) {
    if (!v?.o) continue;
    if (v.r || v.c) restorations[v.o] = { s: v.r || undefined, colorized: v.c || undefined, note: v.note || '', source: v.source || '', method: v.interpretation ? 'Photographic interpretation.' : '', labels: v.labels || {}, edit_note: v.edit_note || '' };
  }
  const photoSources = { ...(D.PHOTO_SOURCES || {}), ...Object.fromEntries(Object.values(PH).filter(v => v?.o && v.source).map(v => [v.o, { url: v.source }])) };
  const portraitKeys = e => [...new Set([e.ph, ...(e.photo_sets || [])].filter(k => k && PH[k]))];
  const portraitOf = e => { const k = portraitKeys(e)[0]; return k ? PH[k].o : (e.av ? 'img/' + e.av : ''); };

  /* ---------- people ---------- */
  const ROOT = 'ROOT';
  const src = tree?.people || {};
  const people = {};
  for (const [id, p] of Object.entries(src)) {
    const e = p.a ? byId[p.a] : null;
    people[id] = {
      n: p.n, g: p.g, s: p.s, x: p.x, b: p.b || '', bp: p.bp || '', d: p.d || '', dp: p.dp || '', lv: !!p.lv,
      f: p.f || null, m: p.m || null, sp: [], ch: [], gen: p.gen == null ? null : p.gen + 1,
      ph: [], ev: p.ev || e?.ev || 'tree', note: p.note || '', source_urls: p.source_urls || [],
      img: e && !p.noPortrait ? portraitOf(e) : '', noPortrait: !!p.noPortrait, entry: e?.id || null, kv: e?.kv || []
    };
  }
  const roots = tree?.roots || {};
  people[ROOT] = { n: window.SITE?.rootName || 'Our generation', g: '', s: '', x: '', lv: true, label: 'Our generation',
    f: roots.father || null, m: roots.mother || null, sp: [], ch: [], gen: 0, ph: [], ev: 'tree', note: '', img: '', virtual: true };
  for (const [id, p] of Object.entries(people)) {
    for (const par of [p.f, p.m]) if (par && people[par] && id !== ROOT) people[par].ch.push(id);
    if (p.f && p.m && people[p.f] && people[p.m]) {
      if (!people[p.f].sp.includes(p.m)) people[p.f].sp.push(p.m);
      if (!people[p.m].sp.includes(p.f)) people[p.m].sp.push(p.f);
    }
  }
  // side: Dad's line J, Mom's line N
  const mark = (id, side, seen = new Set()) => { const p = people[id]; if (!p || seen.has(id)) return; seen.add(id); if (!p.side) p.side = side; mark(p.f, side, seen); mark(p.m, side, seen); };
  mark(roots.father, 'J'); mark(roots.mother, 'N');
  for (const p of Object.values(people)) p.side ||= '';
  const linked = {};
  for (const [id, p] of Object.entries(people)) if (p.entry) (linked[canonical(p.entry)] ||= []).push(id);

  /* ---------- stories (titled entries) and profiles (untitled entries) ---------- */
  const relGen = rel => {
    const r = String(rel || '').toLowerCase();
    if (/^grand(father|mother|parent)/.test(r)) return 2;
    const m = r.match(/(\d+)(?:st|nd|rd|th)\s+great-grand/); if (m) return +m[1] + 2;
    if (/^great-grand/.test(r)) return 3;
    return null;
  };
  const ranks = new Map();
  (D.ORDER || []).forEach((id, index) => { const key = canonical(id); if (!ranks.has(key)) ranks.set(key, index); });
  const rank = id => ranks.get(id) ?? 9999;
  const isRecordImg = (s, cap = '', kind = '') => kind === 'record' || /img\/(rec|docs|news|books|stones)\/|dawes|draft|census|codetalker|wpa_|hinshaw|nordyke_perkins|pension|headstone|gravestone|(?:^|[\/_-])grave(?:[\/_\-.]|$)/i.test(s) || /\b(?:map|maps|plat)\b/i.test(cap);
  const isPlaceImg = (s, cap = '', kind = '') => !isRecordImg(s, cap, kind) && !/\bportrait\b/i.test(cap) && /img\/places\/|courthouse|plaque|battleground|battlefield|hugo_|frisco|uss[_-]|ship|wasp|street|depot|church|mill|school|town|capitol|meeting ?house|marker/i.test(s + ' ' + cap);
  const archivePhotos = [];
  const stories = ALL.filter(e => !storyAliases[e.id]).map(e => {
    const ids = linked[e.id] || [];
    const gen = e.gen != null ? e.gen + 2 : ids.length ? Math.min(...ids.map(id => people[id].gen ?? 99)) : relGen(e.rel) ?? 9;
    const imgs = (e.imgs || []).map(i => ({ s: i.s, cap: i.cap || e.name, kind: i.kind }));
    for (const k of portraitKeys(e).reverse()) {
      if (PH[k].o && !imgs.some(i => i.s === PH[k].o)) imgs.unshift({ s: PH[k].o, cap: PH[k].cap || e.name, kind: 'photo' });
    }
    imgs.forEach(i => { if (isPlaceImg(i.s, i.cap, i.kind) && !archivePhotos.some(a => a.s === i.s)) { const url = photoSources[i.s]?.url || ''; archivePhotos.push({ s: i.s, cap: i.cap, story: e.title ? e.id : '', side: SIDE[e.branch] || '', source: /^https?:\/\/\S+$/i.test(url) ? url : '' }); } });
    const src = [e.src, e.source_link && !String(e.src || '').includes(e.source_link) ? e.source_link : ''].filter(Boolean);
    return {
      id: e.id, side: SIDE[e.branch] || '', gen, ev: e.ev || 'tree',
      title: e.title || e.name, hook: e.hook || e.place || e.rel || '', profile: !e.title,
      people: ids, subject: { name: e.name, rel: e.rel || '', years: e.years || '' },
      body: e.body || [], quotes: e.quotes || [], src, imgs, tags: e.tags || [], kv: e.kv || [], note: e.note || '', place: e.place || '',
      rank: rank(e.id)
    };
  }).sort((a, b) => a.rank - b.rank);
  for (const s of stories) for (const id of s.people) {
    const p = people[id];
    if (!p.img && !p.noPortrait) { const im = s.imgs.find(i => !isRecordImg(i.s, i.cap, i.kind) && !isPlaceImg(i.s, i.cap, i.kind)); if (im) p.img = im.s; }
  }

  /* ---------- home page ---------- */
  const ownerOf = k => ALL.find(e => portraitKeys(e).includes(k));
  const hero = (window.SITE?.heroKeys || D.PHOTO_ORDER || Object.keys(PH)).filter(k => PH[k]?.o).map(k => { const o = ownerOf(k); return { s: PH[k].o, cap: PH[k].cap || o?.name || '', story: o?.id || '' }; });
  const f = people[roots.father] || {}, m = people[roots.mother] || {};
  const gpIds = [[f.f, 'Grandfather', 'J'], [f.m, 'Grandmother', 'J'], [m.f, 'Grandfather', 'N'], [m.m, 'Grandmother', 'N']];
  const grandparents = gpIds.filter(([id]) => id && people[id]).map(([id, role, side]) => {
    const e = people[id].entry ? byId[people[id].entry] : null;
    return { id, role, side, img: people[id].img || '', lede: e?.hook || e?.place || '', story: e?.id || '' };
  });
  const timeline = (D.TIMELINE || []).map(t => ({ y: t.y, t: t.t, side: SIDE[t.b] || '', story: canonical(t.p || '') }));
  return { T: { root: ROOT, people }, C: { hero, grandparents, stories, storyAliases, timeline, fixes: [], restorations, archivePhotos, photoSources } };
}
