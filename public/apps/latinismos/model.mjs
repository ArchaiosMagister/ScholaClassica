import {items} from './banco.mjs';
export const KEY='scholaclassica-latinismos-v1';
export const MODES=['meaning','term','context','write','mixed','pau'];
export const DEFAULT={filter:'all',from:1,to:87,mode:'mixed',errors:false};
export function normalize(s){return String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe').trim().replace(/\s+/g,' ');}
// La búsqueda tolera tildes; la escritura exige una grafía admitida.
export function normalizeAnswer(s){return String(s??'').normalize('NFC').toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe').trim().replace(/\s+/g,' ');}
export function matches(item,answer){return [item.latinism,...(item.variants??[])].some(v=>normalizeAnswer(v)===normalizeAnswer(answer));}
export function fresh(){return {config:{...DEFAULT},stats:{}};}
export function cleanState(input){
 const s=fresh();if(!input||typeof input!=='object')return s;
 const c=input.config??{};if(['all','even','odd','range'].includes(c.filter))s.config.filter=c.filter;
 if(MODES.includes(c.mode))s.config.mode=c.mode;
 if(Number.isInteger(c.from)&&Number.isInteger(c.to)&&c.from>=1&&c.to<=87&&c.from<=c.to){s.config.from=c.from;s.config.to=c.to;}
 s.config.errors=c.errors===true;
 for(const item of items){const r=input.stats?.[item.number];if(!r||typeof r!=='object')continue;
 const n=v=>Number.isSafeInteger(v)&&v>=0?v:0;
 s.stats[item.number]={correct:n(r.correct),wrong:n(r.wrong),streak:n(r.streak),studied:r.studied===true,lastWrong:r.lastWrong===true,...(r.selfCorrect||r.selfWrong?{selfCorrect:n(r.selfCorrect),selfWrong:n(r.selfWrong)}:{})};}
 return s;
}
export function read(storage){try{return cleanState(JSON.parse(storage.getItem(KEY)||'null'));}catch{return fresh();}}
export function save(storage,state){try{storage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
export function select(config,stats={}){
 if(config.filter==='range'&&(!Number.isInteger(config.from)||!Number.isInteger(config.to)||config.from<1||config.to>87||config.from>config.to))return [];
 return items.filter(i=>(config.filter==='even'?i.number%2===0:config.filter==='odd'?i.number%2===1:config.filter==='range'?i.number>=config.from&&i.number<=config.to:true)&&(!config.errors||stats[i.number]?.lastWrong));
}
export function record(state,number,correct){const r=state.stats[number]??(state.stats[number]={correct:0,wrong:0,streak:0,studied:false,lastWrong:false});if(correct){r.correct++;r.streak++;}else{r.wrong++;r.streak=0;}r.lastWrong=!correct;return r;}
export function recordSelf(state,number,correct){const r=state.stats[number]??(state.stats[number]={correct:0,wrong:0,streak:0,studied:false,lastWrong:false});const key=correct?'selfCorrect':'selfWrong';r[key]=(r[key]??0)+1;return r;}
export function mastered(r){return (r?.streak??0)>=3;}
export function shuffled(array,rng=Math.random){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// Los adverbiales son potencialmente compatibles en una misma oración.
const adverbial=new Set([1,2,3,5,6,7,8,13,21,22,28,29,31,32,33,34,39,40,41,42,43,44,45,46,47,48,55,56,60,61,66,67,77,80,86]);
const nominal=new Set([4,9,10,11,12,14,15,16,17,18,20,23,24,25,26,30,35,37,38,49,50,51,52,53,54,57,58,59,62,63,64,65,68,69,70,71,72,73,74,75,76,79,82,83,84,87]);
const adjectival=new Set([19,36,78,81]);
const family=n=>adverbial.has(n)?'adv':nominal.has(n)?'noun':adjectival.has(n)?'adj':'other';
const overlapping=[[1,2],[5,31],[6,8],[7,77],[21,22],[28,48],[36,19],[39,43],[40,48],[53,54],[61,80],[70,29],[72,81],[16,85],[27,38,86],[11,15],[4,14,19,36],[5,46,60,67,78,81],[14,38,85],[25,52,84],[51,85],[62,72,87],[43,74],[47,85],[68,72,81,87],[10,12],[18,25,50],[23,82]];
export function compatibleDistractor(target,other,kind){
 if(target.number===other.number||overlapping.some(group=>group.includes(target.number)&&group.includes(other.number)))return false;
 if(kind!=='context')return true;
 return family(target.number)!==family(other.number)&&family(other.number)!=='other';
}
export function question(item,pool,mode,rng=Math.random){
 let kind=mode==='mixed'?['meaning','term','context','write'][Math.floor(rng()*4)]:mode;
 const context=item.contexts[Math.floor(rng()*item.contexts.length)];
 if(kind==='pau')return {item,kind,context,options:[],prompt:item.latinism};
 const other=shuffled(pool.filter(x=>compatibleDistractor(item,x,kind)),rng);
 // With a singleton, definition-only MC is not a real question: use free recall instead.
 if(kind!=='write'&&!other.length)kind='write';
 const options=kind==='write'?[]:shuffled([item,...other.slice(0,3)],rng).map(x=>({id:x.number,label:kind==='meaning'?x.meaning:x.latinism}));
 return {item,kind,context,options,prompt:kind==='meaning'?item.latinism:kind==='context'?context:item.meaning};
}
export function check(q,answer){if(q.kind==='pau')return null;return q.kind==='write'?matches(q.item,answer):Number(answer)===q.item.number;}
