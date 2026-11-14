// Estado de repaso exclusivamente local: no se envían respuestas ni identificadores.
export const REVIEW_STORAGE_KEY='schola-morphology-review-v1';
export const REVIEW_SCHEMA=1;
const INTERVAL_DAYS=[0,1,3,7,14,30,90];
const DAY=86400000;
export function emptyReview(){return {version:REVIEW_SCHEMA,items:{}}}
export function sanitizeReview(value){
  if(value?.version!==REVIEW_SCHEMA||!value.items||typeof value.items!=='object'||Array.isArray(value.items))
    return emptyReview();
  const items={};
  for(const [key,r] of Object.entries(value.items).slice(0,2000)){
    if(!/^[\w:.-]{1,180}$/.test(key)||!r||typeof r!=='object')continue;
    if(!Number.isSafeInteger(r.seen)||r.seen<0||r.seen>100000||
      !Number.isSafeInteger(r.right)||r.right<0||
      !Number.isSafeInteger(r.wrong)||r.wrong<0||
      !Number.isFinite(r.dueAt)||!Number.isFinite(r.lastAt)||
      !Number.isInteger(r.box)||r.box<0||r.box>6)continue;
    items[key]={seen:r.seen,right:r.right,wrong:r.wrong,box:r.box,
      dueAt:r.dueAt,lastAt:r.lastAt};
  }
  return {version:REVIEW_SCHEMA,items};
}
export function reviewKey(question){
  const value=question?.reviewId||question?.id;
  if(typeof value!=='string'||!/^[\w:.-]{1,180}$/.test(value))
    throw Error('Identificador de ejercicio inválido');
  return value;
}
export function applyReview(state,key,correct,now=Date.now()){
  if(typeof correct!=='boolean'||!Number.isFinite(now))throw Error('Resultado inválido');
  const safe=sanitizeReview(state);
  if(!/^[\w:.-]{1,180}$/.test(key))throw Error('Clave de repaso inválida');
  const old=safe.items[key]||{seen:0,right:0,wrong:0,box:0,dueAt:0,lastAt:0};
  const box=correct?Math.min(6,old.box+1):0;
  const next={seen:Math.min(100000,old.seen+1),
    right:old.right+(correct?1:0),wrong:old.wrong+(correct?0:1),
    box,dueAt:correct?now+INTERVAL_DAYS[box]*DAY:now,lastAt:now};
  const entries=Object.entries(safe.items).filter(([k])=>k!==key);
  // Evitar crecimiento ilimitado sin eliminar fichas más recientes.
  entries.sort((a,b)=>b[1].lastAt-a[1].lastAt);
  return {version:REVIEW_SCHEMA,items:{...Object.fromEntries(entries.slice(0,1999)),[key]:next}};
}
export function reviewCounts(state,now=Date.now()){
  const records=Object.values(sanitizeReview(state).items);
  return {practiced:records.length,errors:records.filter(r=>r.wrong>0).length,
    due:records.filter(r=>r.seen>0&&r.dueAt<=now).length};
}
export function selectReviewCandidates(candidates,{mode='all',state=emptyReview(),
  limit=10,rng=Math.random,now=Date.now(),balanceByKind=false}={}){
  if(!['all','smart','errors','due','new'].includes(mode)||!Number.isInteger(limit)||
    limit<1||limit>30)throw Error('Filtro de repaso inválido');
  const saved=sanitizeReview(state).items;
  const groups={new:[],due:[],errors:[],later:[]};
  for(const candidate of candidates){
    const id=reviewKey(candidate),r=saved[id];
    if(!r){groups.new.push(candidate);continue}
    if(r.wrong>0)groups.errors.push(candidate);
    if(r.dueAt<=now)groups.due.push(candidate);
    else groups.later.push(candidate);
  }
  const shuffled=list=>{
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  };
  const difficult=shuffled(groups.errors).sort((a,b)=>{
    const ra=saved[reviewKey(a)],rb=saved[reviewKey(b)];
    return (rb?.wrong||0)-(ra?.wrong||0);
  });
  const unique=(...lists)=>{
    const seen=new Set(),picked=[];
    for(const list of lists)for(const candidate of list){
      const id=reviewKey(candidate);
      if(seen.has(id))continue;
      seen.add(id);picked.push(candidate);
      if(!balanceByKind&&picked.length===limit)return picked;
    }
    return picked;
  };
  // Con «Todas las categorías» en Latín II no debe ganar siempre el
  // enorme número de formas verbales. Se mezclan categorías y, dentro
  // de cada una, se conserva el orden de prioridad del repaso elegido.
  const take=items=>{
    if(!balanceByKind)return items.slice(0,limit);
    const buckets=new Map();
    for(const item of items){
      const kind=item.kind||'sin-categoria';
      if(!buckets.has(kind))buckets.set(kind,[]);
      buckets.get(kind).push(item);
    }
    const kinds=shuffled([...buckets.keys()]);
    const positions=new Map(kinds.map(kind=>[kind,0]));
    const selected=[];
    while(selected.length<limit){
      let added=false;
      for(const kind of kinds){
        const at=positions.get(kind),bucket=buckets.get(kind);
        if(at>=bucket.length)continue;
        selected.push(bucket[at]);
        positions.set(kind,at+1);
        added=true;
        if(selected.length===limit)break;
      }
      if(!added)break;
    }
    return selected;
  };
  if(mode==='errors')return take(unique(difficult));
  if(mode==='due')return take(unique(shuffled(groups.due)));
  if(mode==='new')return take(unique(shuffled(groups.new)));
  if(mode==='smart')return take(unique(shuffled(groups.due),shuffled(groups.new),shuffled(groups.later)));
  return take(unique(shuffled(candidates)));
}
export function readReview(storage){
  try{return sanitizeReview(JSON.parse(storage.getItem(REVIEW_STORAGE_KEY)||'null'))}
  catch{return emptyReview()}
}
export function writeReview(storage,state){
  try{storage.setItem(REVIEW_STORAGE_KEY,JSON.stringify(sanitizeReview(state)));return true}
  catch{return false}
}
