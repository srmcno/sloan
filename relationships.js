/**
 * Names relationships described by recorded parent and spouse links.
 * Labels do not establish the accuracy or confidence of those source links.
 * Each instance belongs to one fixed dataset; create another after changing it.
 */
export function createRelationships(P, ROOT, rootLabel = 'Rachel') {
  const has = id => typeof id === 'string' && Object.hasOwn(P, id) && P[id] != null;
  const parents = new Map(), parentKinds = new Map(), spouses = new Map();
  for (const [id, person] of Object.entries(P)) {
    const links=[{id:person?.f,kind:person?.parentKinds?.f},{id:person?.m,kind:person?.parentKinds?.m},...(Array.isArray(person?.otherParents)?person.otherParents:[])], kinds=new Map();
    for(const link of links)if(has(link?.id)&&link.id!==id&&!kinds.has(link.id))kinds.set(link.id,link.kind);
    parentKinds.set(id,kinds); parents.set(id,[...kinds.keys()]);
    spouses.set(id, new Set());
  }
  // A recorded spouse link is symmetric. Sharing a child does not imply marriage.
  for (const [id, person] of Object.entries(P)) {
    for (const spouse of Array.isArray(person?.sp) ? person.sp : []) {
      if (has(spouse) && spouse !== id) { spouses.get(id).add(spouse); spouses.get(spouse).add(id); }
    }
  }
  // Remove cycle-closing links once, with Rachel's ancestor paths taking priority.
  // Otherwise a malformed reverse link could make the same uncle a nephew too.
  const color = new Map();
  function removeCycles(start) {
    if (!has(start) || color.has(start)) return;
    const stack = [{id:start,index:0,kept:[]}]; color.set(start,1);
    while (stack.length) {
      const frame = stack.at(-1), list = parents.get(frame.id) || [];
      if (frame.index === list.length) {
        parents.set(frame.id,frame.kept); color.set(frame.id,2); stack.pop(); continue;
      }
      const parent = list[frame.index++];
      if (color.get(parent) === 1) continue;
      frame.kept.push(parent);
      if (!color.has(parent)) { color.set(parent,1); stack.push({id:parent,index:0,kept:[]}); }
    }
  }
  removeCycles(ROOT);
  for (const id of [...parents.keys()].sort()) removeCycles(id);
  const ancestryCache = new Map(), pathKindsCache = new Map(), bloodCache = new Map(), resultCache = new Map();
  function ancestors(id) {
    if (ancestryCache.has(id)) return ancestryCache.get(id);
    const distances = new Map(), pathKinds = new Map();
    if (has(id)) {
      distances.set(id, 0); pathKinds.set(id,{birth:false,adoptive:false});
      const queue = [id];
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const child = queue[cursor];
        for (const parent of parents.get(child) || []) {
          if (distances.has(parent)) continue;
          const path=pathKinds.get(child), kind=parentKinds.get(child)?.get(parent);
          distances.set(parent, distances.get(child) + 1);
          pathKinds.set(parent,{birth:path.birth||kind==='birth',adoptive:path.adoptive||kind==='adoptive'});
          queue.push(parent);
        }
      }
    }
    ancestryCache.set(id, distances); pathKindsCache.set(id,pathKinds); return distances;
  }
  const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th')}`;
  const gender = (id, male, female, neutral) => P[id]?.x === 'M' ? male : P[id]?.x === 'F' ? female : neutral;
  const great = (count, noun) => count === 0 ? noun : count === 1 ? `Great-${noun.toLowerCase()}` : `${ordinal(count)} great-${noun.toLowerCase()}`;
  const ancestorName = (id, distance) => distance === 1 ? gender(id, 'Father','Mother','Parent') : great(distance - 2, gender(id,'Grandfather','Grandmother','Grandparent'));
  const descendantName = (id, distance) => distance === 1 ? gender(id,'Son','Daughter','Child') : great(distance - 2, gender(id,'Grandson','Granddaughter','Grandchild'));
  function halfSibling(a, b) {
    const aa = parents.get(a) || [], bb = parents.get(b) || [];
    return aa.length === 2 && bb.length === 2 && aa.filter(id => bb.includes(id)).length === 1;
  }
  function fromDistances(root, target, a, b, ancestor) {
    const common = { rootDistance:a, targetDistance:b, commonAncestor:ancestor, distance:a+b };
    if (a === 0 && b === 0) return { ...common, kind:'self', text:'Rachel', rank:0 };
    if (b === 0) return { ...common, kind:'ancestor', text:ancestorName(target,a), rank:0 };
    if (a === 0) return { ...common, kind:'descendant', text:descendantName(target,b), rank:1 };
    if (a === 1 && b === 1) {
      const half = halfSibling(root,target);
      const noun = gender(target,'Brother','Sister','Sibling');
      return { ...common, kind:'sibling', half, text:half ? `Half-${noun.toLowerCase()}` : noun, rank:2 };
    }
    if (b === 1) return { ...common, kind:'avuncular', great:a-2, text:great(a-2,gender(target,'Uncle','Aunt','Aunt/uncle')), rank:2 };
    if (a === 1) return { ...common, kind:'nibling', great:b-2, text:great(b-2,gender(target,'Nephew','Niece','Niece/nephew')), rank:2 };
    const degree = Math.min(a,b)-1, removal = Math.abs(a-b);
    const suffix = removal === 0 ? '' : removal === 1 ? ', once removed' : removal === 2 ? ', twice removed' : `, ${removal} times removed`;
    return { ...common, kind:'cousin', degree, removal, text:`${ordinal(degree)} cousin${suffix}`, rank:2 };
  }
  function compare(a,b) {
    // Equal-length pedigree paths prefer a direct relation, then fewer generations
    // on the longer side. IDs settle remaining ties without depending on input order.
    return a.distance-b.distance || a.rank-b.rank || Math.max(a.rootDistance,a.targetDistance)-Math.max(b.rootDistance,b.targetDistance)
      || a.rootDistance-b.rootDistance || String(a.commonAncestor).localeCompare(String(b.commonAncestor));
  }
  function blood(root, target) {
    const cacheKey = JSON.stringify([root,target]);
    if (bloodCache.has(cacheKey)) return bloodCache.get(cacheKey);
    let best = null;
    for (const [ancestor,a] of ancestors(root)) {
      const b = ancestors(target).get(ancestor);
      if (b == null) continue;
      const candidate = fromDistances(root,target,a,b,ancestor);
      if (!best || compare(candidate,best) < 0) best = candidate;
    }
    bloodCache.set(cacheKey,best); return best;
  }
  const possessive = text => `${text}’s spouse`;
  function marriageLabel(relative, target, throughRootSpouse) {
    if (relative.kind === 'self') return gender(target,'Husband','Wife','Spouse');
    if (relative.kind === 'sibling') return gender(target,'Brother-in-law','Sister-in-law','Sibling-in-law');
    if (relative.kind === 'ancestor') {
      // A parent's spouse can be a stepparent; avoid assuming the marriage timing.
      return throughRootSpouse ? `${relative.text}-in-law` : possessive(relative.text);
    }
    if (relative.kind === 'descendant') {
      if (throughRootSpouse) return `Spouse’s ${relative.text.toLowerCase()}`;
      return `${descendantName(target,relative.targetDistance)}-in-law`;
    }
    if (relative.kind === 'avuncular') return `${great(relative.great,gender(target,'Uncle','Aunt','Aunt/uncle'))} by marriage`;
    if (relative.kind === 'nibling') return `${great(relative.great,gender(target,'Nephew','Niece','Niece/nephew'))} by marriage`;
    return `${relative.text} by marriage`;
  }
  function calculate(id) {
    if (id === ROOT && has(ROOT)) return {label:rootLabel,kind:'self',distance:0};
    if (!has(id) || !has(ROOT)) return {label:'Relationship not determined',kind:'unknown'};
    if (spouses.get(ROOT)?.has(id)) return {label:gender(id,'Husband','Wife','Spouse'),kind:'spouse',distance:1};
    const direct = blood(ROOT,id);
    if (direct) {
      const path=pathKindsCache.get(ROOT)?.get(id);
      const prefix=direct.kind==='ancestor'?(path?.adoptive?'Adoptive ':path?.birth?'Birth ':''):'';
      return {...direct,label:prefix?prefix+direct.text.toLowerCase():direct.text};
    }
    const candidates = [];
    for (const spouse of spouses.get(id) || []) {
      const relative = blood(ROOT,spouse);
      if (relative) candidates.push({...relative,label:marriageLabel(relative,id,false),kind:'marriage',via:spouse,distance:relative.distance+1});
    }
    for (const spouse of spouses.get(ROOT) || []) {
      const relative = blood(spouse,id);
      if (relative) candidates.push({...relative,label:marriageLabel(relative,id,true),kind:'marriage',via:spouse,distance:relative.distance+1});
    }
    candidates.sort((a,b)=>compare(a,b) || a.label.localeCompare(b.label) || a.via.localeCompare(b.via));
    return candidates[0] || {label:'Relationship not determined',kind:'unknown'};
  }
  function describe(id) {
    if (!resultCache.has(id)) resultCache.set(id,Object.freeze(calculate(id)));
    return resultCache.get(id);
  }
  return Object.freeze({label:id=>describe(id).label,describe});
}
