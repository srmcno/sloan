/* A chronological view of existing, published events; no dates are inferred. */
window.ArchiveTimeline = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const year = event => Number(String(event.year).match(/\d{4}/)?.[0]);
  const chronological = events => events.filter(event => Number.isFinite(year(event))).slice().sort((a, b) => year(a) - year(b));
  function preview(container, events) {
    const sorted = chronological(events);
    const picks = [...new Set([0, Math.floor((sorted.length - 1) / 2), sorted.length - 1])].map(i => sorted[i]).filter(Boolean);
    container.innerHTML = `<ol class="timeline-preview">${picks.map(event => `<li><time>${esc(event.year)}</time><p>${esc(event.text)}</p></li>`).join('')}</ol>`;
  }
  function init({container, events, sides, onOpen}) {
    const sorted = chronological(events);
    let side = 'all';
    const centuries = [...new Set(sorted.map(event => Math.floor(year(event) / 100) * 100))];
    container.innerHTML = `<div class="chips" aria-label="Filter timeline by family side">${[['all','Both sides'],...sides].map(([key,label]) => `<button class="chip" type="button" data-time-side="${esc(key)}" aria-pressed="${key === side}">${esc(label)}</button>`).join('')}</div><div class="timeline-tools"><label for="timeline-search">Search the timeline<input id="timeline-search" type="search" placeholder="Name, place or event" autocomplete="off"></label><label for="timeline-era">Years<select id="timeline-era"><option value="all">All years</option>${centuries.map(c => `<option value="${c}">${c}–${c + 99}</option>`).join('')}</select></label><label for="timeline-order">Order<select id="timeline-order"><option value="oldest">Oldest first</option><option value="newest">Newest first</option></select></label></div><div class="timeline-summary"><p id="timeline-count" role="status" aria-live="polite"></p><button class="timeline-reset" type="button" hidden>Clear filters</button><label>Jump to decade <select id="timeline-jump"><option value="">Choose a decade</option></select></label></div><ol class="archive-timeline" id="timeline-events"></ol>`;
    const query = container.querySelector('#timeline-search'), era = container.querySelector('#timeline-era'), order = container.querySelector('#timeline-order'), jump = container.querySelector('#timeline-jump'), reset = container.querySelector('.timeline-reset');
    function render() {
      const terms = fold(query.value).trim().split(/\s+/).filter(Boolean);
      const filtered = sorted.filter(event => (side === 'all' || event.side === side) && (era.value === 'all' || Math.floor(year(event) / 100) * 100 === Number(era.value)) && terms.every(term => fold([event.year, event.text, event.search].join(' ')).includes(term)));
      if (order.value === 'newest') filtered.reverse();
      container.querySelector('#timeline-count').textContent = `${filtered.length} of ${sorted.length} events${filtered.length ? ` · ${filtered[0].year}–${filtered.at(-1).year}` : ''}`;
      reset.hidden = side === 'all' && !terms.length && era.value === 'all' && order.value === 'oldest';
      container.querySelectorAll('[data-time-side]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.timeSide === side)));
      const decades = [...new Set(filtered.map(event => Math.floor(year(event) / 10) * 10))];
      jump.innerHTML = '<option value="">Choose a decade</option>' + decades.map(d => `<option value="${d}">${d}s</option>`).join('');
      jump.disabled = !filtered.length;
      let previous = null;
      container.querySelector('#timeline-events').innerHTML = filtered.map(event => {
        const decade = Math.floor(year(event) / 10) * 10;
        const heading = decade !== previous ? `<li class="archive-decade" id="timeline-decade-${decade}">${decade}s</li>` : '';
        previous = decade;
        const label = sides.find(([key]) => key === event.side)?.[1] || '';
        const action = event.href ? `<a class="archive-read" href="${esc(event.href)}">Read the story <span aria-hidden="true">→</span></a>` : event.person ? `<button class="archive-read" type="button" data-time-person="${esc(event.person)}">Open person and story <span aria-hidden="true">→</span></button>` : '';
        return heading + `<li class="archive-event"${event.color ? ` style="--event-color:${esc(event.color)}"` : ''}><time class="archive-year">${esc(event.year)}</time><div class="archive-event-copy"><span class="archive-side">${esc(label)}</span><p>${esc(event.text)}</p>${action}</div>${event.image ? `<img src="${esc(event.image)}" alt="" loading="lazy">` : ''}</li>`;
      }).join('') || '<li class="timeline-empty">No events match these filters. Try another name or clear the filters.</li>';
    }
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-time-side]');
      if (button) { side = button.dataset.timeSide; render(); }
      const person = event.target.closest('[data-time-person]');
      if (person && onOpen) onOpen(person.dataset.timePerson);
    });
    query.addEventListener('input', render);
    era.addEventListener('change', render);
    order.addEventListener('change', render);
    reset.addEventListener('click', () => { side = 'all'; query.value = ''; era.value = 'all'; order.value = 'oldest'; render(); query.focus(); });
    jump.addEventListener('change', () => {
      const heading = container.querySelector(`#timeline-decade-${jump.value}`);
      if (heading) { heading.tabIndex = -1; heading.scrollIntoView({block:'start'}); heading.focus({preventScroll:true}); }
    });
    render();
    return {render};
  }
  return {init, preview};
})();
