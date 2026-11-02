(async function(){
const dataVersion=Date.now();
async function loadJSON(file){const r=await fetch(file+'?v='+dataVersion,{cache:'no-store'});if(!r.ok)throw new Error('Could not load '+file);return r.json()}
const SITE=window.SITE||{id:'archive',storage:'archive',title:'Family history',text:{},topics:{},regions:[]};
let T,C;
if(SITE.data==='family'){const [D,tree]=await Promise.all([loadJSON('data.json'),loadJSON('tree.json')]);const {adaptFamily}=await import('./adapter.js?v=20261102c');({T,C}=adaptFamily(D,tree));}
else{[T,C]=await Promise.all([loadJSON('tree.json'),loadJSON('content.json')]);}
document.querySelectorAll('[data-text]').forEach(el=>{const v=SITE.text?.[el.dataset.text];if(v)el.innerHTML=v;else el.hidden=true});
document.querySelectorAll('[data-site-title]').forEach(el=>el.textContent=SITE.title);

document.querySelector('.skip').onclick=e=>{e.preventDefault();document.querySelector('#main').focus()};
let features=null;
const P=T.people, ROOT=T.root, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const {createRelationships}=await import('./relationships.js?v=20261102d');
const relations=createRelationships(P,ROOT,SITE.rootName||'You');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EVT={proven:'An original record names it',probable:'A good secondary source that agrees with the records',lead:'Not proven; treat with care'};
const prose=t=>esc(t).replace(/\((lead|probable|proven)\)/g,(m,k)=>`<span class="badge ${k} inline-ev" title="${EVT[k]}">${k}</span>`);
const {personYears:years}=await import('./archive-dates.js?v=20261102l');
const initials=p=>(p.n||'?').replace(/["“”(].*?["”)]/g,'').split(/\s+/).filter(Boolean).map(w=>w[0]).filter(c=>/[A-Za-z]/.test(c)).slice(0,2).join('').toUpperCase();
const SIDE={N:"Mom's side",J:"Dad's side"};
const STORIES=C.stories.filter(s=>s&&s.id&&s.title), SBY=Object.fromEntries(STORIES.map(s=>[s.id,s]));
const storyId=id=>C.storyAliases?.[id]||id;
const LIST=STORIES.filter(s=>!s.profile);
const storiesFor=id=>STORIES.filter(s=>(s.people||[]).includes(id));
let saved=new Set(),largeText=false,storageOK=true;
try{const stored=JSON.parse(localStorage.getItem(SITE.storage+'.saved')||'[]');if(Array.isArray(stored))saved=new Set(stored.filter(id=>typeof id==='string').map(storyId).filter(id=>SBY[id]));largeText=localStorage.getItem(SITE.storage+'.largeText')==='true'}catch(error){storageOK=false;console.warn('Reading preferences are unavailable:',error.name)}
function persistPreferences(){try{localStorage.setItem(SITE.storage+'.saved',JSON.stringify([...saved]));localStorage.setItem(SITE.storage+'.largeText',String(largeText));return true}catch(error){storageOK=false;console.warn('Reading preferences could not be saved:',error.name);return false}}
function sourceHTML(text){const pattern=/(?:https?:\/\/|www\.|(?:archive\.org|millerandmillerfuneralhome\.com|findagrave\.com)\/)[^\s<>"()]+/g;let out='',end=0;for(const m of String(text).matchAll(pattern)){const raw=m[0].replace(/[.,;]+$/,'');const url=raw.startsWith('http')?raw:'https://'+raw;out+=esc(text.slice(end,m.index))+`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>`;end=m.index+raw.length}return out+esc(text.slice(end))}

C.grandparents.forEach(g=>{if(g.img&&P[g.id]){P[g.id].img=g.img;P[g.id].pos=g.pos}});
// give people without tree photos a picture from their stories' first person-specific image
STORIES.forEach(s=>{const lead=(s.people||[])[0];const im=(s.imgs||[]).find(i=>/photo|portrait/i.test(i.s));if(lead&&P[lead]&&!(P[lead].ph||[]).length&&!P[lead].img&&im)P[lead].img=im.s});
const phSrc=ph=>ph.s||'img/p/'+ph.k+'.jpg', phThumb=ph=>ph.t||ph.s||'img/t/'+ph.k+'.jpg';
const photo=p=>p.img||(p.ph&&p.ph.length?phThumb(p.ph[0]):'');
const av=(p,size)=>{const src=restored(photo(p));return `<span class="av" style="${size?`width:${size}px;height:${size}px;`:''}${src?`background-image:url('${src}');${p.pos?`background-position:${p.pos}`:''}`:''}">${src?'':esc(initials(p))}</span>`};
const edition=src=>C.restorations?.[src]||C.restorations?.[src.replace('/t/','/p/')];
const restored=src=>{const r=edition(src);return r?.colorized||r?.s||src};
const isStone=src=>/headstone|gravestone|stones\/|(?:^|[\/_-])grave(?:[\/_\-.]|$)/i.test(src||'');
const cardImg=s=>((s.imgs||[]).find(i=>!isStone(i.s))||(s.imgs||[])[0]||{}).s||((s.people||[]).map(id=>P[id]&&photo(P[id])).find(Boolean)||'');
function relName(id){const p=P[id];if(!p)return '';const relation=relations.describe(id);return relation.label+(relation.kind!=='unknown'&&id!==ROOT&&p.side?' · '+SIDE[p.side]:'')}
const storyWho=s=>{const id=(s.people||[]).find(x=>P[x]);if(id)return [relations.label(id),P[id].n];return s.subject?[s.subject.rel,s.subject.name]:['',''];};
const storyCard=s=>{const img=cardImg(s),name=(s.people||[]).map(id=>P[id]?.s).find(Boolean)||String(s.subject?.name||'').replace(/^(Rev\.|Pvt\.|Judge|The)\s+/,'').split(/\s+/).filter(w=>/^[A-Z]/.test(w)).at(-1)||'Family history';return `<a class="scard" href="#/story/${s.id}"><div class="im${img?'':' no-image'}" style="${img?`background-image:url('${restored(img)}')`:''}" aria-hidden="true">${img?'':esc(name)}</div><div class="bd"><div class="meta"><span class="sidetag ${s.side}">${SIDE[s.side]||''}</span><span class="badge ${s.ev}">${s.ev}</span></div>${(()=>{const [r,n]=storyWho(s);return n?`<div class="story-context">${r?`<span>${esc(r)}</span>`:''}<span>${esc(n)}</span></div>`:''})()}<h3>${esc(s.title)}</h3><p>${esc(s.hook)}</p></div></a>`};

/* ---------- tabs + routing ---------- */
let current='',appReady=false;
function showView(v,tab){$$('.view').forEach(e=>e.hidden=e.id!=='v-'+v);$$('[data-tab]').forEach(a=>a.toggleAttribute('aria-current',a.dataset.tab===(tab==='stories'&&location.hash.startsWith('#/stories/saved')?'saved':tab))&&a.setAttribute('aria-current','page'));
  if(current!==v+location.hash)scrollTo(0,0);current=v+location.hash;}
function route(){
  let parts;try{parts=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent)}catch(error){parts=['home']}const [a,b,c]=parts;
  document.title=(a&&a!=='home'?a[0].toUpperCase()+a.slice(1)+' · ':'')+SITE.title;
  closeLB();closePanel();
  if(a==='families'){showView('families','families');explore.renderFamilies(b)}
  else if(a==='places'){showView('places','places');explore.renderPlaces(b)}
  else if(a==='tree'){showView('tree','tree');treeShown(b);}
  else if(a==='stories'){showView('stories','stories');sf=['N','J','saved'].includes(b)?b:'all';$('#story-topic').value=TOPICS[c]?c:'all';syncChips('#sfilters',sf);renderStories();}
  else if(a==='story'&&SBY[storyId(b)]){const id=storyId(b);if(id!==b)history.replaceState(null,'','#/story/'+encodeURIComponent(id));showView('story','stories');renderStory(id);}
  else if(a==='people'){showView('people','people');renderPeople();}
  else if(a==='person'&&P[b]){showView('tree','tree');treeShown(b);openPerson(b);}
  else if(a==='photos'){showView('photos','photos');renderPhotos();}
  else if(a==='records'){showView('records','records');renderRecords();}
  else if(a==='search'&&features){showView('search','search');features.renderSearch(b||'',c||'all');}
  else if(a==='timeline'){showView('timeline','timeline');renderTimeline();}
  else if(a==='about'){showView('about','about');}
  else showView('home','home');
}
addEventListener('hashchange',()=>{if(appReady)route()});
function syncChips(sel,v){$$(sel+' [data-f]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.f===v))}

/* ---------- home ---------- */
const extraSlides=Array.isArray(SITE.heroExtras)?SITE.heroExtras:[];
const slides=C.hero.flatMap((slide,index)=>extraSlides[index]?[slide,extraSlides[index]]:[slide]).concat(extraSlides.slice(C.hero.length));const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let si=0,timer=null,photosPaused=reduce;
$('#slides').innerHTML=slides.map((s,i)=>`<div class="slide${i?'':' on'}"><div class="bg" style="background-image:url('${s.s}')"></div><img src="${restored(s.s)}" alt="${esc(s.cap)}" ${i?'loading="lazy"':''}></div>`).join('');
$('#dots').innerHTML=slides.length>10?'<span class="hero-count" aria-live="polite"></span>':slides.map((s,i)=>`<button aria-label="Photo ${i+1}"></button>`).join('');
function show(i){si=(i+slides.length)%slides.length;$$('.slide').forEach((e,k)=>{e.classList.toggle('on',k===si);e.setAttribute('aria-hidden',String(k!==si))});$$('#dots button').forEach((e,k)=>e.classList.toggle('on',k===si));if($('#dots .hero-count'))$('#dots .hero-count').textContent=(si+1)+' / '+slides.length;const s=slides[si];$('#slidecap').innerHTML=esc(s.cap)+`<br><button class="photo-open" data-view-photo="${s.s}">View photograph${restored(s.s)!==s.s?' · restored and original':''}</button>`+(s.story&&SBY[s.story]?` · <a href="#/story/${s.story}">Read the story</a>`:'')}
$('#previousPhoto').onclick=()=>{show(si-1);restart()};$('#nextPhoto').onclick=()=>{show(si+1);restart()};
function restart(){clearInterval(timer);if(slides.length>1&&!photosPaused&&!document.hidden)timer=setInterval(()=>{if(!$('#v-home').hidden&&!$('#slides').contains(document.activeElement))show(si+1)},6500)}
function syncPhotoControl(){$('#pausePhotos').textContent=photosPaused?'Play photos':'Pause photos';$('#pausePhotos').setAttribute('aria-pressed',String(photosPaused))}
$('#pausePhotos').hidden=slides.length<2;syncPhotoControl();show(0);restart();$('#pausePhotos').onclick=()=>{photosPaused=!photosPaused;syncPhotoControl();restart()};$$('#dots button').forEach((b,i)=>b.onclick=e=>{e.stopPropagation();show(i);restart()});
$('#slides').onmouseenter=()=>clearInterval(timer);$('#slides').onmouseleave=restart;$('#slides').onclick=()=>{const s=slides[si];lightbox(s.s,s.cap,s.story&&SBY[s.story]?'#/story/'+s.story:'')};$('#slides').setAttribute('role','button');$('#slides').tabIndex=0;$('#slides').setAttribute('aria-label','Open family photograph and compare versions');$('#slides').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#slides').click()}};document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(timer);else restart()});
$('#gp').innerHTML=C.grandparents.map(g=>{const p=P[g.id];const img=restored(g.img||photo(p));const n=storiesFor(g.id).length;
  return `<article class="gcard"><div class="ph" style="${img?`background-image:url('${img}');background-position:${g.pos||'center 22%'}`:''}">${img?'':esc(initials(p))}<span class="side" style="background:var(--${g.side==='N'?'river':'clay'})">${SIDE[g.side]}</span></div>
  <div class="bd"><h3>${esc(p.n)}</h3><div class="yrs">${esc(g.role)} · ${esc(years(p))}</div><p>${esc(g.lede)}</p>
  <div class="acts">${g.story&&SBY[g.story]?`<a class="btn primary" href="#/story/${g.story}">Read the story</a>`:''}<a class="btn" href="#/person/${g.id}">${n>1?n+' stories · ':''}Family</a></div></div></article>`}).join('');
const FEAT=(SITE.featured&&SITE.featured.length?SITE.featured.filter(id=>SBY[id]):LIST.filter(s=>cardImg(s)&&!isStone(cardImg(s))&&s.gen<=5).slice(0,6).map(s=>s.id));
$('#featured').innerHTML=FEAT.filter(id=>SBY[id]).map(id=>storyCard(SBY[id])).join('');

/* ---------- stories list ---------- */
let sf='all';
const TOPICS=Object.fromEntries(Object.entries(SITE.topics||{}).map(([k,t])=>{const ids=t.ids||LIST.filter(x=>(x.tags||[]).includes(t.tag)).map(x=>x.id);const img=t.img||ids.map(id=>SBY[id]&&cardImg(SBY[id])).find(src=>src&&!isStone(src))||'';return [k,{...t,ids,img}]}));
$('#story-topic').innerHTML='<option value="all">All subjects</option>'+Object.entries(TOPICS).map(([k,t])=>`<option value="${k}">${esc(t.label)}</option>`).join('');
$('#reading-paths').innerHTML=Object.entries(TOPICS).map(([key,t])=>`<a class="reading-path" href="#/stories/all/${key}"><img src="${restored(t.img)}" alt="" loading="lazy"><div><h3>${t.label}</h3><p>${t.copy}</p><span>${t.ids.filter(id=>SBY[id]).length} stories</span></div></a>`).join('');
const realPeople=Object.values(P).filter(p=>!p.virtual).length;
$('#home-places').innerHTML=(SITE.regions||[]).map(r=>({r,im:(C.archivePhotos||[]).find(i=>r.archive&&i.s.includes(r.archive))})).filter(x=>x.im).slice(0,4).map(({r,im})=>`<a href="#/places/${r.id}"><img src="${restored(im.s)}" alt="${esc(im.cap)}" loading="lazy"><div><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p></div></a>`).join('');if(!$('#home-places').innerHTML)$('#home-places').closest('.home-places-wrap')?.setAttribute('hidden','');

const GROUPS=[[g=>g<=2,(SITE.rootPossessive||'Our')+' grandparents and their families'],[g=>g===3,'Great-grandparents'],[g=>g===4,'Great-great-grandparents'],[g=>g>=5,'Earlier generations and places']];
function renderStories(){const q=($('#sq').value||'').toLowerCase();
  const topic=TOPICS[$('#story-topic').value];const list=LIST.filter(s=>(!topic||topic.ids.includes(s.id))&&(sf==='all'||(sf==='saved'?saved.has(s.id):s.side===sf))&&(!q||(s.title+' '+s.hook+' '+(s.subject?.name||'')+' '+(s.people||[]).map(id=>P[id]?.n||'').join(' ')+' '+(s.body||[]).join(' ')).toLowerCase().includes(q)));
  const order=$('#story-sort').value;if(order==='title')list.sort((a,b)=>a.title.localeCompare(b.title));else if(order==='short')list.sort((a,b)=>a.body.join(' ').split(/\s+/).length-b.body.join(' ').split(/\s+/).length);
  const html=order!=='generation'?`<div class="cards">${list.map(storyCard).join('')}</div>`:GROUPS.map(([f,label])=>{const g=list.filter(s=>f(+s.gen||9));return g.length?`<div class="group"><h3 class="gh">${label} · ${g.length}</h3><div class="cards">${g.map(storyCard).join('')}</div></div>`:''}).join('');
  $('#story-count').textContent=list.length+' '+(list.length===1?'story':'stories')+(sf==='saved'?' saved on this browser':'');$('#sgroups').innerHTML=(list.length?html:'')||'<p class="empty">'+(sf==='saved'?'Your saved stories appear here. Open a story and choose Save story.':'No stories match. Clear the filter to see them all.')+'</p>'}
$('#sfilters').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;sf=b.dataset.f;syncChips('#sfilters',sf);updateStoryRoute();renderStories()};
$('#sq').oninput=renderStories;
function updateStoryRoute(){const topic=$('#story-topic').value;history.replaceState(null,'','#/stories'+(sf==='all'&&topic==='all'?'':'/'+sf)+(topic==='all'?'':'/'+topic))}
$('#story-topic').onchange=()=>{updateStoryRoute();renderStories()};$('#story-sort').onchange=renderStories;
$('#clearStories').onclick=()=>{sf='all';$('#sq').value='';$('#story-topic').value='all';$('#story-sort').value='generation';syncChips('#sfilters','all');updateStoryRoute();renderStories()};

/* ---------- story page ---------- */
const progress=document.createElement('div');progress.className='read-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
addEventListener('scroll',()=>{if($('#v-story').hidden){progress.style.transform='scaleX(0)';return}const el=$('#storyBody'),r=el.getBoundingClientRect(),total=r.height-innerHeight;progress.style.transform=`scaleX(${Math.max(0,Math.min(1,total>0?-r.top/total:1))})`},{passive:true});
function renderStory(id){const s=SBY[id];$('#storyBody').classList.toggle('large',largeText);const minutes=Math.max(1,Math.ceil((s.body||[]).join(' ').split(/\s+/).length/200));const order=s.profile?[]:LIST;const i=order.indexOf(s);const prev=order[i-1],next=order[i+1];
  const imgs=(s.imgs||[]).map(m=>`<figure><img src="${restored(m.s)}" alt="${esc(m.cap)}" data-lb="${m.s}" data-cap="${esc(m.cap)}" loading="lazy"><figcaption>${esc(m.cap)}${edition(m.s)?.colorized?' · '+esc(edition(m.s)?.labels?.c||'Colorized copy'):restored(m.s)!==m.s?' · Restored copy':''}<br><button class="photo-open" data-view-photo="${m.s}">${restored(m.s)!==m.s?'Compare with original':'View full photograph'}</button></figcaption></figure>`);
  const body=(s.body||[]).map((b,k)=>`<p>${prose(b)}</p>`+(k===0&&s.quotes&&s.quotes[0]?`<blockquote>${esc(s.quotes[0].t)}<cite>${esc(s.quotes[0].c)}</cite></blockquote>`:'')+(k===1&&imgs[0]?imgs[0]:'')+(k===3&&imgs[1]?imgs[1]:'')).join('')+imgs.slice((s.body||[]).length>3?2:1).join('');
  const rel=STORIES.filter(o=>o!==s&&(o.people||[]).some(p=>(s.people||[]).includes(p))).slice(0,3);
  $('#storyBody').innerHTML=`<div class="crumb"><a href="#/stories${s.side?'/'+s.side:''}">← All stories</a>${s.profile?' · <span>Family profile</span>':''}</div>
   <div class="meta"><span class="sidetag ${s.side}">${SIDE[s.side]||''}</span><span class="badge ${s.ev}">${s.ev}</span></div>
   <h1>${esc(s.title)}</h1>${s.subject?.rel?`<p class="story-subject">${esc(s.subject.rel)}${s.subject.years?' · '+esc(s.subject.years):''}</p>`:''}<p class="hook">${esc(s.hook)}</p>
   <div class="ppl">${(s.people||[]).filter(x=>P[x]).map(x=>`<button data-open="${x}">${av(P[x])}<span class="person-story-label"><span>${esc(P[x].n)}</span><small>${esc(relations.label(x))}</small></span></button>`).join('')}</div>
   <div class="readtools"><span class="reading-time">${minutes} min read</span><button class="btn" id="saveStory" aria-pressed="${saved.has(id)}">${saved.has(id)?'Story saved':'Save story'}</button><button class="btn" id="largeText" aria-pressed="${largeText}">Larger text</button><button class="btn" id="printStory">Print story</button><button class="btn" data-copy-link="${esc(new URL('#/story/'+encodeURIComponent(id),location.href).href)}">Copy link</button><p class="link-status" role="status"></p></div><p id="reading-notice" role="status">${storageOK?'':'Reading preferences are available for this visit only.'}</p>
   ${body}
   ${(s.kv||[]).length?`<aside class="keyrec"><h2>Key records</h2><dl>${s.kv.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${sourceHTML(v)}</dd></div>`).join('')}</dl></aside>`:''}
   ${s.note?`<aside class="research-note"><h2>Research note</h2><p>${sourceHTML(s.note)}</p></aside>`:''}
   <div class="src"><b>Sources</b><ul>${(s.src||[]).map(x=>`<li>${sourceHTML(x)}</li>`).join('')}</ul></div>
   ${rel.length?`<div class="related"><h3>Related stories</h3><div class="cards">${rel.map(storyCard).join('')}</div></div>`:''}
   <nav class="pager">${prev?`<a href="#/story/${prev.id}"><small>← Previous</small>${esc(prev.title)}</a>`:'<span></span>'}${next?`<a class="next" href="#/story/${next.id}"><small>Next →</small>${esc(next.title)}</a>`:''}</nav>`;
  features?.storyOpened(id,$('#storyBody'));
  document.title=s.title+' · '+SITE.title;
  $('#saveStory').onclick=()=>{saved.has(id)?saved.delete(id):saved.add(id);persistPreferences();$('#saveStory').textContent=saved.has(id)?'Story saved':'Save story';$('#saveStory').setAttribute('aria-pressed',String(saved.has(id)));$('#reading-notice').textContent=storageOK?'Saved stories are kept on this browser.':'Reading preferences are available for this visit only.'};
  $('#largeText').onclick=()=>{largeText=!largeText;$('#storyBody').classList.toggle('large',largeText);$('#largeText').setAttribute('aria-pressed',String(largeText));if(!persistPreferences())$('#reading-notice').textContent='Reading preferences are available for this visit only.'};$('#printStory').onclick=()=>window.print();}
$('#storyBody').addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o){openPerson(o.dataset.open);return}const l=e.target.closest('[data-lb]');if(l)lightbox(l.dataset.lb,l.dataset.cap)});

/* ---------- tree ---------- */
let sel=null;
const treeView=ArchiveTree.init({container:$('#archiveTree'),people:P,root:ROOT,homeLabel:'Back to '+(SITE.rootName||'start'),getCard:id=>{const p=P[id];return{name:p.n,years:years(p),image:restored(photo(p)),evidence:p.ev,color:p.side==='N'?'var(--river)':p.side==='J'?'var(--clay)':'var(--accent)',stories:storiesFor(id).length};},onOpen:openPerson});
function treeShown(id){treeView.show(id)}
function refocus(id){treeView.refocus(id)}

/* ---------- person panel ---------- */
function siblings(id){const p=P[id];if(!p.f&&!p.m)return[];return Object.keys(P).filter(k=>k!==id&&((p.f&&P[k].f===p.f)||(p.m&&P[k].m===p.m)))}
const famBtn=(id,label)=>{const p=P[id];return `<button data-open="${id}">${av(p)}<span><b>${esc(p.n)}</b><small>${label?label+' · ':''}${esc(years(p))}${storiesFor(id).length?' · '+storiesFor(id).length+' '+(storiesFor(id).length>1?'stories':'story'):''}</small></span></button>`};
let personFocus=null;
function openPerson(id){const p=P[id];if(!p)return;if(!$('#panel').classList.contains('on'))personFocus=document.activeElement;$('#panel').inert=false;$('#panel').setAttribute('aria-hidden','false');sel=id;treeView.select(id);
  const facts=[];if(p.virtual)facts.push(['','The starting point for every relationship on this site.']);else if(!p.lv){if(p.b||p.bp)facts.push(['Born',[p.b,p.bp].filter(Boolean).join(', ')]);if(p.d||p.dp)facts.push(['Died',[p.d,p.dp].filter(Boolean).join(', ')])}else facts.push(['','Details are private for living people.']);
  const evTxt={proven:'Proven in records',probable:'Probable',lead:'Lead: not proven',tree:'From the Ancestry tree, not yet checked'}[p.ev||'tree'];
  const parents=[{id:p.f,kind:p.parentKinds?.f},{id:p.m,kind:p.parentKinds?.m},...(Array.isArray(p.otherParents)?p.otherParents:[])].filter(link=>link.id&&P[link.id]),sps=p.sp||[],kids=p.ch||[],sibs=siblings(id),sts=storiesFor(id);
  $('#pin').innerHTML=`<button class="x" id="px" aria-label="Close">✕</button>
   <div class="ptop">${av(p)}<div><h3>${esc(p.n)}</h3><div class="rel">${esc(relName(id))}</div><div class="rel"><i class="ev ${p.ev}"></i>${evTxt}</div></div></div>
   ${sts.length?`<div class="pstories">${sts.map(s=>`<a href="#/story/${s.id}"><span class="im" style="${cardImg(s)?`background-image:url('${restored(cardImg(s))}')`:''}"></span><span><b>${esc(s.title)}</b><span>${s.profile?'Read the family profile':'Read the story'} · ${s.ev}</span></span></a>`).join('')}</div>`:''}
   <div class="facts">${facts.map(f=>`<div><b>${f[0]}</b><span>${esc(f[1])}</span></div>`).join('')}${p.lv?'':(p.kv||[]).filter(([k])=>!/^(born|died|birth|death)$/i.test(k)).slice(0,6).map(([k,v])=>`<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div>
   ${p.note?`<div class="note">${esc(p.note)}</div>`:''}
   ${(p.source_urls||[]).length?`<div class="src"><b>Sources</b><ul>${p.source_urls.map(url=>`<li>${sourceHTML(url)}</li>`).join('')}</ul></div>`:''}
   ${features?.profileEvents(sts.map(s=>s.id))||''}
   ${features?.relationship(id)||''}
   <div class="pactions"><button class="btn" data-copy-link="${esc(new URL('#/person/'+encodeURIComponent(id),location.href).href)}">Copy profile link</button><p class="link-status" role="status"></p><a class="btn" href="#/tree/${id}">Show tree from ${esc((p.g||p.n).split(' ')[0])}</a></div>
   ${(p.ph||[]).length?`<h4>Photos and records</h4><div class="thumbs">${p.ph.map(ph=>`<button data-lb="${phSrc(ph)}" data-cap="${esc(ph.c||p.n)}"><img src="${phThumb(ph)}" alt="${esc(ph.c||p.n)}" loading="lazy"></button>`).join('')}</div>`:''}
   ${parents.length?`<h4>Parents</h4><div class="fam">${parents.map(x=>famBtn(x.id,x.kind==='adoptive'?'Adoptive parent':x.kind==='birth'?'Birth parent · family reported':'')).join('')}</div>`:''}
   ${sps.length?`<h4>Spouses</h4><div class="fam">${sps.map(x=>famBtn(x)).join('')}</div>`:''}
   ${kids.length?`<h4>Children</h4><div class="fam">${kids.map(x=>famBtn(x)).join('')}</div>`:''}
   ${sibs.length?`<h4>Brothers and sisters</h4><div class="fam">${sibs.map(x=>famBtn(x,(P[x].f===p.f&&P[x].m===p.m)?'':'half-sibling')).join('')}</div>`:''}`;
  features?.enhanceProfile($('#panel'));
  $('#panel').classList.add('on');$('#scrim').classList.add('on');$('#panel').scrollTop=0;setTimeout(()=>$('#px')?.focus(),60)}
function closePanel(){const wasOpen=$('#panel').classList.contains('on');$('#panel').classList.remove('on');$('#panel').inert=true;$('#panel').setAttribute('aria-hidden','true');$('#scrim').classList.remove('on');if(wasOpen&&personFocus?.isConnected)queueMicrotask(()=>personFocus.focus())}
$('#scrim').onclick=closePanel;
$('#panel').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=$$('#panel button,#panel a').filter(el=>!el.hidden&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0]?.focus()}});
$('#panel').addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t)return;if(t.id==='px')closePanel();else if(t.dataset.open)openPerson(t.dataset.open);else if(t.dataset.lb)lightbox(t.dataset.lb,t.dataset.cap);else if(t.tagName==='A')closePanel()});

