/** Family and place collections use published records, never inferred residence. */
export function initExplore({P,STORIES,C,esc,photo,restored,years,relName,storyCard,SITE}) {
  const TITLE=SITE?.title||'Family history';
  const main=document.querySelector('main');
  const create=id=>{const el=document.createElement('section');el.className='view explore';el.id=id;el.hidden=true;main.append(el);return el};
  const families=create('v-families'),places=create('v-places');
  const historical=Object.entries(P).filter(([,p])=>!p.lv);
  const sideName=s=>s==='N'?"Mom’s side":s==='J'?"Dad’s side":'Family';
  const evidence=p=>({proven:'Documented',probable:'Probable',lead:'Research lead',tree:'From family tree'}[p.ev]||'Evidence not assessed');
  const surname=p=>{let name=String(p.s||'').trim().replace(/,.*$/,'').replace(/\s*\(the immigrant\)/i,'');if(/^(?:lnu|unknown|n\/?a)$/i.test(name))return '';if(/^(?:sr|jr)\.?$/i.test(name))name=String(p.n||'').replace(/\s+(?:sr|jr)\.?$/i,'').split(/\s+/).at(-1)||'';return name.split(/\s+/).map(word=>word===word.toUpperCase()?word.charAt(0)+word.slice(1).toLowerCase():word).join(' ')};
  const groups=new Map();
  historical.forEach(entry=>{const name=surname(entry[1]);if(name){if(!groups.has(name))groups.set(name,[]);groups.get(name).push(entry)}});
  const sorted=[...groups].sort((a,b)=>a[0].localeCompare(b[0]));
  let familySide='all',query='';
  const url=(kind,id)=>`#/${kind}/${encodeURIComponent(id)}`;
  const initials=p=>String(p.n||'?').split(/\s+/).map(w=>w[0]).filter(c=>/[A-Za-z]/.test(c)).slice(0,2).join('');
  const portrait=(p,large=false)=>{const src=photo(p);return `<span class="ex-portrait${large?' ex-portrait-large':''}">${src?`<img src="${esc(restored(src))}" alt="" loading="lazy">`:`<span aria-hidden="true">${esc(initials(p))}</span>`}</span>`};
  const personCard=([id,p],place)=>`<a class="ex-person" href="${url('person',id)}">${portrait(p)}<span class="ex-person-copy"><strong>${esc(p.n)}</strong><span>${esc(years(p))}</span>${place?`<small>${esc(place)}</small><small>${esc(evidence(p))} · ${esc(sideName(p.side))}</small>`:`<small>${esc(relName(id))} · ${esc(evidence(p))}</small>`}</span><span class="ex-arrow" aria-hidden="true">↗</span></a>`;
  const storyList=list=>list.length?`<div class="cards">${list.map(storyCard).join('')}</div>`:'<p class="ex-empty">No story is linked to this collection yet. Individual profiles include the available family details.</p>';
  function related(entries){const ids=new Set(entries.map(([id])=>id));return STORIES.filter(s=>(s.people||[]).some(id=>ids.has(id)))}
  function header(kicker,title,copy){return `<div class="ex-heading"><p class="ex-kicker">${kicker}</p><h1>${esc(title)}</h1><p class="ex-intro">${esc(copy)}</p></div>`}
  function branchCard([name,entries]) {
    const stories=related(entries),photos=entries.filter(([,p])=>photo(p)).slice(0,3),sides=[...new Set(entries.map(([,p])=>p.side).filter(Boolean))];
    return `<a class="ex-branch" href="${url('families',name)}"><div class="ex-branch-top"><span class="ex-kicker">${esc(sides.map(sideName).join(' · '))}</span><span aria-hidden="true">↗</span></div><h2>${esc(name)}</h2><p>${entries.length} ${entries.length===1?'person':'people'}${stories.length?` · ${stories.length} ${stories.length===1?'story':'stories'}`:''}</p><div class="ex-branch-bottom">${photos.length?`<span class="ex-faces">${photos.map(([,p])=>portrait(p)).join('')}</span>`:'<span class="ex-branch-rule" aria-hidden="true"></span>'}<span>Explore branch</span></div></a>`;
  }
  function updateDirectory(){
    const list=sorted.map(([name,entries])=>[name,entries.filter(([,p])=>familySide==='all'||p.side===familySide)]).filter(([name,entries])=>entries.length&&name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    families.querySelector('#ex-family-count').textContent=`${list.length} ${list.length===1?'family name':'family names'}`;
    families.querySelector('#ex-branch-grid').innerHTML=list.map(branchCard).join('')||'<p class="ex-empty">No family name matches. Try another name or choose both sides.</p>';
  }
  function renderFamilies(name){
    if(name)name=surname({s:name,n:name});
    if(name&&groups.has(name)){
      const entries=[...groups.get(name)].sort((a,b)=>(a[1].gen??99)-(b[1].gen??99)||a[1].n.localeCompare(b[1].n));
      const stories=related(entries),docs=entries.filter(([,p])=>p.ev==='proven').length;
      families.innerHTML=`<a class="ex-back" href="#/families">← All family branches</a>${header('Family branch',name,'Follow the people who share this recorded surname and the stories that connect them.')}<div class="ex-summary"><span><b>${entries.length}</b> people</span><span><b>${stories.length}</b> linked stories</span><span><b>${docs}</b> documented profiles</span></div><div class="ex-section-head"><h2>People in this branch</h2><p>A shared surname alone does not establish a family relationship. Open a profile to see parents and children.</p></div><div class="ex-people">${entries.map(e=>personCard(e)).join('')}</div><div class="ex-section-head"><h2>Stories along this branch</h2></div>${storyList(stories)}`;
      document.title=`${name} family · ${TITLE}`;return;
    }
    families.innerHTML=`${name?'<p class="ex-empty">That family name is not in this collection. Browse the names below.</p>':''}${header('Names through generations','Family branches','Start with a familiar name, or discover another branch of the family. These collections bring historical profiles and family stories together.')}<div class="ex-directory-tools"><div class="chips" aria-label="Family side">${[['all','Both sides'],['N',"Mom’s side"],['J',"Dad’s side"]].map(([v,l])=>`<button type="button" class="chip" data-ex-side="${v}" aria-pressed="${familySide===v}">${l}</button>`).join('')}</div><label class="ex-search"><span>Find a family name</span><input type="search" value="${esc(query)}" placeholder="Search family names…" autocomplete="off"></label></div><p class="ex-count" id="ex-family-count" role="status"></p><div class="ex-branches" id="ex-branch-grid"></div>`;
    families.querySelector('input').addEventListener('input',e=>{query=e.target.value;updateDirectory()});
    families.querySelectorAll('[data-ex-side]').forEach(b=>b.addEventListener('click',()=>{familySide=b.dataset.exSide;families.querySelectorAll('[data-ex-side]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));updateDirectory()}));
    updateDirectory();document.title='Family branches · '+TITLE;
  }
  const regions=SITE?.regions||[];
  const normal=t=>String(t||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const matches=(text,r)=>r.terms.some(term=>{const t=normal(text),n=normal(term);let at=t.indexOf(n);while(at!==-1){if((at===0||!/[a-z]/.test(t[at-1]))&&(at+n.length===t.length||!/[a-z]/.test(t[at+n.length])))return true;at=t.indexOf(n,at+1)}return false});
  const records=r=>historical.filter(([,p])=>matches(p.bp,r)||matches(p.dp,r));
  const placeStories=r=>STORIES.filter(s=>matches([s.title,s.hook,...(s.body||[])].join(' '),r));
  const archival=r=>(C.archivePhotos||[]).find(i=>r.archive&&i.s.includes(r.archive));
  function locationText(p,r){return [matches(p.bp,r)&&`Born: ${p.bp}`,matches(p.dp,r)&&`Died: ${p.dp}`].filter(Boolean).join(' · ')}
  function regionCard(r){const people=records(r),stories=placeStories(r),im=archival(r);return `<a class="ex-place-card ${im?'ex-place-with-photo':''}" href="${url('places',r.id)}">${im?`<img src="${esc(restored(im.s))}" alt="" loading="lazy">`:`<div class="ex-place-type" aria-hidden="true">${esc(r.name.split(' ')[0])}</div>`}<div class="ex-place-copy"><p class="ex-kicker">${esc(r.label)}</p><h2>${esc(r.name)}</h2><p>${esc(r.description)}</p><span class="ex-place-stats">${people.length} recorded profiles · ${stories.length} stories <span aria-hidden="true">↗</span></span></div></a>`}
  function renderPlaces(id){
    const r=regions.find(r=>r.id===id);
    if(r){
      const people=records(r).sort((a,b)=>a[1].n.localeCompare(b[1].n)),stories=placeStories(r),im=archival(r);
      places.innerHTML=`<a class="ex-back" href="#/places">← All family places</a>${header(r.label,r.name,r.description)}${im?`<figure class="ex-place-hero"><img src="${esc(restored(im.s))}" alt="${esc(im.cap)}"><figcaption>${esc(im.cap)}${im.source?` <a href="${esc(im.source)}" target="_blank" rel="noopener noreferrer">View archive record ↗</a>`:''}</figcaption></figure>`:''}<div class="ex-section-head"><h2>People with a recorded place here</h2><p>Matched to birth or death places in the family tree. These records do not establish every place a person lived.</p></div>${people.length?`<div class="ex-people">${people.map(e=>personCard(e,locationText(e[1],r))).join('')}</div>`:'<p class="ex-empty">No historical birth or death place is recorded here yet.</p>'}<div class="ex-section-head"><h2>Stories that mention this place</h2><p>Stories may describe relatives, travel or historical context. A mention does not establish residence.</p></div>${storyList(stories)}`;
      document.title=`${r.name} · ${TITLE}`;return;
    }
    places.innerHTML=`${id?'<p class="ex-empty">That place is not in this collection. Explore the regions below.</p>':''}${header('The places behind the names','Family places','Explore the communities and earlier homelands named in the family’s records and stories.')}<div class="ex-place-grid">${regions.filter(r=>records(r).length||placeStories(r).length).map(regionCard).join('')}</div><p class="ex-footnote">Place collections follow the wording in published family records. They are a regional guide, rather than a map of exact addresses. Historical photographs show the setting; unidentified people are not presented as family members.</p>`;
    document.title='Family places · '+TITLE;
  }
  return {renderFamilies,renderPlaces};
}
