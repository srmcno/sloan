'use strict';
// Each location is an approximate community or county seat tied to a cited story.
const places = [
 {id:'broken-bow',side:'maternal',name:'Broken Bow, Oklahoma',lat:34.0293,lng:-94.7391,detail:'Larry Sandridge grew up in Broken Bow; his family’s story includes Navy service and later generations in the area.',story:'sandridge-broken-bow-research-lead'},
 {id:'wheelock',side:'maternal',name:'Wheelock, Oklahoma',lat:33.999,lng:-94.881,detail:'Alfreda Whitfield was born at Wheelock. Family records trace her maternal family into the Choctaw Nation.',story:'alfreda-whitfield-sandridge'},
 {id:'mccurtain',side:'maternal',name:'McCurtain County, Oklahoma',lat:33.8957,lng:-94.8263,detail:'A 1930 census records Violet Box in the household of Tyro and Annie Box. The marker is placed at Idabel, the county seat.',story:'alfreda-whitfield-sandridge'},
 {id:'brazoria',side:'maternal',name:'Brazoria County, Texas',lat:29.1689,lng:-95.4319,detail:'Floyd and Alice Livesay’s family appears in the county’s 1900 census. The marker is placed at Angleton, the county seat.',story:'livesay-illinois-to-texas'},
 {id:'washington-il',side:'maternal',name:'Washington County, Illinois',lat:38.3437,lng:-89.3801,detail:'A boy named Floyd H. Livesay appears with Lydia and David Livesay in the 1860 census. The earlier relationship remains unproved.',story:'livesay-illinois-to-texas'},
 {id:'hugo',side:'paternal',name:'Hugo and the Choctaw Nation',lat:34.0107,lng:-95.5097,detail:'Thompson, Tims and Pisachubbe family records connect to the Choctaw Nation and the Hugo area.',story:'edith-thompson-slaton'},
 {id:'stone',side:'paternal',name:'Stone County, Arkansas',lat:35.8687,lng:-92.1177,detail:'Henry and Hannah Moffitt’s family lived in the Arkansas hill country around Mountain View.',story:'henryh'},
 {id:'cane-creek',side:'paternal',name:'Cane Creek, North Carolina',lat:35.889,lng:-79.43,detail:'William Moffitt and Mary Davies married at Cane Creek Meeting in 1763.',story:'marydavies'},
 {id:'scottsville',side:'paternal',name:'Allen County, Kentucky',lat:36.7534,lng:-86.1905,detail:'Smith and Satterfield family branches lived in the Scottsville and Allen County area.',story:'johnc'}
];
// Regional points are illustrative labels for Dad's estimates, not boundaries.
const regions = [
 ['West Midlands',15,52.48,-2.05], ['Southeastern England',14,51.25,0.55],
 ['Northern England',12,54.55,-2.1], ['Devon & Somerset',7,50.9,-3.55],
 ['East Midlands & Yorkshire',6,53.35,-1.1], ['Ulster',7,54.7,-6.4],
 ['Scottish Lowlands & Central Belt',4,56.0,-3.6], ['Leinster',3,53.35,-6.55],
 ['Connacht',2,53.8,-9.1], ['Munster',2,52.15,-8.4],
 ['Northern Wales & North West England',2,53.1,-3.35], ['Southern Wales',2,51.65,-3.85],
 ['North East Scotland',1,57.2,-2.5], ['Belgium',4,50.6,4.6],
 ['Northeastern Germany',1,53.1,13.2], ['Indigenous Americas: Gulf Coast & Mississippi Basin (USA)',18,32,-91]
].map(([name,percent,lat,lng],index)=>({
 id:'dna-'+index, side:'dna', name, lat, lng,
 detail:'Dad’s October 2026 estimate: '+percent+'%. A simple half-of-Dad illustration for Sloan is '+(percent/2)+'%; this is not Sloan’s measured result or guaranteed inheritance. The marker is an approximate region label.',
 story:null
}));
const branch = document.querySelector('#branch');
const cards = document.querySelector('#places');
const status = document.querySelector('#map-status');
let map, markers = [], detail;
const label = side => side === 'dna' ? 'Dad’s DNA estimate' : side === 'maternal' ? 'Mom’s side' : 'Dad’s side';
function selectPlace(place) {
  document.querySelectorAll('.place').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.id === place.id)));
  if (!detail) { detail = document.createElement('div'); detail.className='detail'; detail.setAttribute('aria-live','polite'); cards.before(detail); }
  detail.replaceChildren();
  const title=document.createElement('h3'); title.textContent=place.name;
  const text=document.createElement('p'); text.textContent=place.detail;
  const link=document.createElement('a'); link.href=place.story ? './#/story/'+encodeURIComponent(place.story) : '#dna-results'; link.textContent=place.story ? 'Read the family story →' : 'Read about these estimates →';
  detail.append(title,text,link);
  if(map) { map.setView([place.lat,place.lng],8); const item=markers.find(m=>m.place.id===place.id); if(item) item.marker.openPopup(); }
}
function render() {
 const shown=branch.value==='dna' ? regions : places.filter(p=>branch.value==='all'||p.side===branch.value);
 cards.replaceChildren(); if(detail){detail.remove();detail=null;}
 if(map) { markers.forEach(m=>m.marker.remove()); markers=[]; }
 shown.forEach(place=>{
  const button=document.createElement('button'); button.type='button'; button.className='place '+place.side; button.dataset.id=place.id; button.setAttribute('aria-pressed','false');
  const badge=document.createElement('span'); badge.textContent=label(place.side); const name=document.createElement('strong');name.textContent=place.name; const summary=document.createElement('small');summary.textContent=place.detail; button.append(badge,name,summary); button.addEventListener('click',()=>selectPlace(place));cards.append(button);
  if(map) {const marker=L.circleMarker([place.lat,place.lng],{radius:9,color:'#fff',weight:2,fillColor:place.side==='dna'?'#655895':place.side==='maternal'?'#a66c23':'#22688b',fillOpacity:1}).addTo(map);marker.bindPopup('<strong>'+place.name+'</strong><br>'+label(place.side)); marker.on('click',()=>selectPlace(place)); markers.push({place,marker});}
 });
 if(map && shown.length) map.fitBounds(L.latLngBounds(shown.map(p=>[p.lat,p.lng])),{padding:[32,32],maxZoom:5});
}
branch.addEventListener('change',render);
if (typeof L !== 'undefined') {
 try { map=L.map('map',{scrollWheelZoom:false}); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map); status.textContent='Use the map controls or the place cards below to explore.'; }
 catch(e) { status.textContent='The map could not load. You can still explore each place below.'; }
} else { status.textContent='The map could not load. You can still explore each place below.'; }
render();
