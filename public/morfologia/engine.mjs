// Motor puro, sin generación de flexiones ni redes externas.
import {selectReviewCandidates} from './review.mjs';
const fold=s=>String(s).normalize('NFC').trim();
export const COURSE_LABELS={latin:'Latín I',griego:'Griego I',latin4:'Latín · 4.º de ESO',latin2:'Latín II'};
export function validateBank(bank){
  if(bank?.schema!=='schola-morphology-source/v1'||!/^[a-f0-9]{40}$/.test(bank.appendixSha))
    throw Error('Banco morfológico no documentado');
  if(!Array.isArray(bank.records)||bank.records.length===0)throw Error('Banco vacío');
  const ids=new Set();
  for(const record of bank.records){
    if(!['latin','griego','latin4','latin2'].includes(record.language)||
       !Number.isInteger(record.unit)||!bank.coverage?.[record.language]?.includes(record.unit)||
       !['sustantivo','verbo','desinencia','artículo','adjetivo','pronombre',
         'participio','infinitivo'].includes(record.kind)||
       !Array.isArray(record.forms)||record.forms.length<
         (record.language==='latin2'&&record.kind==='infinitivo'?2:6)||
       record.evidence?.status!=='paradigma-documentado')throw Error('Ficha sin documentación');
    if(ids.has(record.id))throw Error('Ficha repetida');ids.add(record.id);
    for(const f of record.forms)
      if(!fold(f.form)||!fold(f.analysis))throw Error('Forma sin análisis documentado');
  }
  return bank;
}
export function shuffle(items,rng=Math.random){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.min(i,Math.max(0,Math.floor(rng()*(i+1))));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
const unique=list=>[...new Set(list)];
const ANALYSIS_CATEGORIES=new Set(['sustantivo','adjetivo','pronombre','verbo',
  'participio','infinitivo','artículo','desinencia']);
export function analysisHeadword(record){
  return fold(record.headword||record.paradigm.split(' · ')[0]);
}
function analysisLabel(record,entry){
  const text=fold(entry.analysis);
  if(record.language==='latin2')return text;
  if(!ANALYSIS_CATEGORIES.has(record.kind))throw Error('Categoría no documentada');
  return record.kind+' · '+text;
}
function ordinaryEntries(record){
  if(record.language!=='latin2')return record.forms;
  // Variantes de uso raro: válidas como soluciones alternativas, pero no
  // candidatas ordinarias al sorteo de formas, ni distractores gráficos.
  const frequent=record.forms.filter(f=>!f.usage||
    !/variante|menos frecuente|poco frecuente|rara/i.test(f.usage));
  return frequent.length?frequent:record.forms;
}
function groupedForms(record){
  const groups=new Map();
  const regularSurfaces=new Set(ordinaryEntries(record).map(f=>fold(f.form)));
  for(const entry of record.forms){
    const form=fold(entry.form);
    // Una variante rara puede compartir grafía con una forma corriente:
    // en ese caso se deben conservar TODAS las lecturas posibles.
    if(!regularSurfaces.has(form))continue;
    if(!groups.has(form))groups.set(form,new Set());
    groups.get(form).add(analysisLabel(record,entry));
  }
  return [...groups].map(([form,features])=>({form,analysis:[...features].join(' / ')}));
}
function analysisDistractors(record,grouped,target,index){
  const correctReadings=new Set(target.split(' / '));
  const other=unique(grouped.map(x=>x.analysis))
    .filter(x=>x!==target&&!correctReadings.has(x));
  // Los infinitivos con únicamente dos formas documentadas pueden examinarse
  // sin inventar flexiones: el distractor describe otra combinación de rasgos.
  if(record.language==='latin2'&&record.kind==='infinitivo'){
    for(const tense of ['presente','perfecto','futuro'])for(const voice of ['activa','pasiva']){
      const label='infinitivo · '+record.headword+' · '+tense+' · voz '+voice;
      if(label!==target&&!correctReadings.has(label)&&!other.includes(label))
        other.push(label);
    }
  }
  // Un distractor léxicamente verosímil de otra categoría se intercala solo
  // ocasionalmente. No se alteran jamás las lecturas correctas ni el enunciado.
  if(index%4===0&&['sustantivo','adjetivo','pronombre'].includes(record.kind)){
    const substitute={sustantivo:'adjetivo',adjetivo:'sustantivo',pronombre:'adjetivo'}[record.kind];
    const derived=target.replaceAll(record.kind+' · ',substitute+' · ');
    if(derived!==target&&!other.includes(derived))other.push(derived);
  }
  return other;
}
export function availableRecords(bank,{language,unit,kind='todos'}){
  validateBank(bank);
  if(!Object.hasOwn(COURSE_LABELS,language))throw Error('Curso no habilitado');
  const levels=bank.coverage[language];
  if(!levels.includes(unit))throw Error('Unidad todavía no disponible');
  return bank.records.filter(record=>record.language===language&&record.unit<=unit&&
    (kind==='todos'||record.kind===kind));
}
// Concordancia griega: artículo y adjetivo coinciden en caso, género y número.
// Ambas piezas proceden de las tablas del mismo Appendix; no se inventan lemas.
function agreementCandidates(bank,records,rng){
  const articles=bank.records.find(r=>r.id==='griego-articulo');
  if(!articles)throw Error('Falta el artículo documentado del Appendix');
  const candidates=[];
  for(const record of records.filter(r=>r.kind==='adjetivo'&&r.language==='griego')){
    const allForms=unique(record.forms.map(x=>fold(x.form)));
    for(const art of articles.forms){
      const acceptedForms=unique(record.forms.filter(f=>
        f.case===art.case&&f.gender===art.gender&&f.number===art.number)
        .map(f=>fold(f.form)));
      if(!acceptedForms.length)continue;
      const distractors=allForms.filter(form=>!acceptedForms.includes(form));
      if(distractors.length<3)continue;
      const correct=shuffle(acceptedForms,rng)[0];
      const options=shuffle([...shuffle(distractors,rng).slice(0,3),correct],rng);
      candidates.push({
        id:record.id+':agreement:'+art.case+':'+art.gender+':'+art.number,
        activity:'agreement',language:'griego',paradigm:record.paradigm,
        prompt:'¿Qué forma del adjetivo concuerda con «'+fold(art.form)+
          '» ('+fold(art.analysis)+')?',
        article:fold(art.form),articleAnalysis:fold(art.analysis),
        acceptedForms,correct,options,evidence:record.evidence
      });
    }
  }
  return candidates;
}
export function makeQuestions(bank,{language,unit,activity='form',kind='todos',
  limit=10,rng=Math.random,reviewMode='all',reviewState,now=Date.now()}={}){
  if(!['form','analysis','agreement'].includes(activity)||!Number.isInteger(limit)||limit<1||limit>30)
    throw Error('Modalidad o cantidad inválida');
  const records=availableRecords(bank,{language,unit,kind});
  if(activity==='agreement'&&(language!=='griego'||unit<5))
    throw Error('La concordancia griega solo está disponible desde UD5');
  const candidates=[];
  // Para Latín II, el análisis de una forma admite lecturas repartidas
  // entre fichas de verbo personal, imperativo e infinitivo de un mismo
  // enunciado. Agrupamos las interpretaciones sin inventar el contexto.
  const latin2Index=new Map();
  const usedLatin2Prompts=new Set();
  if(activity==='analysis'&&language==='latin2'){
    for(const source of bank.records.filter(r=>r.language==='latin2'&&r.unit<=unit)){
      const head=analysisHeadword(source);
      for(const f of source.forms){
        const key=head+'\\u0000'+fold(f.form);
        if(!latin2Index.has(key))latin2Index.set(key,new Set());
        latin2Index.get(key).add(analysisLabel(source,f));
      }
    }
  }
  if(activity==='agreement')
    candidates.push(...agreementCandidates(bank,records,rng));
  for(const record of activity==='agreement'?[]:records){
    const grouped=groupedForms(record);
    if(activity==='form'){
      // Una misma casilla del Appendix puede documentar varias formas válidas
      // (civēs / civīs en acusativo plural, por ejemplo). Nunca se ofrece una
      // variante válida como distractor de la otra.
      const byAnalysis=new Map();
      for(const entry of record.forms){
        const analysis=fold(entry.analysis),form=fold(entry.form);
        if(!byAnalysis.has(analysis))byAnalysis.set(analysis,new Set());
        byAnalysis.get(analysis).add(form);
      }
      for(const [index,[analysis,forms]] of [...byAnalysis].entries()){
        const acceptedForms=[...forms];
        const distractors=unique(grouped.map(x=>x.form))
          .filter(form=>!forms.has(form));
        if(distractors.length<3)continue;
        const core=ordinaryEntries(record).filter(f=>
          fold(f.analysis)===analysis).map(f=>fold(f.form));
        // No se debe sortear un análisis cuya única evidencia sean
        // flexiones analógicas no contrastadas o variantes reservadas.
        // Si hay una forma corriente para ese análisis, se conservan
        // las variantes documentadas como respuestas alternativas.
        if(record.language==='latin2'&&core.length===0)continue;
        const regularChoices=acceptedForms.filter(form=>core.includes(form));
        const correct=shuffle(regularChoices.length?regularChoices:acceptedForms,rng)[0];
        const options=shuffle([...shuffle(distractors,rng).slice(0,3),correct],rng);
        candidates.push({
          id:record.id+':form:'+index,activity,
          prompt:'Selecciona la forma de '+analysis+'.',
          paradigm:record.paradigm,form:correct,correct,acceptedForms,options,
          evidence:record.evidence,language
        });
      }
    }
    if(activity==='analysis'){
      const allGrouped=language==='latin2'?grouped.map(g=>{
        const key=analysisHeadword(record)+'\\u0000'+g.form;
        return {...g,analysis:[...(latin2Index.get(key)||new Set([g.analysis]))].join(' / ')};
      }):grouped;
      for(const [index,g] of allGrouped.entries()){
        const key=analysisHeadword(record)+'\\u0000'+g.form;
        if(language==='latin2'&&usedLatin2Prompts.has(key))continue;
        // Agrupar también categorías verbales del mismo lema: "ferre" es
        // infinitivo presente activo y puede ser imperativo o 2.ª pasiva.
        const distractors=analysisDistractors(record,allGrouped,g.analysis,index);
        if(distractors.length<3)continue;
        if(language==='latin2')usedLatin2Prompts.add(key);
        const options=shuffle([...shuffle(distractors,rng).slice(0,3),g.analysis],rng);
        candidates.push({
          id:record.id+':analysis:'+index,activity,
          prompt:'¿Qué análisis admite esta forma?',paradigm:record.paradigm,
          headword:analysisHeadword(record),
          form:g.form,correct:g.analysis,options,evidence:record.evidence,language,
          ambiguous:g.analysis.includes(' / ')
        });
      }
    }
  }
  return selectReviewCandidates(candidates,{mode:reviewMode,state:reviewState,limit,rng,now});
}
export function evaluate(question,choice){
  if(!question?.options?.includes(choice))throw Error('Respuesta ajena al ejercicio');
  const valid=question.acceptedForms?.includes(choice)||choice===question.correct;
  const variants=question.acceptedForms?.length>1?
    ' Otras soluciones válidas: '+question.acceptedForms.join(' o ')+'.':'';
  return {correct:valid,expected:variants?question.acceptedForms.join(' / '):question.correct,
    note:question.ambiguous?'Esta forma tiene varios análisis posibles; se muestran juntos.':
      'Forma tomada directamente de un paradigma curricular publicado.'+variants};
}
