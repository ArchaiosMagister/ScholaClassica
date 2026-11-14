// Práctica productiva: todas las soluciones proceden literalmente del banco validado.
import {availableRecords,practiceEligibleEntries,practiceOrdinaryEntries} from './engine.mjs';
import {selectReviewCandidates} from './review.mjs';
const cases={latin:['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'],
  latin2:['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'],
  latin4:['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'],
  griego:['nominativo','vocativo','acusativo','genitivo','dativo']};
const clean=text=>String(text??'').trim().normalize('NFC').replace(/\s+/g,' ');
const unique=values=>[...new Set(values)];
function comparison(text,{language,ending=false}={}){
  let value=clean(text).toLocaleLowerCase(language==='griego'?'el':'la');
  if(ending)value=value.replace(/^[\u2010-\u2015-]+/u,'');
  if(['latin','latin4','latin2'].includes(language))value=value.replace(/æ/g,'ae').replace(/œ/g,'oe')
    .normalize('NFD').replace(/\u0304/gu,'').normalize('NFC');
  if(language==='griego')value=value.normalize('NFD')
    .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
  return value;
}
function withoutAccents(text,language){
  const base=text.normalize('NFD');
  // Mantener U+0345 (iota suscrita): es parte de la forma, no una tilde prescindible.
  const bare=base.replace(/[\u0300\u0301\u0304\u0306\u0308\u0313\u0314\u0342]/gu,'');
  return language==='griego'?bare.replace(/ς/g,'σ').normalize('NFC'):bare.normalize('NFC');
}
export function correctWritten(question,input){
  if(!question||!['written','table'].includes(question.activity))
    throw Error('Actividad escrita no válida');
  const accepted=question.acceptedForms;
  if(!Array.isArray(accepted)||accepted.length===0)throw Error('No hay soluciones documentadas');
  const typed=comparison(input,{language:question.language,ending:question.kind==='desinencia'});
  const variants=unique(accepted.map(form=>comparison(form,{
    language:question.language,ending:question.kind==='desinencia'})));
  const expected=accepted.join(' / ');
  if(!typed)return {status:'empty',correct:false,expected,note:'Escribe una respuesta antes de corregir.'};
  if(variants.includes(typed))
    return {status:'correct',correct:true,expected,note:'La forma es correcta.'};
  if(variants.some(form=>withoutAccents(form,question.language)===
      withoutAccents(typed,question.language))){
    return {status:'orthography',correct:false,expected,
      note:question.language==='griego'?
        'La flexión coincide, pero revisa los acentos, espíritus, diéresis o sigma final. No se cuenta como acierto.':
        'La flexión coincide, pero revisa su ortografía. No se cuenta como acierto.'};
  }
  return {status:'morphology',correct:false,expected,
    note:'La forma no coincide con las soluciones admitidas.'};
}
export function makeWrittenQuestions(bank,{language,unit,kind='todos',limit=10,rng=Math.random,
  reviewMode='all',reviewState,now=Date.now()}={}){
  const records=availableRecords(bank,{language,unit,kind});
  const candidates=[];
  for(const record of records){
    const groups=new Map();
    const ordinaryAnalyses=new Set(practiceOrdinaryEntries(record).map(f=>
      clean(f.analysis)));
    const allowed=new Set(practiceEligibleEntries(record));
    // Preservar los índices históricos del progreso local, incluso cuando
    // algunas lecturas del banco deban permanecer fuera del sorteo.
    for(const entry of record.forms){
      const key=clean(entry.analysis);
      if(!groups.has(key))groups.set(key,new Set());
      if(allowed.has(entry))groups.get(key).add(clean(entry.form));
    }
    let i=0;
    for(const [analysis,forms] of groups){
      const originalIndex=i++;
      if(forms.size===0||record.language==='latin2'&&
        !ordinaryAnalyses.has(analysis))continue;
      const acceptedForms=[...forms];
      candidates.push({
        id:record.id+':written:'+originalIndex,activity:'written',language,kind:record.kind,
        paradigm:record.paradigm,evidence:record.evidence,
        prompt:(record.kind==='desinencia'?'Escribe la desinencia de ':'Escribe la forma de ')+analysis+'.',
        acceptedForms,correct:acceptedForms[0]
      });
    }
  }
  return selectReviewCandidates(candidates,{mode:reviewMode,state:reviewState,
    limit,rng,now,balanceByKind:kind==='todos'&&
      ['latin','griego','latin2'].includes(language)});
}
export function makeTableExercises(bank,{language,unit,kind='todos',limit=10,rng=Math.random,
  reviewMode='all',reviewState,now=Date.now()}={}){
  const records=availableRecords(bank,{language,unit,kind});
  const candidates=[];
  for(const record of records){
    if(!['sustantivo','adjetivo','desinencia','artículo','participio','pronombre'].includes(record.kind))continue;
    // Las tablas requieren un paradigma de género definido. Mezclar ego/tu
    // en una sola casilla de "singular" falsearía la flexión personal.
    if(record.kind==='pronombre'&&!record.forms.every(f=>f.gender&&f.number))continue;
    const accepted=practiceEligibleEntries(record);
    const ordinary=practiceOrdinaryEntries(record);
    const genders=unique(ordinary.map(f=>f.gender).filter(Boolean));
    for(const gender of genders.length?genders:[null]){
      const entries=gender?accepted.filter(f=>f.gender===gender):accepted;
      const basic=gender?ordinary.filter(f=>f.gender===gender):ordinary;
      const available=cases[language].filter(c=>basic.some(f=>f.case===c));
      if(available.length<4)continue;
      const cells=[];
      for(const cas of available){
        for(const number of ['singular','plural']){
          const acceptedForms=unique(entries.filter(f=>f.case===cas&&f.number===number)
            .map(f=>clean(f.form)));
          if(!acceptedForms.length||!basic.some(f=>f.case===cas&&
            f.number===number))continue;
          cells.push({id:cas+':'+number,case:cas,number,acceptedForms});
        }
      }
      if(cells.length!==available.length*2)continue;
      const id=record.id+':table:'+(gender||'none');
      candidates.push({id,activity:'table',language,kind:record.kind,
        paradigm:record.paradigm,evidence:record.evidence,gender,
        prompt:'Completa las formas '+(gender?'del '+gender+' ':'')+
          'en singular y plural.',cells});
    }
  }
  return selectReviewCandidates(candidates,{mode:reviewMode,state:reviewState,
    limit,rng,now,balanceByKind:kind==='todos'&&
      ['latin','griego','latin2'].includes(language)});
}
export function evaluateTable(question,answers){
  if(question?.activity!=='table'||!Array.isArray(question.cells)||
    !answers||typeof answers!=='object')throw Error('Tabla inválida');
  const results=question.cells.map(cell=>{
    const r=correctWritten({...question,acceptedForms:cell.acceptedForms},
      answers[cell.id]||'');
    return {...cell,...r};
  });
  return {results,total:results.length,correct:results.filter(r=>r.correct).length,
    complete:results.every(r=>r.correct)};
}
