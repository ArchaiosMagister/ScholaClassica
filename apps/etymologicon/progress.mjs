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
    courses:{gr1:{records:{}},gr2:{records:{}}},
    activities:{cards:{records:{}},matching:{records:{}},mcq:{records:{}},inverse:{records:{}},decomposition:{records:{}}}};
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
  assert(Object.keys(input).every(k=>['schema','updatedAt','courses','activities','exportedAt'].includes(k)),
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
  // Compatibilidad hacia atrás: las copias v1 anteriores a estas modalidades
  // no incluían «activities»; se recuperan sin descartar el progreso escrito.
  if(Object.hasOwn(input,'activities')){
    const oldFormat=keysExact(input.activities,['cards','matching']);
    const priorFormat=keysExact(input.activities,['cards','matching','mcq','inverse']);
    const newFormat=keysExact(input.activities,['cards','matching','mcq','inverse','decomposition']);
    assert(oldFormat||priorFormat||newFormat,'actividades adicionales');
    const types=oldFormat?['cards','matching']:
      priorFormat?['cards','matching','mcq','inverse']:
        ['cards','matching','mcq','inverse','decomposition'];
    for(const type of types){
      const section=input.activities[type];
      assert(keysExact(section,['records']),'estructura de '+type);
      assert(plain(section.records),'registros de '+type);
      assert(Object.keys(section.records).length<=ids.size,'demasiados registros de '+type);
      for(const [id,record] of Object.entries(section.records)){
        assert(ids.has(id),'étimo desconocido en '+type+': '+id);
        const names=type==='cards'
          ?['attempts','remembered','forgotten','streak','needsReview','lastPracticed']
          :['attempts','correct','incorrect','streak','needsReview','lastPracticed'];
        assert(keysExact(record,names),'campos de '+type+' '+id);
        for(const field of names.filter(x=>!['needsReview','lastPracticed'].includes(x)))
          assert(natural(record[field]),field+' de '+id);
        assert(record.attempts>0&&record.attempts<=MAX_ATTEMPTS,
          'número de repasos en '+id);
        const successes=type==='cards'?record.remembered:record.correct;
        const failures=type==='cards'?record.forgotten:record.incorrect;
        assert(record.attempts===successes+failures,'suma de éxitos y fallos en '+id);
        assert(record.streak<=record.attempts&&record.streak<=successes,
          'racha incoherente en '+id);
        assert(iso(record.lastPracticed),'fecha de '+type+' '+id);
        assert(Date.parse(record.lastPracticed)<=Date.now()+86400000,'fecha futura en '+id);
        assert(typeof record.needsReview==='boolean','marca de repaso en '+id);
        if(failures===0)assert(!record.needsReview,'sin fallos pero con repaso en '+id);
        if(record.streak>=2)assert(!record.needsReview,'repaso ya completado en '+id);
        if(record.streak===0)assert(record.needsReview,'último intento fallido sin repaso en '+id);
        if(record.streak>0&&record.streak<2&&failures>0)
          assert(record.needsReview,'repaso pendiente prematuramente eliminado en '+id);
        result.activities[type].records[id]={...record};
      }
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

/** Autoevaluación de tarjetas: no se asignan 1/0,5/0 puntos objetivos. */
export function recordCardReview(state,etymons,etymonId,remembered,at=new Date().toISOString()){
  const checked=validateProgress(state,etymons);
  assert(knownIds(etymons).has(etymonId),'étimo de tarjeta no autorizado');
  assert(typeof remembered==='boolean','autoevaluación inválida');
  assert(iso(at),'fecha de tarjeta');
  const previous=checked.activities.cards.records[etymonId]||
    {attempts:0,remembered:0,forgotten:0,streak:0,needsReview:false,lastPracticed:at};
  assert(previous.attempts<MAX_ATTEMPTS,'demasiadas tarjetas');
  const streak=remembered?previous.streak+1:0;
  const forgotten=previous.forgotten+(remembered?0:1);
  checked.activities.cards.records[etymonId]={
    attempts:previous.attempts+1,remembered:previous.remembered+Number(remembered),
    forgotten,streak,
    needsReview:remembered?(streak<2&&forgotten>0):true,lastPracticed:at
  };
  checked.updatedAt=at;
  return validateProgress(checked,etymons);
}
/**
 * Una ronda completa registra un resultado por étimo. Si un emparejamiento
 * necesitó reintentos, cuenta como fallo para el repaso, aunque se terminara.
 */
export function recordMatchingRound(state,etymons,results,at=new Date().toISOString()){
  const checked=validateProgress(state,etymons);
  const allowed=knownIds(etymons);
  assert(Array.isArray(results)&&results.length>=2&&results.length<=8,
    'una ronda debe contener entre dos y ocho pares');
  const ids=new Set();
  assert(iso(at),'fecha de ronda');
  for(const item of results){
    assert(item&&allowed.has(item.etymonId)&&!ids.has(item.etymonId),
      'étimo ajeno o repetido en ronda');
    ids.add(item.etymonId);
    assert(typeof item.firstTry==='boolean','resultado de relación inválido');
    const prev=checked.activities.matching.records[item.etymonId]||
      {attempts:0,correct:0,incorrect:0,streak:0,needsReview:false,lastPracticed:at};
    assert(prev.attempts<MAX_ATTEMPTS,'demasiados emparejamientos');
    const streak=item.firstTry?prev.streak+1:0;
    const incorrect=prev.incorrect+Number(!item.firstTry);
    checked.activities.matching.records[item.etymonId]={
      attempts:prev.attempts+1,correct:prev.correct+Number(item.firstTry),
      incorrect,streak,
      needsReview:item.firstTry?(streak<2&&incorrect>0):true,lastPracticed:at
    };
  }
  checked.updatedAt=at;
  return validateProgress(checked,etymons);
}
/** No mezcla las calificaciones objetivas con la autoevaluación de tarjetas. */
/** Cuestionarios e inversos son pruebas objetivas: un intento = 1/0. */
export function recordQuizAttempt(state,etymons,kind,etymonId,correct,at=new Date().toISOString()){
  const checked=validateProgress(state,etymons);
  assert(['mcq','inverse','decomposition'].includes(kind),'actividad de cuestionario desconocida');
  assert(knownIds(etymons).has(etymonId),'étimo desconocido');
  assert(typeof correct==='boolean','resultado incorrecto');
  assert(iso(at),'fecha del cuestionario');
  const prev=checked.activities[kind].records[etymonId]||
    {attempts:0,correct:0,incorrect:0,streak:0,needsReview:false,lastPracticed:at};
  assert(prev.attempts<MAX_ATTEMPTS,'demasiados ejercicios');
  const streak=correct?prev.streak+1:0;
  const incorrect=prev.incorrect+Number(!correct);
  checked.activities[kind].records[etymonId]={
    attempts:prev.attempts+1,
    correct:prev.correct+Number(correct),incorrect,streak,
    needsReview:correct?(streak<2&&incorrect>0):true,lastPracticed:at
  };
  checked.updatedAt=at;
  return validateProgress(checked,etymons);
}
export function activitySummary(state){
  const cards=Object.values(state.activities.cards.records);
  const matches=Object.values(state.activities.matching.records);
  const mcq=Object.values(state.activities.mcq.records);
  const inverse=Object.values(state.activities.inverse.records);
  const decomposition=Object.values(state.activities.decomposition.records);
  return {
    cardsReviewed:cards.reduce((n,r)=>n+r.attempts,0),
    cardsRemembered:cards.reduce((n,r)=>n+r.remembered,0),
    cardsForgotten:cards.reduce((n,r)=>n+r.forgotten,0),
    pairsPracticed:matches.reduce((n,r)=>n+r.attempts,0),
    pairsFirstTry:matches.reduce((n,r)=>n+r.correct,0),
    pairsWithRetries:matches.reduce((n,r)=>n+r.incorrect,0),
    mcqAttempted:mcq.reduce((n,r)=>n+r.attempts,0),
    mcqCorrect:mcq.reduce((n,r)=>n+r.correct,0),
    inverseAttempted:inverse.reduce((n,r)=>n+r.attempts,0),
    inverseCorrect:inverse.reduce((n,r)=>n+r.correct,0),
    decompositionAttempted:decomposition.reduce((n,r)=>n+r.attempts,0),
    decompositionPerfect:decomposition.reduce((n,r)=>n+r.correct,0)
  };
}
export function needsAnyReview(state,id){
  return Boolean(state.courses.gr1.records[id]?.needsReview||
    state.activities.cards.records[id]?.needsReview||
    state.activities.matching.records[id]?.needsReview||
    state.activities.mcq.records[id]?.needsReview||
    state.activities.inverse.records[id]?.needsReview||
    state.activities.decomposition.records[id]?.needsReview);
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
    needingReview:etymons.filter(e=>e.editorialStatus==='approved_for_documented_derivatives'&&needsAnyReview(state,e.id)).length,
    practiced:all.length,byUnit,...activitySummary(state)};
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
    return eligible.filter(e=>needsAnyReview(state,e.id));
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
  const weight=e=>reviewWeight(records[e.id])+
    (state.activities.cards.records[e.id]?.needsReview?4:0)+
    (state.activities.matching.records[e.id]?.needsReview?4:0)+
    (state.activities.mcq.records[e.id]?.needsReview?4:0)+
    (state.activities.inverse.records[e.id]?.needsReview?4:0)+
    (state.activities.decomposition.records[e.id]?.needsReview?4:0);
  const total=candidates.reduce((s,e)=>s+weight(e),0);
  const value=random();
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=1)
    throw new RangeError('El generador debe devolver un número entre 0 y 1.');
  let position=value*total;
  for(const e of candidates){
    position-=weight(e);
    if(position<0)return e;
  }
  return candidates.at(-1);
}