/* ---------- people ---------- */
let pf='all';
const PGROUPS=[[g=>g===0||g===1,SITE.text?.rootGroup||'Our generation'],[g=>g===2,'Grandparents'],[g=>g===3,'Great-grandparents'],[g=>g===4,'Great-great-grandparents'],[g=>g>=5&&g<99,'Earlier ancestors'],[g=>g===99,'Other people']];
let pview='lines';
const R0=P[ROOT]||{},GP=[[P[R0.f]?.f,'J'],[P[R0.f]?.m,'J'],[P[R0.m]?.f,'N'],[P[R0.m]?.m,'N']];
function lineOf(start){const out=new Map();(function walk(id,g){const p=P[id];if(!p||out.has(id))return;out.set(id,g);walk(p.f,g+1);walk(p.m,g+1)})(start,2);return out}
const GEN_NAME=g=>g===2?'Grandparents':g===3?'Great-grandparents':(g-2)+(g-2===2?'nd':g-2===3?'rd':'th')+' great-grandparents';
let line=0;
function renderLines(){const q=($('#pq').value||'').toLowerCase();
  $('#pgroups').innerHTML=`<div class="line-cards">${GP.map(([id,side],i)=>{const p=P[id];if(!p)return '';const n=lineOf(id).size;return `<button class="line-card ${side}" data-line="${i}" aria-pressed="${i===line}"><span class="line-side">${side==='N'?"Mom's":"Dad's"} ${p.x==='F'?'mother':'father'}</span><b>${esc((p.s||p.n.split(' ').at(-1)))} line</b><span class="line-blurb">${esc((SITE.lineBlurbs||[])[i]||'')}</span><small>${n} people</small></button>`}).join('')}</div>`+
  (()=>{const [id]=GP[line]||[];if(!P[id])return '';const m=lineOf(id);const gens=[...new Set(m.values())].sort((a,b)=>a-b);
    return gens.map(g=>{const ids=[...m].filter(([x,gg])=>gg===g&&(!q||(P[x].n+' '+(P[x].bp||'')+' '+(P[x].dp||'')).toLowerCase().includes(q))).map(([x])=>x);return ids.length?`<div class="line-gen"><h3>${GEN_NAME(g)}</h3><div class="plist">${ids.map(x=>{const p=P[x],n=storiesFor(x).length;return `<button class="prow" data-open="${x}">${av(p)}<span><b>${esc(p.n)}</b><small>${esc(years(p))}${p.bp&&!p.lv?' · '+esc(p.bp.split(',')[0]):''}</small></span>${n?`<span class="stmark" title="${n} stories">${n}</span>`:''}</button>`}).join('')}</div></div>`:''}).join('')})();}
