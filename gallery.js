/* Photographs and documents have separate collections and independent filters. */
export function initGallery({ photos, C, esc, restored, lightbox }) {
  const photoSection = document.querySelector('#v-photos');
  if (!photoSection) throw new Error('The photograph collection is missing.');
  const recordsSection = document.createElement('section');
  recordsSection.className = 'view gallery-collection';
  recordsSection.id = 'v-records';
  recordsSection.hidden = true;
  recordsSection.innerHTML = '<div class="head"><h1>Records</h1><p>Newspaper clippings, certificates, census pages and other family records.</p></div><div id="record-filters"></div><div class="pgrid" id="record-grid"></div>';
  document.querySelector('main').append(recordsSection);
  photoSection.classList.add('gallery-collection');
  const photoHeading = photoSection.querySelector('h1');
  if (photoHeading) photoHeading.textContent = 'Photos';
  const photoIntro = photoSection.querySelector('.head p');
  if (photoIntro) photoIntro.textContent = 'Family photographs, restored editions and historic views. Open a photograph to compare available versions.';

  const archives = new Map((C.archivePhotos || []).map(x => [x.s, x]));
  const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cleanCaption = value => {
    const text = String(value || '').trim();
    const parts = text.split(/\s+[—–]\s+/);
    const readable = parts.filter(part => !/^(?:[a-f\d]{8,}(?:[_-][\w-]+)?|(?:img|image|photo|dsc|pxl|scan)[_\s-]*\d[\w.\s-]*)(?:\.(?:jpg|jpeg|png))?$/i.test(part));
    const nameOnly = part => fold(part.replace(/["“”].*?["“”]/g, '')).replace(/[^a-z0-9]/g, '');
    if (readable.length === 2 && nameOnly(readable[0]) === nameOnly(readable[1])) readable.pop();
    let title = (readable.join(' — ') || text).replace(/\s+\.(?:jpg|jpeg|png)$/i, '').replace(/\s+/g, ' ');
    if (/^(?:[a-f\d]{8,}|(?:img|image|photo|dsc|pxl|scan)[_\s-]*\d[\w.-]*)(?:\.(?:jpg|jpeg|png))?$/i.test(title)) title = '';
    return title || 'Family collection image';
  };
  const isRecord = photo => {
    if (photo.kind === 'record' || /codetalker.*letter/i.test(photo.s) || /\b(?:map|maps|plat)\b/i.test(photo.c || '')) return true;
    if (/(?:_photo|portrait)[^/]*\.(?:jpe?g|png)$/i.test(photo.s)) return false;
    if (/img\/(?:rec|docs|books|news|stones)\/|dawes_card|draft_|census_|headstone|gravestone|(?:^|[\/_-])grave(?:[\/_\-.]|$)|pension|wpa_interview/i.test(photo.s)) return true;
    if (/\b(?:headstone|gravestone|grave|tombstone)\b/i.test(photo.c || '')) return true;
    if (C.restorations?.[photo.s]) return false;
    const text = photo.c || '';
    if (/deathcert|deathnotice|willsettlement/i.test(text)) return true;
    if (/\b(?:record|testify|will settlement|census|certificate|draft card|registration card|marriage (?:license|record)|death (?:record|index|notice)|birth (?:record|index)|headstone|gravestone|newspaper|clipping|obituary|obit|funeral notice|daily news|daily democrat|courier-gazette|paris news|county times|republican-herald|tribune)\b/i.test(text)) return true;
    if (C.restorations?.[photo.s]) return false;
    return Boolean(photo.news) || /\/news\/.*(?:_obit_|_license_|_census_|_certificate_|_death_|_draft_)/i.test(photo.s);
  };
  const recordType = photo => {
    if (!photo) return 'other';
    const text = photo.c || '';
    if (/headstone|gravestone|grave_|\bgrave\b|tombstone/i.test(photo.s + ' ' + text)) return 'headstones';
    if (/img\/books\//i.test(photo.s)) return 'newspapers';
    if (/dawes_card|draft_|pension/i.test(photo.s)) return 'certificates';
    if (/census_/i.test(photo.s)) return 'census';
    if (/certificate|deathcert|marriage license|birth record|death record|death index|draft card|registration card/i.test(text)) return 'certificates';
    if (/census/i.test(text)) return 'census';
    if (photo.news || /newspaper|clipping|obituary|obit|death\s*notice|funeral notice|daily news|daily democrat|courier-gazette|paris news|county times|republican-herald|tribune/i.test(text)) return 'newspapers';
    return 'other';
  };
  const items = photos.map((photo, index) => {
    const archive = archives.get(photo.s);
    const restoration = C.restorations?.[photo.s];
    const caption = cleanCaption(photo.c || archive?.cap);
    const kind = isRecord(photo) ? 'records' : archive ? 'places' : 'photos';
    const source = archive?.source || photo.source || restoration?.source || '';
    return { ...photo, index, caption, kind, recordType: kind === 'records' ? recordType(photo) : '', archive, restoration, source,
      search: fold([caption, photo.c, archive?.credit, source].filter(Boolean).join(' ')) };
  });
  const safeSource = source => {
    try { const url = new URL(source); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };
  function createCollection({ section, filters, grid, prefix, records }) {
    if (!filters || !grid) throw new Error('A collection container is missing.');
    const collection = items.filter(x => records ? x.kind === 'records' : x.kind !== 'records');
    const searchId = `${prefix}-search`, countId = `${prefix}-count`;
    let side = 'all', type = 'all', query = '';
    const typeOptions = records
      ? [['all', 'All records'], ['newspapers', 'Newspapers and books'], ['certificates', 'Certificates, cards and forms'], ['census', 'Census pages'], ['headstones', 'Headstones'], ['other', 'Other records']]
      : [['all', 'All photographs'], ['photos', 'Family photographs'], ['restored', 'Restored'], ['places', 'Historic places']];
    const chip = (key, label, group) => `<button type="button" class="chip" data-gallery-${group}="${key}" aria-pressed="${key === 'all'}">${label}</button>`;
    filters.classList.add('gallery-controls');
    filters.innerHTML = `<div class="gallery-search"><label for="${searchId}">${records ? 'Search records' : 'Search photographs'}</label><input id="${searchId}" type="search" placeholder="Name, caption or place" autocomplete="off" aria-controls="${grid.id}"></div><fieldset class="gallery-filter-group"><legend>Family side</legend><div class="gallery-chip-row">${[['all','Both sides'],['N',"Mom's side"],['J',"Dad's side"]].map(([k,l]) => chip(k,l,'side')).join('')}</div></fieldset><fieldset class="gallery-filter-group"><legend>${records ? 'Record type' : 'Photograph type'}</legend><div class="gallery-chip-row">${typeOptions.filter(([k]) => k === 'all' || collection.some(x => records ? x.recordType === k : k === 'restored' ? x.restoration : x.kind === k)).map(([k,l]) => chip(k,l,'type')).join('')}</div></fieldset><div class="gallery-summary"><p id="${countId}" class="gallery-count" role="status" aria-live="polite" aria-atomic="true"></p><button type="button" class="gallery-clear" data-gallery-clear hidden>Clear filters</button></div>`;
    grid.classList.add('gallery-grid');
    grid.setAttribute('aria-label', records ? 'Family records and newspaper clippings' : 'Family and historical photographs');
    function reset() {
      side = type = 'all'; query = '';
      filters.querySelector(`#${searchId}`).value = '';
      render();
    }
    function sync() {
      filters.querySelectorAll('[data-gallery-side]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gallerySide === side)));
      filters.querySelectorAll('[data-gallery-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.galleryType === type)));
      filters.querySelector('[data-gallery-clear]').hidden = side === 'all' && type === 'all' && !query;
    }
    function render() {
      const terms = fold(query).split(/\s+/).filter(Boolean);
      const visible = collection.filter(x => (side === 'all' || x.side === side)
        && (type === 'all' || (records ? x.recordType === type : type === 'restored' ? Boolean(x.restoration) : x.kind === type))
        && terms.every(term => x.search.includes(term)));
      const label = records ? 'record' : 'photograph';
      filters.querySelector(`#${countId}`).textContent = `${visible.length} of ${collection.length} ${label}${collection.length === 1 ? '' : 's'}`;
      grid.innerHTML = visible.length ? visible.map(x => {
        const url = safeSource(x.source);
        const kind = x.kind === 'places' ? 'Historic place' : x.kind === 'records' ? 'Record' : 'Photograph';
        const badges = [kind, ...(x.restoration ? ['AI-restored', ...(x.restoration.colorized ? [x.restoration.labels?.c || 'Color version'] : [])] : [])];
        const src = x.restoration ? restored(x.s) : x.t || x.s;
        return `<article class="gallery-card"><button type="button" class="gallery-open" data-gallery-index="${x.index}" aria-label="${esc('Open ' + x.caption)}"><div class="gallery-image"><img src="${esc(src)}" alt="${esc(x.caption)}" loading="lazy" decoding="async"><span class="gallery-fallback" hidden>Preview unavailable<br>Open the original image</span></div><div class="gallery-card-copy"><div class="gallery-badges">${badges.map(b => `<span>${esc(b)}</span>`).join('')}</div><h2>${esc(x.caption)}</h2>${x.side === 'N' || x.side === 'J' ? `<p class="gallery-side">${x.side === 'N' ? "Mom's side" : "Dad's side"}</p>` : ''}</div></button>${x.source ? `<div class="gallery-source">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View source<span class="gallery-sr-only"> for ${esc(x.caption)} (opens in a new tab)</span> ↗</a>` : `<span>${esc(x.source)}</span>`}</div>` : ''}</article>`;
      }).join('') : `<div class="gallery-empty"><h2>No ${records ? 'records' : 'photographs'} match these filters</h2><p>Try another name or caption, choose a different type, or view this whole collection.</p><button type="button" class="btn" data-gallery-reset>Clear filters</button></div>`;
      sync();
    }
    filters.addEventListener('input', event => {
      if (event.target.id !== searchId) return;
      query = event.target.value.trim(); render();
    });
    filters.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-gallery-clear')) { reset(); filters.querySelector(`#${searchId}`).focus(); return; }
      if (button.dataset.gallerySide) side = button.dataset.gallerySide;
      else if (button.dataset.galleryType) type = button.dataset.galleryType;
      else return;
      render();
    });
    grid.addEventListener('click', event => {
      if (event.target.closest('[data-gallery-reset]')) { reset(); filters.querySelector(`#${searchId}`).focus(); return; }
      const button = event.target.closest('[data-gallery-index]');
      if (!button) return;
      const photo = items[Number(button.dataset.galleryIndex)];
      if (photo) lightbox(photo.s, photo.caption, photo.story ? `#/story/${photo.story}` : photo.id ? `#/person/${photo.id}` : '');
    });
    grid.addEventListener('error', event => {
      const img = event.target;
      if (img.tagName !== 'IMG') return;
      const button = img.closest('[data-gallery-index]');
      const photo = items[Number(button?.dataset.galleryIndex)];
      if (photo && !img.dataset.fallbackAttempted && img.getAttribute('src') !== photo.s) {
        img.dataset.fallbackAttempted = 'true'; img.src = photo.s; return;
      }
      img.hidden = true;
      const fallback = img.parentElement.querySelector('.gallery-fallback');
      if (fallback) fallback.hidden = false;
    }, true);
    return render;
  }
  const renderPhotos = createCollection({ section: photoSection, filters: photoSection.querySelector('#phfilters'), grid: photoSection.querySelector('#pgrid'), prefix: 'photo', records: false });
  const renderRecords = createCollection({ section: recordsSection, filters: recordsSection.querySelector('#record-filters'), grid: recordsSection.querySelector('#record-grid'), prefix: 'record', records: true });
  return { renderPhotos, renderRecords, items };
}
