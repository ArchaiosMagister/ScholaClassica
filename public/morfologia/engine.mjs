// Motor puro, sin generación de flexiones ni redes externas.
import {selectReviewCandidates} from './review.mjs';
const fold=s=>String(s).normalize('NFC').trim();
export const COURSE_LABELS={latin:'Latín I',griego:'Griego I'};
export function validateBank(bank){
  if(bank?.schema!=='schola-morphology-source/v1'||!/^[a-f0-9]{40}$/.test(bank.appendixSha))
    throw Error('Banco morfológico no documentado');
  if(!Array.isArray(bank.records)||bank.records.length===0)throw Error('Banco vacío');
  const ids=new Set();
  for(const record of bank.records){
    if(!['latin','griego'].includes(record.language)||
       !Number.isInteger(record.unit)||!bank.coverage?.[record.language]?.includes(record.unit)||
       !['sustantivo','verbo','desinencia','artículo','adjetivo'].includes(record.kind)||
       !Array.isArray(record.forms)||record.forms.length<6||
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
function groupedForms(record){
  const groups=new Map();
  for(const entry of record.forms){
    const form=fold(entry.form);
    if(!groups.has(form))groups.set(form,new Set());
    groups.get(form).add(fold(entry.analysis));
  }
  return [...groups].map(([form,features])=>({form,analysis:[...features].join(' / ')}));
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
        const correct=shuffle(acceptedForms,rng)[0];
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
      for(const [index,g] of grouped.entries()){
        // Agrupar los casos sincréticos impide presentar falsas respuestas únicas.
        const distractors=unique(grouped.map(x=>x.analysis)).filter(x=>x!==g.analysis);
        if(distractors.length<3)continue;
        const options=shuffle([...shuffle(distractors,rng).slice(0,3),g.analysis],rng);
        candidates.push({
          id:record.id+':analysis:'+index,activity,
          prompt:'¿Qué análisis admite esta forma?',paradigm:record.paradigm,
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
    ' Alternativas documentadas: '+question.acceptedForms.join(' o ')+'.':'';
  return {correct:valid,expected:variants?question.acceptedForms.join(' / '):question.correct,
    note:question.ambiguous?'Esta forma tiene varios análisis posibles; se muestran juntos.':
      'Forma tomada directamente de un paradigma curricular publicado.'+variants};
}