function renderPeople(){if(pview==='lines'){renderLines();return}const q=($('#pq').value||'').toLowerCase();
  const list=Object.entries(P).filter(([id,p])=>!p.virtual&&(pf==='all'||(pf==='st'?storiesFor(id).length:photoSide(id)===pf))&&(!q||(p.n+' '+p.bp+' '+p.dp).toLowerCase().includes(q)))
    .sort((a,b)=>(a[1].s||'').localeCompare(b[1].s||'')||(a[1].n).localeCompare(b[1].n));
  const html=PGROUPS.map(([f,label])=>{const g=list.filter(([id,p])=>f(p.gen==null?99:p.gen));return g.length?`<div class="group"><h3 class="gh">${label} · ${g.length}</h3><div class="plist">${g.map(([id,p])=>{const n=storiesFor(id).length;return `<button class="prow" data-open="${id}">${av(p)}<span><b>${esc(p.n)}</b><small>${esc(years(p))}${p.bp&&!p.lv?' · '+esc(p.bp.split(',')[0]):''}</small></span>${n?`<span class="stmark" title="${n} stories">${n}</span>`:''}</button>`}).join('')}</div></div>`:''}).join('');
  $('#pgroups').innerHTML=html||'<p class="empty">Nobody matches. Clear the filter to see everyone.</p>'}
