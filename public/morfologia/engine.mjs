// Motor puro, sin generación de flexiones ni redes externas.
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
       !['sustantivo','verbo','desinencia','artículo'].includes(record.kind)||
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
export function makeQuestions(bank,{language,unit,activity='form',kind='todos',
  limit=10,rng=Math.random}={}){
  if(!['form','analysis'].includes(activity)||!Number.isInteger(limit)||limit<1||limit>30)
    throw Error('Modalidad o cantidad inválida');
  const records=availableRecords(bank,{language,unit,kind});
  const candidates=[];
  for(const record of records){
    const grouped=groupedForms(record);
    for(let index=0;index<record.forms.length;index++){
      const entry=record.forms[index];
      if(activity==='form'){
        const correct=fold(entry.form);
        const distractors=unique(grouped.map(x=>x.form)).filter(x=>x!==correct);
        if(distractors.length<3)continue;
        const options=shuffle([...shuffle(distractors,rng).slice(0,3),correct],rng);
        candidates.push({
          id:record.id+':form:'+index,activity,
          prompt:'Selecciona la forma de '+fold(entry.analysis)+'.',
          paradigm:record.paradigm,form:correct,correct,options,
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
  const selected=[];
  const used=new Set();
  // Mezclar preguntas de paradigmas distintos: no encadenar las 12 formas de rosa.
  const mixed=shuffle(candidates,rng);
  for(const q of mixed){
    if(used.has(q.id))continue;
    selected.push(q);used.add(q.id);
    if(selected.length>=limit)break;
  }
  return selected;
}
export function evaluate(question,choice){
  if(!question?.options?.includes(choice))throw Error('Respuesta ajena al ejercicio');
  return {correct:choice===question.correct,expected:question.correct,
    note:question.ambiguous?'Esta forma tiene varios análisis posibles; se muestran juntos.':
      'Forma tomada directamente de un paradigma curricular publicado.'};
}
