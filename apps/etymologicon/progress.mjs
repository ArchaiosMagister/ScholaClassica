/**
 * Etymologicon · progreso local v1.
 * Agregados exclusivamente: NO se almacenan las palabras escritas, nombres
 * ni identificadores personales. Sin servidor y sin dependencia de red.
 */
export const PROGRESS_KEY='scholaclassica-etymologicon-progress-v1';
export const PROGRESS_SCHEMA='etymologicon-progress/v1';
const MAX_ATTEMPTS=100000;
const MAX_IMPORT_BYTES=250000;
const SCORE_VALUES=new Set([0,0.5,1,1.5,2]);
const MODES=new Set(['general','errors','unit']);

export function emptyProgress(){
  return {schema:PROGRESS_SCHEMA,updatedAt:null,
    courses:{gr1:{records:{}},gr2:{records:{}}}};
}
function plain(value){
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
    (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
}
function keysExact(value,expected){
  return plain(value)&&Object.keys(value).length===expected.length&&
    expected.every(key=>Object.hasOwn(value,key));
}
function iso(date){
  return typeof date==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(date)&&
    Number.isFinite(Date.parse(date))&&new Date(date).toISOString()===date;
}
function natural(value,allowZero=true){
  return Number.isSafeInteger(value)&&value>=Number(!allowZero)&&value<=MAX_ATTEMPTS*2;
}
function assert(condition,message){
  if(!condition)throw new Error('Progreso no válido: '+message);
}
function knownIds(etymons){
  if(!Array.isArray(etymons))throw new TypeError('Falta el catálogo académico');
  return new Set(etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives').map(x=>x.id));
}
function validateRecord(record,id){
  const names=['attempts','exact','typo','incorrect','points','lastScore',
    'lastPracticed','perfectStreak','needsReview'];
  assert(keysExact(record,names),'campos de '+id);
  assert(natural(record.attempts,false),'número de ejercicios en '+id);
  assert(record.attempts<=MAX_ATTEMPTS,'demasiados ejercicios en '+id);
  for(const field of ['exact','typo','incorrect','perfectStreak'])
    assert(natural(record[field]),field+' de '+id);
  assert(record.exact+record.typo+record.incorrect===2*record.attempts,
    'las dos respuestas deben contabilizarse por ejercicio en '+id);
  assert(typeof record.points==='number'&&Number.isFinite(record.points)&&
    record.points>=0&&record.points<=2*record.attempts&&
    record.points===record.exact+record.typo/2,'puntuación incoherente en '+id);
  assert(SCORE_VALUES.has(record.lastScore),'última nota en '+id);
  assert(natural(record.perfectStreak)&&record.perfectStreak<=record.attempts,
    'racha perfecta en '+id);
  assert(iso(record.lastPracticed),'fecha en '+id);
  assert(Date.parse(record.lastPracticed)<=Date.now()+86400000,'fecha futura en '+id);
  assert(typeof record.needsReview==='boolean','marca de repaso en '+id);
  if(record.lastScore<2){
    assert(record.perfectStreak===0&&record.needsReview,'error no pendiente en '+id);
  }else{
    assert(record.perfectStreak>=1,'última nota perfecta sin racha en '+id);
    if(record.perfectStreak>=2)assert(!record.needsReview,'repaso completado en '+id);
  }
  if(record.exact===2*record.attempts)assert(!record.needsReview,
    'sin errores históricos y con repaso pendiente en '+id);
}
/**
 * Valida y normaliza una copia exportada o persistida. No conserva propiedades
 * desconocidas ni ids de otros bancos; Griego II está reservado y vacío.
 */
export function validateProgress(input,etymons){
  const ids=knownIds(etymons);
  assert(plain(input),'el contenido debe ser un objeto');
  assert(input.schema===PROGRESS_SCHEMA,'versión no compatible');
  assert(Object.keys(input).every(k=>['schema','updatedAt','courses','exportedAt'].includes(k)),
    'propiedad inesperada');
  assert(input.updatedAt===null||iso(input.updatedAt),'fecha de actualización');
  if(Object.hasOwn(input,'exportedAt'))assert(iso(input.exportedAt),'fecha de exportación');
  assert(keysExact(input.courses,['gr1','gr2']),'deben separarse Griego I y Griego II');
  const result=emptyProgress();
  for(const course of ['gr1','gr2']){
    const section=input.courses[course];
    assert(keysExact(section,['records']),'estructura del curso '+course);
    assert(plain(section.records),'registros del curso '+course);
    assert(Object.keys(section.records).length<=ids.size,'demasiados étimos');
    for(const [id,record] of Object.entries(section.records)){
      assert(course==='gr1'&&ids.has(id),'étimo desconocido o curso aún no activo: '+id);
      validateRecord(record,id);
      result.courses.gr1.records[id]={...record};
    }
  }
  result.updatedAt=input.updatedAt;
  return result;
}
export function loadProgress(storage,etymons){
  try{
    const raw=storage.getItem(PROGRESS_KEY);
    if(raw===null)return {state:emptyProgress(),persisted:true,warning:null};
    if(raw.length>MAX_IMPORT_BYTES)throw new Error('datos demasiado grandes');
    return {state:validateProgress(JSON.parse(raw),etymons),persisted:true,warning:null};
  }catch{
    return {state:emptyProgress(),persisted:false,
      warning:'No se ha podido leer el progreso guardado. No se ha borrado el archivo original; exporta una copia antes de sobrescribirlo.'};
  }
}
export function saveProgress(storage,state,etymons){
  const checked=validateProgress(state,etymons);
  try{
    storage.setItem(PROGRESS_KEY,JSON.stringify(checked));
    return {saved:true,warning:null};
  }catch{
    return {saved:false,warning:'No se ha podido guardar el progreso en este dispositivo. La sesión actual funciona, pero exporta una copia para conservarla.'};
  }
}
export function removeProgress(storage){
  try{storage.removeItem(PROGRESS_KEY);return true;}catch{return false;}
}
export function exportProgress(state,etymons,at=new Date().toISOString()){
  assert(iso(at),'fecha de exportación');
  const checked=validateProgress(state,etymons);
  return JSON.stringify({...checked,exportedAt:at},null,2)+'\n';
}
export function importProgress(text,etymons){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)
    throw new Error('El archivo no es JSON válido o supera el tamaño máximo de 250 KB.');
  let data;
  try{data=JSON.parse(text);}catch{throw new Error('El archivo no contiene JSON válido.');}
  return validateProgress(data,etymons);
}
export function recordExercise(state,etymons,result,at=new Date().toISOString()){
  const checked=validateProgress(state,etymons),ids=knownIds(etymons);
  assert(ids.has(result?.etymonId),'étimo no autorizado');
  assert(result.status==='evaluated'&&Array.isArray(result.answers)&&result.answers.length===2,
    'ejercicio incompleto');
  const counts={exact:0,typo:0,incorrect:0};
  let score=0;
  for(const answer of result.answers){
    assert(SCORE_VALUES.has(answer?.points),'nota de respuesta');
    assert(answer.points<=1,'nota individual fuera de rango');
    if(answer.points===1)counts.exact++;
    else if(answer.points===0.5)counts.typo++;
    else counts.incorrect++;
    score+=answer.points;
  }
  assert(SCORE_VALUES.has(result.total)&&result.total===score&&result.maximum===2,
    'nota total no coincide con las respuestas');
  assert(iso(at),'fecha del ejercicio');
  const previous=checked.courses.gr1.records[result.etymonId]||{
    attempts:0,exact:0,typo:0,incorrect:0,points:0,lastScore:0,
    lastPracticed:at,perfectStreak:0,needsReview:false
  };
  assert(previous.attempts<MAX_ATTEMPTS,'límite de registros por étimo');
  const perfectStreak=score===2?previous.perfectStreak+1:0;
  const needsReview=score<2?true:perfectStreak>=2?false:previous.needsReview;
  const next={
    attempts:previous.attempts+1,exact:previous.exact+counts.exact,
    typo:previous.typo+counts.typo,incorrect:previous.incorrect+counts.incorrect,
    points:previous.points+score,lastScore:score,lastPracticed:at,
    perfectStreak,needsReview
  };
  checked.courses.gr1.records[result.etymonId]=next;
  checked.updatedAt=at;
  return validateProgress(checked,etymons);
}
export function progressSummary(state,etymons){
  const records=state.courses.gr1.records;
  const all=Object.values(records);
  const total=all.reduce((s,x)=>({
    exercises:s.exercises+x.attempts,exact:s.exact+x.exact,
    typo:s.typo+x.typo,incorrect:s.incorrect+x.incorrect,points:s.points+x.points
  }),{exercises:0,exact:0,typo:0,incorrect:0,points:0});
  const units=[...new Set(etymons.flatMap(e=>e.units))].sort((a,b)=>
    Number(a.slice(2))-Number(b.slice(2)));
  const byUnit=units.map(unit=>{
    const members=etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives'&&e.units.includes(unit));
    const exercises=members.reduce((n,e)=>n+(records[e.id]?.attempts||0),0);
    const points=members.reduce((n,e)=>n+(records[e.id]?.points||0),0);
    return {unit,available:members.length,exercises,average:exercises?points/exercises:0};
  });
  return {...total,average:total.exercises?total.points/total.exercises:0,
    needingReview:etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives'&&records[e.id]?.needsReview).length,
    practiced:all.length,byUnit};
}
export function filteredEtyma(etymons,state,{mode='general',unit='all'}={}){
  if(!MODES.has(mode))throw new Error('Modo desconocido');
  const eligible=etymons.filter(x=>x.editorialStatus==='approved_for_documented_derivatives');
  if(mode==='unit'){
    if(!/^UD\d+$/.test(unit))return [];
    return eligible.filter(e=>e.units.includes(unit));
  }
  if(mode==='errors'){
    const records=state.courses.gr1.records;
    return eligible.filter(e=>records[e.id]?.needsReview===true);
  }
  return eligible;
}
export function reviewWeight(record){
  if(!record)return 3; // novedades
  if(record.lastScore<2)return 6+(2-record.lastScore)*2; // fallo antes que errata
  if(record.needsReview)return 5; // primera respuesta perfecta tras un error
  return 1; // asentado; no desaparece del repaso general
}
export function chooseAdaptive(pool,state,{excludeId=null,random=Math.random}={}){
  if(!Array.isArray(pool)||pool.length===0)return null;
  const candidates=pool.length>1?pool.filter(e=>e.id!==excludeId):pool;
  const records=state.courses.gr1.records;
  const total=candidates.reduce((s,e)=>s+reviewWeight(records[e.id]),0);
  const value=random();
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=1)
    throw new RangeError('El generador debe devolver un número entre 0 y 1.');
  let position=value*total;
  for(const e of candidates){
    position-=reviewWeight(records[e.id]);
    if(position<0)return e;
  }
  return candidates.at(-1);
}