$('#pfilters').onclick=e=>{const v=e.target.closest('[data-view]');if(v){pview=v.dataset.view;$$('#pfilters [data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===v)));$$('#pfilters [data-f]').forEach(x=>x.hidden=pview==='lines');renderPeople();return}const b=e.target.closest('[data-f]');if(!b)return;pf=b.dataset.f;syncChips('#pfilters',pf);renderPeople()};
$$('#pfilters [data-f]').forEach(x=>x.hidden=true);
$('#pq').oninput=renderPeople;$('#pgroups').onclick=e=>{const l=e.target.closest('[data-line]');if(l){line=+l.dataset.line;renderLines();return}const b=e.target.closest('[data-open]');if(b)openPerson(b.dataset.open)};

/* ---------- photos ---------- */
const photos=[];const seen=new Set();
const photoSide=(id,path=new Set())=>{const p=P[id];if(!p||path.has(id))return '';if(p.side)return p.side;const sides=[...new Set([p.f,p.m].filter(Boolean).map(parent=>photoSide(parent,new Set([...path,id]))).filter(Boolean))];return sides.length===1?sides[0]:''};
STORIES.forEach(s=>(s.imgs||[]).forEach(i=>{if(!seen.has(i.s)){seen.add(i.s);photos.push({s:i.s,t:i.s,c:i.cap,kind:i.kind,side:s.side,news:i.s.includes('/news/')?1:0,story:s.id,id:(s.people||[])[0],source:C.photoSources?.[i.s]?.url||''})}}));
Object.entries(P).forEach(([id,p])=>(p.ph||[]).forEach(ph=>{const s=phSrc(ph);if(seen.has(s))return;seen.add(s);const caption=ph.c&&!/^(IMG|Photo|Android)/i.test(ph.c)?(ph.c.includes(p.n)?ph.c:p.n+' — '+ph.c):p.n;photos.push({s,t:phThumb(ph),c:caption,kind:ph.kind,side:photoSide(id),id})}));
(C.archivePhotos||[]).forEach(i=>{if(!seen.has(i.s)){seen.add(i.s);photos.push({s:i.s,t:i.s,c:i.cap,side:i.side,story:i.story,source:i.source})}});
let activePhoto=null,photoFocus=null;
function setPhotoVariant(variant){
 const mode=variant===true?'restored':variant===false?'original':variant;activePhoto.mode=mode;
 const r=edition(activePhoto.src),edited=r?.colorized||r?.s,src=mode==='colorized'&&r?.colorized?r.colorized:mode==='restored'&&r?r.s:activePhoto.src;
 const colorLabel=r?.labels?.c||'Colorized',editedLabel=r?.colorized?colorLabel:'Restored';
 const comparing=mode==='compare'&&Boolean(edited);
 $('#lbimg').hidden=comparing;$('#photoCompare').hidden=!comparing;$('#retryPhoto').hidden=true;
 if(comparing){$('#compareOriginal').src=activePhoto.src;$('#compareOriginal').alt=activePhoto.cap+' — original';$('#compareEdited').src=edited;$('#compareEdited').alt=activePhoto.cap+' — '+editedLabel.toLowerCase();$('#compareLabel').textContent=editedLabel;$('#compareRange').value=50;$('#photoCompare').style.setProperty('--compare-position','50%');}else{$('#lbimg').src=src;$('#lbimg').alt=activePhoto.cap+(mode==='colorized'?' — '+colorLabel.toLowerCase():mode==='restored'&&r?' — restored copy':' — original');}
 $('#openPhoto').href=comparing?edited:src;
 for(const [id,key] of [['restoredPhoto','restored'],['originalPhoto','original'],['colorizedPhoto','colorized'],['comparePhoto','compare']])$('#'+id).setAttribute('aria-pressed',String(mode===key));
 const colorNote=r?.edit_note||'AI-colorized interpretation. Original colors are not documented.';
 $('#photoNote').textContent=comparing?'Drag the divider or use the arrow keys to compare. '+(r?.colorized?colorNote:'AI-restored copy; compare the original for historical detail.'):mode==='colorized'?colorNote:mode==='restored'&&r?'AI-restored copy. Compare with the original for historical detail.':'Original photograph or source scan.';
 if(mode!=='original'&&r?.note)$('#photoNote').textContent+=' '+r.note;
 $('#photoFrame').classList.remove('zoomed');$('#zoomPhoto').hidden=comparing;$('#zoomPhoto').textContent='Zoom in';$('#zoomPhoto').setAttribute('aria-pressed','false');
}
$('#compareRange').oninput=e=>$('#photoCompare').style.setProperty('--compare-position',e.target.value+'%');
$('#comparePhoto').onclick=()=>setPhotoVariant('compare');
$('#compareOriginal').onload=()=>{const im=$('#compareOriginal');$('#photoCompare').style.setProperty('--compare-ratio',im.naturalWidth+'/'+im.naturalHeight);$('#photoCompare').style.setProperty('--compare-aspect',im.naturalWidth/im.naturalHeight)};
$('#compareEdited').onerror=()=>{setPhotoVariant('original');$('#photoNote').textContent='The edited copy could not load. Showing the original.'};
$('#compareOriginal').onerror=()=>{setPhotoVariant('original')};
function lightbox(src,cap,link,keepFocus=false){if(!keepFocus)photoFocus=document.activeElement;activePhoto={src,cap:cap||''};const r=edition(src);$('#restoredPhoto').hidden=!r?.s;$('#originalPhoto').hidden=!r;$('#comparePhoto').hidden=!r||r.compare===false;$('#colorizedPhoto').hidden=!r?.colorized;$('#colorizedPhoto').textContent=r?.labels?.c||'Colorized';setPhotoVariant(r?.colorized?'colorized':r?.s?'restored':'original');const archival=(C.archivePhotos||[]).find(i=>i.s===src);$('#lbcap').innerHTML=esc(cap||'')+(archival?.source?'<br>Source: '+sourceHTML(archival.source):'')+(link?` · <a href="${link}">${link.includes('story')?'Read the story':'Open their page'}</a>`:'');$('#lb').classList.add('on');features?.photoOpened({src});if(!keepFocus)$('#lbx').focus()}
function closeLB(){const wasOpen=$('#lb').classList.contains('on');$('#lb').classList.remove('on');if(wasOpen&&photoFocus?.isConnected)queueMicrotask(()=>photoFocus.focus())}
$('#lbimg').onerror=()=>{if(activePhoto?.mode!=='original'){setPhotoVariant(false);$('#photoNote').textContent='This edited copy could not load. Showing the original.'}else{$('#lbimg').hidden=true;$('#retryPhoto').hidden=false;$('#photoNote').textContent='This photograph could not load. Try again, or close it to keep exploring.'}};
$('#retryPhoto').onclick=()=>{const mode=activePhoto.mode;setPhotoVariant(mode);$('#lbimg').src=$('#openPhoto').getAttribute('href')+'?retry='+Date.now()};
$('#colorizedPhoto').onclick=()=>setPhotoVariant('colorized');$('#restoredPhoto').onclick=()=>setPhotoVariant(true);$('#originalPhoto').onclick=()=>setPhotoVariant(false);$('#zoomPhoto').onclick=()=>{const on=$('#photoFrame').classList.toggle('zoomed');$('#zoomPhoto').textContent=on?'Fit photograph':'Zoom in';$('#zoomPhoto').setAttribute('aria-pressed',String(on))};
$('#lb').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=$$('#lb button,#lb a,#lb input').filter(el=>!el.hidden&&el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-view-photo]');if(!b)return;const src=b.dataset.viewPhoto;const m=slides.find(s=>s.s===src)||STORIES.flatMap(s=>s.imgs||[]).find(m=>m.s===src);lightbox(src,m?.cap||'Family photograph')});
$('#lbx').onclick=closeLB;$('#lb').onclick=e=>{if(e.target.id==='lb'||(e.target.tagName==='A'&&e.target.getAttribute('href')?.startsWith('#')))closeLB()};

/* ---------- timeline + about ---------- */
const timelineEvents=C.timeline.map(t=>({year:t.y,text:t.t,side:t.side,href:SBY[t.story]?'#/story/'+t.story:'',search:SBY[t.story]?.title||''}));
let timelineBrowser;
function renderTimeline(){timelineBrowser ||= ArchiveTimeline.init({container:$('#timelineBrowser'),events:timelineEvents,sides:[['N',"Mom's side"],['J',"Dad's side"]]});timelineBrowser.render()}
ArchiveTimeline.preview($('#homeTimeline'),timelineEvents);
$('#fixes').innerHTML=(C.fixes||[]).map(f=>`<div><b>${esc(f.who)}</b>${esc(f.fix)}</div>`).join('');if(!(C.fixes||[]).length){$('#fixes').hidden=true;$('#fixes-title').hidden=true}

/* ---------- search ---------- */
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if($('#lb').classList.contains('on'))closeLB();else closePanel()});

const [{initExplore},{initGallery}]=await Promise.all([import('./explore.js?v=20261102b'),import('./gallery.js?v=20261102c')]);
const explore=initExplore({P:Object.fromEntries(Object.entries(P).filter(([,p])=>!p.virtual).map(([id,p])=>[id,{...p,side:photoSide(id)}])),STORIES:LIST,C,esc,photo,restored,years,relName,storyCard,SITE});
const {renderPhotos,renderRecords,items:galleryItems}=initGallery({photos,C,esc,restored,lightbox});
const registry=galleryItems.map(p=>{const r=edition(p.s),archive=(C.archivePhotos||[]).find(a=>a.s===p.s);return{src:p.s,caption:p.caption||p.c,kind:p.kind==='records'?'record':'photo',source:p.source||r?.source||archive?.source||'',date:archive?.date||'',place:archive?.place||'',notes:[r?.method,r?.note,r?.colorized?(r.edit_note||'AI-colorized interpretation; original colors are not documented.'):''].filter(Boolean).join(' '),versions:{original:p.s,restored:r?.s,colorized:r?.colorized},story:p.story};});
features=ArchiveFeatures.init({site:SITE.id,resolveStoryId:storyId,timeline:C.timeline.map(e=>({year:e.y,text:e.t,story:e.story})),journeys:Object.values(TOPICS).map(topic=>({title:topic.label,description:topic.copy,stories:[...new Set([...(topic.journey||[]).map(storyId).filter(id=>topic.ids.includes(id)),...topic.ids])].slice(0,12)})),people:P,root:ROOT,personInfo:id=>({name:P[id].n,years:years(P[id])}),stories:STORIES.map(s=>({id:s.id,title:s.title,summary:s.hook||s.subject?.rel||'',text:[...(s.body||[]),...(s.people||[]).map(id=>P[id]?.n||'')].join(' ')})),photos:registry,home:$('#v-home'),searchId:'v-search',queryResults:'#qres',searchHash:(q,kind)=>'#/search/'+encodeURIComponent(q)+'/'+kind,openPerson:id=>{if(location.hash==='#/person/'+id)openPerson(id);else location.hash='#/person/'+id;},openStory:id=>{if(location.hash==='#/story/'+id)renderStory(id);else location.hash='#/story/'+id;},openPhoto:(p,keep)=>lightbox(p.src,p.caption,p.story?'#/story/'+p.story:'',keep),viewer:$('#lb'),photoMount:'.photo-tools'});
$('#collection-summary').innerHTML=[[`#/people`,realPeople+' people'],[`#/stories`,LIST.length+' stories'],[`#/photos`,galleryItems.filter(x=>x.kind!=='records').length+' photographs'],[`#/records`,galleryItems.filter(x=>x.kind==='records').length+' records'],[`#/timeline`,C.timeline.length+' dated events']].map(([h,t])=>`<a href="${h}">${t}</a>`).join('<span aria-hidden="true">·</span>');
$('#load-status').hidden=true;appReady=true;
// old-style links (#s=..., #p=...) still work
const h=location.hash;if(h.startsWith('#s='))location.replace('#/story/'+h.slice(3));else if(h.startsWith('#p='))location.replace('#/person/'+h.slice(3));
route();features.restoreScroll();
})().catch(error=>{console.error('Family history could not be opened:',error);const status=document.querySelector('#load-status');status.hidden=false;status.innerHTML='<strong>Family history could not load.</strong><p>Check your connection, then try again.</p><button class="btn" id="retryLoad">Try again</button>';document.querySelector('#retryLoad').onclick=()=>location.reload()});
