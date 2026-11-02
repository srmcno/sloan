/* Local browsing, source-backed discovery and photo tools for both archives. */
window.ArchiveFeatures = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fold = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function init({site,people,root,personInfo,stories,photos,home,searchId,queryResults,searchHash,openPerson,openStory,openPhoto,viewer,photoMount,journeys=[],timeline=[],resolveStoryId=id=>id}) {
    const readKey=`archive.reading.${site}`,viewKey=`archive.view.${site}`;
    const read = (key,fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}};
    const write = (key,value) => {try {localStorage.setItem(key,JSON.stringify(value));}catch{/* Browsing continues for this visit. */}};
    const storyById=new Map(stories.map(story=>[story.id,story]));
    let recent=read(readKey,[]);if(!Array.isArray(recent))recent=[];recent=[...new Set(recent.map(resolveStoryId).filter(id=>storyById.has(id)))].slice(0,8);
    const historySection=document.createElement('section');historySection.className='archive-continue';
    const paths=home.querySelector('.home-paths');paths?paths.after(historySection):home.prepend(historySection);
    function renderRecent(){historySection.hidden=!recent.length;historySection.innerHTML=`<div class="home-section-head"><h2>Continue reading</h2><button type="button" class="archive-text-button" data-clear-recent>Clear history</button></div><p class="section-intro">Recently opened on this browser.</p><div class="archive-recent-grid">${recent.slice(0,3).map(id=>{const s=storyById.get(id);return `<button type="button" data-recent-story="${esc(id)}"><strong>${esc(s.title)}</strong><span>${esc(s.summary||'Return to this story.')}</span><small>Return to story →</small></button>`;}).join('')}</div>`;}
    historySection.addEventListener('click',event=>{const story=event.target.closest('[data-recent-story]');if(story)openStory(story.dataset.recentStory);if(event.target.closest('[data-clear-recent]')){recent=[];write(readKey,recent);renderRecent();}});
    renderRecent();
    function recordReading(id){if(!storyById.has(id))return;recent=[id,...recent.filter(key=>key!==id)].slice(0,8);write(readKey,recent);renderRecent();}

    let activeJourney=null;
    const journeyKey='archive.journey.'+site;
    const tours=journeys.map(journey=>({...journey,stories:journey.stories.filter(id=>storyById.has(id))})).filter(journey=>journey.stories.length>1);
    activeJourney=tours.find(journey=>journey.title===read(journeyKey,null))||null;
    if(tours.length){
      const old=home.querySelector('.reading-paths');if(old){if(old.previousElementSibling?.tagName==='H2')old.previousElementSibling.remove();old.remove();}
      const section=document.createElement('section');section.className='archive-journeys';section.innerHTML=`<div class="home-section-head"><h2>Choose a family journey</h2></div><p class="section-intro">A guided route through stories already in the archive.</p><div class="archive-journey-grid">${tours.map((journey,i)=>`<button type="button" data-start-journey="${i}"><span class="archive-kicker">${journey.stories.length} chapters</span><strong>${esc(journey.title)}</strong><span>${esc(journey.description)}</span><small>Start here →</small></button>`).join('')}</div>`;paths?paths.after(section):home.prepend(section);
      section.addEventListener('click',event=>{const button=event.target.closest('[data-start-journey]');if(button){activeJourney=tours[Number(button.dataset.startJourney)];write(journeyKey,activeJourney.title);openStory(activeJourney.stories[0]);}});
    }
    function storyOpened(id,host){
      recordReading(id);host.querySelector('.archive-journey-progress')?.remove();
      if(!activeJourney||!activeJourney.stories.includes(id)){activeJourney=null;write(journeyKey,null);return;}
      const at=activeJourney.stories.indexOf(id),nav=document.createElement('nav');nav.className='archive-journey-progress';nav.setAttribute('aria-label','Family journey');nav.innerHTML=`<span><strong>${esc(activeJourney.title)}</strong><small>Chapter ${at+1} of ${activeJourney.stories.length}</small></span><button type="button" data-chapter="${at-1}"${at===0?' disabled':''}>← Previous</button><button type="button" data-chapter="${at+1}"${at===activeJourney.stories.length-1?' disabled':''}>Next chapter →</button><button type="button" data-end-journey>Leave journey</button>`;
      host.prepend(nav);nav.addEventListener('click',event=>{const chapter=event.target.closest('[data-chapter]');if(chapter)openStory(activeJourney.stories[Number(chapter.dataset.chapter)]);if(event.target.closest('[data-end-journey]')){activeJourney=null;write(journeyKey,null);nav.remove();}});
    }
    function profileEvents(ids){const selected=new Set(ids),events=timeline.filter(event=>selected.has(event.story)).slice().sort((a,b)=>Number(String(a.year).match(/\d{4}/)?.[0])-Number(String(b.year).match(/\d{4}/)?.[0]));if(!events.length)return '';return `<section class="archive-profile-timeline"><h4>Events in linked stories</h4><ol>${events.slice(0,8).map(event=>`<li><time>${esc(event.year)}</time><span>${esc(event.text)}</span></li>`).join('')}</ol><a href="${'#/timeline'}">Explore the full timeline →</a></section>`;}
    function enhanceProfile(panel){
      const host=panel.querySelector('#pBody,#pin');if(!host)return;host.querySelector('.archive-profile-sections')?.remove();
      const selectors=site==='family-legacy'?[['.archive-profile-story','Story'],['.archive-profile-photos','Photos'],['.archive-family-links','Family'],['.archive-profile-timeline','Timeline'],['.archive-profile-sources','Sources']]:[['.pstories','Stories'],['.facts','Facts'],['.thumbs','Photos'],['.fam','Family'],['.archive-profile-timeline','Timeline'],['.src','Sources']];
      const sections=selectors.map(([selector,label],i)=>{const node=host.querySelector(selector);if(!node)return null;node.id='profile-section-'+i;return{node,label};}).filter(Boolean);
      if(sections.length<2)return;const nav=document.createElement('nav');nav.className='archive-profile-sections';nav.setAttribute('aria-label','On this profile');nav.innerHTML=sections.map((section,i)=>`<button type="button" data-profile-jump="${i}">${section.label}</button>`).join('');
      const intro=host.querySelector('.ptop');intro?intro.after(nav):host.prepend(nav);nav.addEventListener('click',event=>{const button=event.target.closest('[data-profile-jump]');if(button)sections[Number(button.dataset.profileJump)].node.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
    }

    // Build paths only from recorded parent and spouse links; shared surnames add no edges.
    const graph=new Map(Object.keys(people).map(id=>[id,[]]));
    function edge(a,b,label){if(graph.has(a)&&graph.has(b)&&a!==b)graph.get(a).push({id:b,label});}
    for(const [id,p] of Object.entries(people)){
      for(const [parent,label,kind] of [[p.f,'Father',p.parentKinds?.f],[p.m,'Mother',p.parentKinds?.m],...(Array.isArray(p.otherParents)?p.otherParents.map(link=>[link.id,'Parent',link.kind]):[])])if(parent){const prefix=kind==='adoptive'?'Adoptive ':kind==='birth'?'Birth ':'';const child=p.x==='M'?'Son':p.x==='F'?'Daughter':'Child';edge(id,parent,prefix?prefix+label.toLowerCase():label);edge(parent,id,prefix?prefix+child.toLowerCase():child);}
      for(const spouse of p.sp||[]){edge(id,spouse,'Spouse');edge(spouse,id,'Spouse');}
    }
    function relationship(target){
      if(!people[target]||target===root)return '';
      const queue=[root],previous=new Map([[root,null]]);let at=0;
      while(at<queue.length&&!previous.has(target)){const id=queue[at++];for(const next of graph.get(id)||[])if(!previous.has(next.id)){previous.set(next.id,{from:id,label:next.label});queue.push(next.id);}}
      if(!previous.has(target))return '<p class="archive-path-note">No connecting relationship path is recorded in this tree.</p>';
      const chain=[];let id=target;while(id!==root){const step=previous.get(id);chain.unshift({id,label:step.label});id=step.from;}chain.unshift({id:root,label:'Starting family'});
      return `<details class="archive-relationship"><summary>How this person connects to ${esc(personInfo(root).name)}</summary><ol>${chain.map(step=>`<li><span>${esc(step.label)}</span><strong>${esc(personInfo(step.id).name)}</strong></li>`).join('')}</ol><p>Follows recorded family relationships, which may include adoption; a family connection does not by itself establish shared DNA. Evidence labels still apply.</p></details>`;
    }

    // One searchable index; profile details for living people come from the site's safe display adapter.
    const kinds=[['all','Everything'],['person','People'],['story','Stories'],['photo','Photos'],['record','Records']];
    const photoItems=[...new Map(photos.filter(p=>p.src).map(p=>[p.src,p])).values()];
    const items=[...Object.keys(people).filter(id=>personInfo(id).selectable!==false).map(id=>{const p=personInfo(id);return {kind:'person',id,title:p.name,summary:p.years||'',search:[p.name,p.years].join(' ')};}),...stories.map(s=>({kind:'story',...s,search:[s.title,s.summary,s.text].join(' ')})),...photoItems.map((p,i)=>({kind:p.kind||'photo',id:String(i),title:p.caption||'Family collection image',summary:p.source||'',search:[p.caption,p.source,p.date,p.place].join(' '),photo:p}))];
    function results(query,kind='all'){const terms=fold(query).trim().split(/\s+/).filter(Boolean);if(!terms.length)return [];return items.filter(item=>(kind==='all'||item.kind===kind)&&terms.every(term=>fold(item.search).includes(term))).sort((a,b)=>Number(terms.every(t=>fold(b.title).includes(t)))-Number(terms.every(t=>fold(a.title).includes(t)))||a.title.localeCompare(b.title));}
    function activate(item){if(item.kind==='person')openPerson(item.id);else if(item.kind==='story')openStory(item.id);else openPhoto(item.photo,false);}
    const view=document.createElement('section');view.id=searchId;view.className='view archive-search-view';view.hidden=true;document.querySelector('main').append(view);
    let currentQuery='',currentKind='all',visibleResults=[];
    function renderSearch(query=currentQuery,kind=currentKind){
      currentQuery=query;currentKind=kinds.some(([key])=>key===kind)?kind:'all';
      view.innerHTML=`<div class="head lede"><h1>Search the archive</h1><p>Find people, stories, photographs and records together.</p></div><label class="archive-search-label">Search everything<input id="archive-all-search" type="search" placeholder="Name, place, year or subject" value="${esc(currentQuery)}" autocomplete="off"></label><div class="chips" aria-label="Search result type">${kinds.map(([key,label])=>`<button type="button" class="chip" data-search-kind="${key}" aria-pressed="${key===currentKind}">${label}</button>`).join('')}</div><p class="result-count" role="status" id="archive-search-count"></p><div id="archive-search-groups"></div>`;
      view.querySelector('#archive-all-search').addEventListener('input',event=>{currentQuery=event.target.value;renderGroups();history.replaceState(null,'',searchHash(currentQuery,currentKind));});renderGroups();
    }
    function renderGroups(){
      visibleResults=results(currentQuery,currentKind);const output=view.querySelector('#archive-search-groups');
      view.querySelector('#archive-search-count').textContent=currentQuery.trim()?`${visibleResults.length} ${visibleResults.length===1?'result':'results'}`:'Enter a name, place, year or subject to search.';
      output.innerHTML=kinds.slice(1).map(([kind,label])=>{const group=visibleResults.filter(item=>item.kind===kind);return group.length?`<section class="archive-search-group"><h2>${label} <span>${group.length}</span></h2><div class="archive-search-list">${group.map(item=>`<button type="button" data-result-index="${visibleResults.indexOf(item)}"><strong>${esc(item.title)}</strong><span>${esc(item.summary||'Open this entry.')}</span></button>`).join('')}</div></section>`:'';}).join('')||(currentQuery.trim()?'<p class="timeline-empty">No matches. Try fewer words, another spelling or a different result type.</p>':'');
    }
    view.addEventListener('click',event=>{const filter=event.target.closest('[data-search-kind]'),result=event.target.closest('[data-result-index]');if(filter){currentKind=filter.dataset.searchKind;renderSearch();history.replaceState(null,'',searchHash(currentQuery,currentKind));}if(result)activate(visibleResults[Number(result.dataset.resultIndex)]);});
    const input=document.querySelector('#q'),dropdown=document.querySelector(queryResults);let quickResults=[];
    const closeSearch=()=>{dropdown.hidden=true;dropdown.classList.remove('on');input.setAttribute('aria-expanded','false');};
    function quickSearch(){const query=input.value.trim();if(!query){closeSearch();return;}quickResults=results(query).slice(0,8);dropdown.innerHTML=quickResults.map((item,i)=>`<button type="button" data-quick-result="${i}"><span><strong>${esc(item.title)}</strong><small>${kinds.find(([key])=>key===item.kind)[1]} · ${esc(item.summary).slice(0,150)}</small></span></button>`).join('')+`<button type="button" class="archive-all-results" data-open-search>${quickResults.length?'See all results':'Search the archive'} →</button>`;dropdown.hidden=false;dropdown.classList.add('on');input.setAttribute('aria-expanded','true');}
    input.oninput=quickSearch;input.onfocus=()=>{if(input.value.trim())quickSearch();};
    input.onkeydown=event=>{if(event.key==='Escape')closeSearch();else if(event.key==='Enter'){event.preventDefault();closeSearch();location.hash=searchHash(input.value,'all');}else if(event.key==='ArrowDown'){const first=dropdown.querySelector('button');if(first){event.preventDefault();first.focus();}}};
    dropdown.onclick=event=>{const result=event.target.closest('[data-quick-result]');if(result){closeSearch();activate(quickResults[Number(result.dataset.quickResult)]);}else if(event.target.closest('[data-open-search]')){closeSearch();location.hash=searchHash(input.value,'all');}};
    dropdown.onkeydown=event=>{const buttons=[...dropdown.querySelectorAll('button')],at=buttons.indexOf(document.activeElement);if(event.key==='Escape'){closeSearch();input.focus();}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();buttons[(at+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}};
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.search'))closeSearch();});

    // Photo browsing keeps records and photographs in separate sequences.
    const nav=document.createElement('div');nav.className='archive-photo-nav';nav.innerHTML='<button type="button" data-photo-step="-1" aria-label="Previous image">← Previous</button><span class="archive-photo-position" role="status"></span><button type="button" data-photo-step="1" aria-label="Next image">Next →</button>';
    const mount=viewer.querySelector(photoMount);mount?mount.after(nav):viewer.prepend(nav);
    const details=document.createElement('details');details.className='archive-photo-details';details.innerHTML='<summary>Photo details and sources</summary><div></div>';viewer.append(details);
    let currentPhoto=null,sequence=[],photoAt=-1;
    function photoOpened({src,key}){
      currentPhoto=photoItems.find(photo=>key&&photo.key===key)||photoItems.find(photo=>photo.src===src||Object.values(photo.versions||{}).includes(src));
      if(!currentPhoto){nav.hidden=true;details.hidden=true;return;}
      nav.hidden=false;details.hidden=false;sequence=photoItems.filter(photo=>(photo.kind||'photo')===(currentPhoto.kind||'photo'));photoAt=sequence.indexOf(currentPhoto);
      nav.querySelector('.archive-photo-position').textContent=`${photoAt+1} of ${sequence.length} ${currentPhoto.kind==='record'?'records':'photos'}`;
      nav.querySelectorAll('button').forEach(button=>button.disabled=sequence.length<2);
      const rows=[['Caption',currentPhoto.caption],['Date',currentPhoto.date],['Place',currentPhoto.place],[currentPhoto.sourceLabel||'Source',currentPhoto.source],['Restoration',currentPhoto.notes]].filter(([,value])=>value);
      details.querySelector('div').innerHTML=`<dl>${rows.map(([label,value])=>`<dt>${label}</dt><dd>${/^https?:\/\/[^\s]+$/.test(String(value))?`<a href="${esc(value)}" target="_blank" rel="noopener noreferrer">${esc(value)}</a>`:esc(value)}</dd>`).join('')}</dl><a href="${esc(currentPhoto.src)}" target="_blank" rel="noopener noreferrer">Open original file ↗</a>`;
    }
    function stepPhoto(direction){if(sequence.length<2)return;const next=sequence[(photoAt+direction+sequence.length)%sequence.length];openPhoto(next,true);}
    nav.addEventListener('click',event=>{const button=event.target.closest('[data-photo-step]');if(button)stepPhoto(Number(button.dataset.photoStep));});
    viewer.addEventListener('keydown',event=>{if(event.defaultPrevented||event.target.matches('input,select,textarea'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();stepPhoto(event.key==='ArrowLeft'?-1:1);}});

    const remembered=read(viewKey,null);let restoring=false;
    if(!location.hash&&remembered&&typeof remembered.hash==='string'&&remembered.hash.startsWith('#')){history.replaceState(null,'',remembered.hash);restoring=true;}
    let scrollTimer;
    function rememberView(){if(restoring||document.body.classList.contains('modal-open')||document.body.classList.contains('tree-focus-open'))return;write(viewKey,{hash:location.hash,scroll:Math.max(0,scrollY)});}
    addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberView,250);},{passive:true});addEventListener('hashchange',()=>{restoring=false;rememberView();});addEventListener('pagehide',rememberView);
    function restoreScroll(){if(!restoring)return;requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo(0,Number(remembered.scroll)||0);restoring=false;}));}
    return {renderSearch,recordReading,storyOpened,enhanceProfile,profileEvents,relationship,photoOpened,restoreScroll};
  }
  return {init};
})();
