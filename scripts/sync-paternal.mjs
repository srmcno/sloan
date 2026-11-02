/* Synchronize a committed public family archive into the child-centered archive.
   Refuse conflicts, suspicious living-person text, missing media and unsafe paths. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {adaptFamily} from '../adapter.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2), source=path.resolve(args.find(a=>!a.startsWith('--')) || '/Users/stephenmoffitt/moffitt-thompson-roots');
const apply=args.includes('--apply');
const git=(...a)=>execFileSync('git',['-C',source,...a],{encoding:'utf8',maxBuffer:40*1024*1024});
const read=(rev,file)=>JSON.parse(git('show',`${rev}:${file}`));
const base=fs.readFileSync(path.join(root,'.paternal-revision'),'utf8').trim(), latest=git('rev-parse','HEAD').trim();
if(!/^[a-f0-9]{40}$/.test(base)||!/^[a-f0-9]{40}$/.test(latest)) throw Error('Invalid revision');
if(base===latest){console.log('Paternal archive is current.');process.exit(0);}
const policy=JSON.parse(fs.readFileSync(path.join(root,'paternal-policy.json')));
const hash=s=>createHash('sha256').update(s.toLowerCase()).digest('hex');
const sourceOld=read(base,'tree.json'), sourceNew=read(latest,'tree.json');
const knownLiving=[...Object.values(sourceOld.people),...Object.values(sourceNew.people)].filter(p=>p.lv).map(p=>p.n).filter(n=>n && n.length>=5);
function protectedAt(text,rule) { for(let i=0;i<=text.length-rule.length;i++) if(hash(text.slice(i,i+rule.length))===rule.hash)return i; return -1; }
function redact(s) { for(const rule of policy.replacements) { let i; while((i=protectedAt(s,rule))>=0) s=s.slice(0,i)+rule.to+s.slice(i+rule.length); } return s; }
function check(value,where) {
 if(typeof value==='string') {
  const s=value.toLowerCase();
  if(knownLiving.some(n=>s.includes(n.toLowerCase()))||policy.blocked.some(r=>protectedAt(value,r)>=0)) throw Error(`Potential living-person identifier in ${where}; review required.`);
 } else if(Array.isArray(value))value.forEach((v,i)=>check(v,`${where}[${i}]`));
 else if(value && typeof value==='object')Object.entries(value).forEach(([k,v])=>check(v,`${where}.${k}`));
}
function transformStrings(value) {if(typeof value==='string')return redact(value); if(Array.isArray(value))return value.map(transformStrings); if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,transformStrings(v)])); return value;}
globalThis.window={SITE:{rootName:'Family member',heroKeys:['henry_hannah','gilbert_parsis','daniel_oneal','vashti_framed','joel_ira','mary_tinsley','rebecca_graves','parsis_portrait','william_junior','faye_moffitt']}};
function normalized(rev,tree){
 const {T,C}=adaptFamily(read(rev,'data.json'),tree);
 for(const s of C.stories){s.side='J';if(s.gen!=null)s.gen++;if(s.subject)s.subject.rel='Paternal family history';s.body=(s.body||[]).map(redact);}
 for(const t of C.timeline)t.side='J';for(const p of C.archivePhotos)p.side='J';
 return {T,C};
}
const old=normalized(base,sourceOld), next=normalized(latest,sourceNew);
const target=JSON.parse(fs.readFileSync(path.join(root,'content.json'))), tree=JSON.parse(fs.readFileSync(path.join(root,'tree.json')));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b), updates=[];
const oldStories=new Map(old.C.stories.map(x=>[x.id,x])), newStories=new Map(next.C.stories.map(x=>[x.id,x]));
// An upstream story that was removed (for example merged into another) is removed here only when the local copy is unchanged.
const removedStories=[];
for(const [id,item] of oldStories)if(!newStories.has(id)){
 const i=target.stories.findIndex(s=>s.id===id);if(i<0)continue;
 if(!same(target.stories[i],item)&&!same(target.stories[i],transformStrings(item)))throw Error(`Upstream story removed: ${id}; local copy differs, review required.`);
 target.stories.splice(i,1);removedStories.push(id);
}
for(const [id,item] of newStories){const prior=oldStories.get(id), index=target.stories.findIndex(s=>s.id===id);if(same(prior,item))continue;
 if(prior && (index<0||!same(target.stories[index],prior)))throw Error(`Local story conflict: ${id}`);
 if(!prior&&index>=0)throw Error(`New story conflicts: ${id}`);
 const safe=transformStrings(item);check(safe,`story ${id}`);if(index<0)target.stories.push(safe);else target.stories[index]=safe;updates.push(id);
}
// Apply upstream changes entry by entry, so maternal-only entries and local privacy removals survive.
// An entry changed both upstream and locally still stops the sync for review.
const entryKey=x=>x&&typeof x==='object'&&typeof x.s==='string'?x.s:JSON.stringify(x);
function mergeEntries(oldV,newV,localV,key){
 if(same(localV,oldV))return newV;
 const list=Array.isArray(newV), toMap=v=>list?new Map((v||[]).map(x=>[entryKey(x),x])):new Map(Object.entries(v||{}));
 const o=toMap(oldV),n=toMap(newV),l=toMap(localV);
 for(const k of new Set([...o.keys(),...n.keys()])){
  const ov=o.get(k),nv=n.get(k),lv=l.get(k);
  if(same(ov,nv))continue;
  if(!same(lv,ov)&&!same(lv,nv))throw Error(`Local ${key} conflict at ${k}; review required.`);
  if(nv===undefined)l.delete(k);else l.set(k,nv);
 }
 return list?[...l.values()]:Object.fromEntries(l);
}
for(const key of ['hero','storyAliases','restorations','archivePhotos','photoSources'])if(!same(old.C[key],next.C[key])){
 const prior=transformStrings(old.C[key]), safe=transformStrings(next.C[key]);check(safe,key);
 target[key]=mergeEntries(prior,safe,target[key],key);
}
const oldEvents=new Map(old.C.timeline.map(e=>[JSON.stringify(e),e])), newEvents=new Map(next.C.timeline.map(e=>[JSON.stringify(e),e]));
for(const [key] of oldEvents)if(!newEvents.has(key)){const i=target.timeline.findIndex(e=>JSON.stringify(e)===key);if(i<0)throw Error('Timeline conflict');target.timeline.splice(i,1);}
for(const [key,e] of newEvents)if(!oldEvents.has(key)){check(e,'timeline');if(!target.timeline.some(v=>JSON.stringify(v)===key))target.timeline.push(e);}
// Merge upstream person changes, keeping child and maternal records independent.
for(const [id,p] of Object.entries(sourceOld.people))if(!sourceNew.people[id])throw Error(`Upstream removed person ${id}; review required.`);
for(const [id,p] of Object.entries(sourceNew.people)){
 const before=sourceOld.people[id]; if(same(before,p))continue;
 const adapted=next.T.people[id], current=tree.people[id];
 if(before&&!current)throw Error(`Missing local person ${id}`);
 if(!before&&current)throw Error(`New person conflicts: ${id}`);
 if(current&&current.lv!==!!p.lv)throw Error(`Living status changed for ${id}; review required.`);
 const result={...adapted,side:'J',gen:adapted.gen==null?null:adapted.gen+1};
 if(p.lv){Object.assign(result,{n:current?.n||'Living person',g:current?.g||'Living person',s:'',b:'',bp:'',d:'',dp:'',ph:[],img:'',note:'',source_urls:[],entry:null,kv:[]});}
 else check(result,`person ${id}`);
 tree.people[id]=result;
}
// Rebuild relationships for the full tree, retaining the child's parents and maternal branch.
// Marriages recorded outside the paternal side (a couple with no child in the tree) cannot be
// rebuilt from parent links, so keep those spouse links and restore them after the rebuild.
const keptSpouses=[];for(const [id,p] of Object.entries(tree.people))for(const s of p.sp||[])if(tree.people[s]&&(p.side!=='J'||tree.people[s].side!=='J'))keptSpouses.push([id,s]);
for(const p of Object.values(tree.people)){p.ch=[];p.sp=[];}
for(const [id,p] of Object.entries(tree.people))for(const parent of [p.f,p.m]){if(!parent)continue;if(!tree.people[parent])throw Error(`Missing parent ${parent}`);tree.people[parent].ch.push(id);}
for(const p of Object.values(tree.people))if(p.f&&p.m){if(!tree.people[p.f].sp.includes(p.m))tree.people[p.f].sp.push(p.m);if(!tree.people[p.m].sp.includes(p.f))tree.people[p.m].sp.push(p.f);}
for(const [a,b] of keptSpouses){if(!tree.people[a].sp.includes(b))tree.people[a].sp.push(b);if(!tree.people[b].sp.includes(a))tree.people[b].sp.push(a);}
// Copy only referenced, safe relative media from the committed source revision.
const paths=new Set();function collect(x){if(typeof x==='string'&&x.startsWith('img/'))paths.add(x);else if(Array.isArray(x))x.forEach(collect);else if(x&&typeof x==='object')Object.entries(x).forEach(([k,v])=>{collect(k);collect(v);});} collect(target);collect(tree);
const files=[];for(const rel of paths){if(!/^img\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|gif|pdf)$/i.test(rel)||rel.split('/').includes('..'))throw Error(`Unsafe media path: ${rel}`);
 const targetFile=path.join(root,rel); if(fs.existsSync(targetFile))continue;
 let blob;try{blob=execFileSync('git',['-C',source,'show',`${latest}:${rel}`],{maxBuffer:25*1024*1024});}catch{throw Error(`Missing source media: ${rel}`);}files.push([targetFile,blob]);}
console.log(`${apply?'Applying':'Previewing'} ${base.slice(0,7)} → ${latest.slice(0,7)}: ${updates.length} stories, ${removedStories.length} removed, ${files.length} new assets.`);
if(apply){for(const [dest,blob] of files){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,blob);}fs.writeFileSync(path.join(root,'content.json'),JSON.stringify(target,null,1)+'\n');fs.writeFileSync(path.join(root,'tree.json'),JSON.stringify(tree));fs.writeFileSync(path.join(root,'.paternal-revision'),latest+'\n');}
