// Vista combinada de Vocabula exclusiva de ScholaClassica.
// No altera VOCAB, unidades docentes, IDs, glosas ni campos de progreso.
// Se transpila en build a un script clásico quitando "export ".
export const SCHOLA_ALL_MODE='all';

function scholaExactString(value){
  return String(value??'').normalize('NFC').trim();
}
// No fusionar entradas de acepciones, regímenes o ejemplos distintos.
// La comparación ignora solo el orden de las respuestas correctas y
// las diferencias de metadatos (ID, modalidad, unidad, transcripción).
export function scholaVocabularyIdentity(entry){
  if(!entry||!Array.isArray(entry.answers)||!entry.id||
    !['general','examen'].includes(entry.mode))throw Error('Ficha no reconocida');
  return JSON.stringify([
    entry.subject,scholaExactString(entry.form),scholaExactString(entry.meaning),
    [...new Set(entry.answers.map(scholaExactString))].sort(),
    scholaExactString(entry.usage),
    JSON.stringify(entry.examples||[])
  ]);
}
function scholaUnitsUnion(entries){
  return [...new Set(entries.flatMap(x=>x.units))];
}
export function scholaVocabularyAll(entries,subject,units=null,failedProgress=null){
  if(!Array.isArray(entries))throw Error('Banco no disponible');
  const unitSet=units===null?null:new Set(units);
  if(unitSet&&unitSet.size===0)return [];
  const grouped=new Map();
  for(const entry of entries){
    if(entry.subject!==subject||!['general','examen'].includes(entry.mode))continue;
    if(!Array.isArray(entry.units)||!Array.isArray(entry.originals))
      throw Error('Entrada con unidades u originales inválidos');
    const key=scholaVocabularyIdentity(entry);
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(entry);
  }
  const output=[];
  for(const sources of grouped.values()){
    // La elegibilidad en la unidad elegida utiliza solo la adscripción
    // de CADA modalidad. Las otras fuentes se muestran como referencia,
    // pero no habilitan su ficha antes de la unidad que les corresponde.
    const selected=unitSet?
      sources.filter(e=>e.units.some(u=>unitSet.has(u))):sources;
    if(!selected.length)continue;
    if(failedProgress&&!selected.some(e=>failedProgress[e.id]?.failed===true))
      continue;
    const representative=selected.find(e=>e.mode==='general')||selected[0];
    output.push({
      ...representative,
      units:scholaUnitsUnion(sources),
      scholaSources:sources.map(e=>({
        id:e.id,mode:e.mode,units:[...e.units]
      })),
      scholaSelectedIds:[...new Set(selected.map(e=>e.id))]
    });
  }
  return output;
}
// Etiquetas exclusivamente de presentación: NO se modifican las unidades
// académicas de las fichas ni los values del selector de unidades.
export function scholaVocabularyUnitCaption(subject,unit){
  if(subject==='lat1'&&unit==='UD 11–12')
    return 'Ampliación · fuera de las unidades habituales';
  if(subject==='gr1'&&unit==='Sin unidad acreditada')
    return 'Complementario · sin unidad asignada';
  return unit;
}
export function scholaVocabularyScopeDescription(subject,mode,original){
  if(!['lat1','gr1'].includes(subject))return mode==='all'?
    'Practica juntos General y Examen. Cada ficha muestra sus unidades por modalidad; las acepciones distintas permanecen separadas.':original;
  if(mode==='examen')
    return 'Vocabulario de examen: selección de la lista docente por unidades. No incluye automáticamente los grupos complementarios.';
  if(mode==='all')
    return 'Todo el vocabulario reúne General y Examen. Los grupos de ampliación siguen siendo complementarios, no exigibles automáticamente. Cada ficha indica su procedencia.';
  return subject==='lat1'?
    'Vocabulario general de estudio, con unidades y un grupo de ampliación fuera del temario habitual. General no equivale a exigible en examen.':
    'Vocabulario general para estudiar y repasar. Incluye un grupo complementario sin unidad asignada, que no se convierte en exigible para examen.';
}
export function scholaVocabularyProvenance(entry,chosenUnits=null){
  if(!entry.scholaSources){
    return chosenUnits===null?entry.units.map(u=>scholaVocabularyUnitCaption(entry.subject,u)).join(' · '):
      entry.units.filter(u=>chosenUnits.includes(u)).map(u=>scholaVocabularyUnitCaption(entry.subject,u)).join(' · ');
  }
  const sourcesByMode=new Map();
  for(const source of entry.scholaSources){
    if(!sourcesByMode.has(source.mode))sourcesByMode.set(source.mode,[]);
    for(const unit of source.units){
      const list=sourcesByMode.get(source.mode);
      if(!list.includes(unit))list.push(unit);
    }
  }
  return [...sourcesByMode].map(([mode,units])=>
    (mode==='general'?'General':'Examen')+': '+units.map(u=>scholaVocabularyUnitCaption(entry.subject,u)).join(' · ')).join('  |  ');
}
export function scholaVocabularyProgress(entries,progress){
  const groups=entries.map(entry=>{
    const ids=entry.scholaSources?.map(s=>s.id)||[entry.id];
    const values=ids.map(id=>progress[id]).filter(p=>
      p&&Number.isInteger(p.total)&&Number.isInteger(p.right)&&
      p.total>=0&&p.right>=0&&p.right<=p.total);
    if(!values.length)return null;
    // El máximo resume una ficha combinada sin contar doble una única
    // respuesta registrada en General y Examen a la vez.
    const main=[...values].sort((a,b)=>b.total-a.total)[0];
    return {total:main.total,right:main.right,
      failed:values.some(v=>v.failed===true)};
  }).filter(Boolean);
  const attempted=groups.reduce((sum,p)=>sum+p.total,0);
  const correct=groups.reduce((sum,p)=>sum+p.right,0);
  return {learned:groups.length,accuracy:attempted?
    Math.round(correct/attempted*100)+'%':'—',
    pending:groups.filter(p=>p.failed).length};
}
export function scholaVocabularyRecordProgress(progress,entry,ok){
  const ids=entry.scholaSelectedIds||[entry.id];
  if(!ids.length||new Set(ids).size!==ids.length)throw Error('IDs repetidos en selección');
  for(const id of ids){
    const previous=progress[id]||{total:0,right:0,failed:false};
    progress[id]={total:previous.total+1,right:previous.right+Number(ok),failed:!ok};
  }
  return progress;
}
