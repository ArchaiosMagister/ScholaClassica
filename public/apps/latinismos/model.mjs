import {items} from './banco.mjs';
export const KEY='scholaclassica-latinismos-v1';
export const MODES=['meaning','term','context','write','mixed'];
export const DEFAULT={filter:'all',from:1,to:87,mode:'mixed',errors:false};
export function normalize(s){return String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe').trim().replace(/\s+/g,' ');}
const aliases={4:['accésit'],20:['currículum','curriculum vitae','currículum vítae'],23:['déficit'],27:['et cetera','etc.'],30:['exlibris'],31:['exprofeso'],35:['hábitat'],38:['ídem'],41:['in flagranti'],50:['maremágnum','maremagno'],52:['memorándum','memorando'],60:['per cápita'],71:['cuórum'],73:['referéndum','referendo'],74:['réquiem'],82:['superávit'],83:['ultimátum'],84:['vade mecum']};
export function matches(item,answer){return [item.latinism,...(aliases[item.number]??[])].some(v=>normalize(v)===normalize(answer));}
export function fresh(){return {config:{...DEFAULT},stats:{}};}
export function cleanState(input){
 const s=fresh();if(!input||typeof input!=='object')return s;
 const c=input.config??{};if(['all','even','odd','range'].includes(c.filter))s.config.filter=c.filter;
 if(MODES.includes(c.mode))s.config.mode=c.mode;
 if(Number.isInteger(c.from)&&Number.isInteger(c.to)&&c.from>=1&&c.to<=87&&c.from<=c.to){s.config.from=c.from;s.config.to=c.to;}
 s.config.errors=c.errors===true;
 for(const item of items){const r=input.stats?.[item.number];if(!r||typeof r!=='object')continue;
 const n=v=>Number.isSafeInteger(v)&&v>=0?v:0;
 s.stats[item.number]={correct:n(r.correct),wrong:n(r.wrong),streak:n(r.streak),studied:r.studied===true,lastWrong:r.lastWrong===true};}
 return s;
}
export function read(storage){try{return cleanState(JSON.parse(storage.getItem(KEY)||'null'));}catch{return fresh();}}
export function save(storage,state){try{storage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
export function select(config,stats={}){
 if(config.filter==='range'&&(!Number.isInteger(config.from)||!Number.isInteger(config.to)||config.from<1||config.to>87||config.from>config.to))return [];
 return items.filter(i=>(config.filter==='even'?i.number%2===0:config.filter==='odd'?i.number%2===1:config.filter==='range'?i.number>=config.from&&i.number<=config.to:true)&&(!config.errors||stats[i.number]?.lastWrong));
}
export function record(state,number,correct){const r=state.stats[number]??(state.stats[number]={correct:0,wrong:0,streak:0,studied:false,lastWrong:false});if(correct){r.correct++;r.streak++;}else{r.wrong++;r.streak=0;}r.lastWrong=!correct;return r;}
export function mastered(r){return (r?.streak??0)>=3;}
export function shuffled(array,rng=Math.random){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const overlapping=[[1,2],[5,31],[6,8],[7,77],[21,22],[28,48],[36,19],[39,43],[40,48],[53,54],[61,80],[70,29],[72,81]];
export function question(item,pool,mode,rng=Math.random){
 let kind=mode==='mixed'?['meaning','term','context','write'][Math.floor(rng()*4)]:mode;
 const context=item.contexts[Math.floor(rng()*item.contexts.length)];
 const other=shuffled(pool.filter(x=>x.number!==item.number&&!overlapping.some(pair=>pair.includes(x.number)&&pair.includes(item.number))),rng);
 // With a singleton, definition-only MC is not a real question: use free recall instead.
 if(kind!=='write'&&!other.length)kind='write';
 const options=kind==='write'?[]:shuffled([item,...other.slice(0,3)],rng).map(x=>({id:x.number,label:kind==='meaning'?x.meaning:x.latinism}));
 return {item,kind,context,options,prompt:kind==='meaning'?item.latinism:kind==='context'?context:item.meaning};
}
export function check(q,answer){return q.kind==='write'?matches(q.item,answer):Number(answer)===q.item.number;}
