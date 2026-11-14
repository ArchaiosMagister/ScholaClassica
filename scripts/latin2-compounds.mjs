// Auditoría conservadora de las perífrasis de Latín II.
// La comprobación estructural NO equivale a atestiguación textual ni verifica
// de oficio una flexión; no transforma ni elimina fichas de alumnos.
import {latinKey} from './lexicografia-latin2.mjs';

export const COMPOUND_SCHEMA='schola-latin2-compound-audit/v1';
const tables={
  'perfecto|indicativo':{forms:['sum','es','est','sumus','estis','sunt'],tense:'presente'},
  'pluscuamperfecto|indicativo':{forms:['eram','eras','erat','eramus','eratis','erant'],tense:'imperfecto'},
  'futuro perfecto|indicativo':{forms:['ero','eris','erit','erimus','eritis','erunt'],tense:'futuro'},
  'perfecto|subjuntivo':{forms:['sim','sis','sit','simus','sitis','sint'],tense:'presente'},
  'pluscuamperfecto|subjuntivo':{forms:['essem','esses','esset','essemus','essetis','essent'],tense:'imperfecto'}
};
const AUX=new Map();
for(const [key,{forms,tense}] of Object.entries(tables)){
  const [perfectTime,mood]=key.split('|');
  for(let i=0;i<forms.length;i++)
    AUX.set(forms[i],{perfectTime,mood,tense,person:String(i%3+1),
      number:i<3?'SG':'PL',lemma:'sum'});
}
const participleEndings={
  SG:{masculino:'us',femenino:'a',neutro:'um'},
  PL:{masculino:'i',femenino:'ae',neutro:'a'}
};
const pastTime=['futuro perfecto','pluscuamperfecto','perfecto'];
const finiteMood=['indicativo','subjuntivo'];

function properties(target){
  const parts=target.analysis.split(' · ');
  const time=pastTime.find(t=>parts.includes(t));
  const mood=finiteMood.find(t=>parts.includes(t));
  const enunciation=parts[1]||'';
  const last=enunciation.split(',').at(-1).trim();
  const fourth=last.match(/^([\p{L}]+)/u)?.[1]||'';
  // La última forma del enunciado puede ser supino en -um o
  // participio de deponente en -us; nunca inventar otro tema.
  const principal=latinKey(fourth);
  const stem=/^(.*)(?:um|us)$/.exec(principal)?.[1]||null;
  const gender=parts.find(p=>p.startsWith('concordancia '))?.split(' ')[1]||null;
  return {time,mood,stem,principal,gender,voice:parts.find(p=>p.startsWith('voz '))||''};
}
export function analyseCompound(target){
  if(target.type!=='compuesto')return null;
  const tokens=latinKey(target.form).split(' ');
  const p=properties(target);
  const result={id:target.id,recordId:target.recordId,lemma:target.lemma,
    form:target.form,analysis:target.analysis,priority:target.priority,
    kind:target.kind,construction:null,status:'reserva-de-analisis',
    components:[],checks:[],issues:[],
    evidence:[]};
  if(tokens.length!==2){
    result.issues.push('secuencia-no-binaria');return result;
  }
  const [a,b]=tokens;
  if(target.kind==='verbo'){
    const aAux=AUX.get(a),bAux=AUX.get(b);
    if(Boolean(aAux)===Boolean(bAux)){
      result.issues.push('auxiliar-ausente-o-ambiguo');return result;
    }
    const aux=aAux||bAux,auxWord=aAux?a:b,ptcp=aAux?b:a;
    result.construction='participio-perfecto+sum';
    result.components=[{role:'participio',form:ptcp,lemma:target.lemma},
      {role:'auxiliar',form:auxWord,lemma:'sum'}];
    const expectedNum=target.expected?.number;
    if(p.time!==aux.perfectTime||p.mood!==aux.mood)
      result.issues.push('tiempo-modo-auxiliar');
    else result.checks.push('tiempo-modo-auxiliar');
    if(aux.person!==target.expected?.person||aux.number!==expectedNum)
      result.issues.push('persona-numero-auxiliar');
    else result.checks.push('persona-numero-auxiliar');
    if(p.voice&&!p.voice.includes('pasiva'))
      result.issues.push('perifrasis-no-pasiva');
    else result.checks.push('voz-analitica');
    if(!p.stem){
      result.issues.push('enunciado-sin-tema-de-supino');
    }else{
      const recognized=Object.entries(participleEndings[expectedNum]||{})
        .filter(([g,end])=>ptcp===p.stem+end&&(p.gender===null||p.gender===g));
      if(recognized.length){
        result.checks.push('concordancia-participial');
        result.checks.push('tema-del-enunciado');
        result.participleInterpretations=recognized.map(([gender])=>({
          gender,number:expectedNum,case:'NOM'}));
      }else if(/(?:us|um|ae|i|a)$/.test(ptcp)){
        result.issues.push('tema-o-concordancia-no-coincidente');
      }else result.issues.push('participio-no-identificado');
    }
  }else if(target.kind==='infinitivo'){
    const infinitiveTime=p.time,verbVoice=p.voice;
    const isFutureActive=infinitiveTime==='futuro'&&verbVoice.includes('activa');
    const isPerfectPassive=infinitiveTime==='perfecto'&&verbVoice.includes('pasiva');
    const isFuturePassive=infinitiveTime==='futuro'&&verbVoice.includes('pasiva');
    let expectedAux=null,word=null;
    if(isFutureActive){
      expectedAux='esse';result.construction='participio-futuro-activo+esse';
    }else if(isPerfectPassive){
      expectedAux='esse';result.construction='participio-perfecto-acusativo+esse';
    }else if(isFuturePassive){
      expectedAux='iri';result.construction='supino+iri';
    }else{
      result.issues.push('tiempo-voz-infinitivo-incompatible');return result;
    }
    if(b!==expectedAux){
      result.issues.push('auxiliar-infinitivo-incorrecto');return result;
    }
    result.components=[{role:isFuturePassive?'supino':'participio',form:a,
      lemma:target.lemma},{role:'auxiliar',form:b,lemma:b==='esse'?'sum':'eo'}];
    result.checks.push('auxiliar-y-tiempo-infinitivo');
    if(!p.stem){
      if(target.lemma==='sum'&&a==='futurum'&&isFutureActive){
        result.construction='infinitivo-futuro-irregular-sum';
        result.status='estructura-excepcional-sum';
        result.checks.push('forma-irregular-documentada');
        return result;
      }
      result.issues.push('enunciado-sin-tema-de-supino');
    }else{
      if(isFutureActive){
        // En el infinitivo activo de futuro el participio concuerda
        // normalmente en ACUSATIVO con el sujeto del ACI, no en nominativo.
        const accepted=new Set(['urum','uram','uros','uras','ura'].map(end=>p.stem+end));
        if(accepted.has(a))result.checks.push('participio-futuro-acusativo');
        else if(['urus','uri','urae'].some(end=>a===p.stem+end))
          result.issues.push('participio-futuro-en-nominativo-no-acusativo');
        else result.issues.push('tema-de-futuro-no-coincidente');
      }else{
        if(a===p.stem+'um')result.checks.push(isFuturePassive?
          'supino-acusativo':'participio-perfecto-acusativo');
        else result.issues.push('tema-de-supino-no-coincidente');
      }
    }
  }else{
    result.issues.push('categoria-compuesta-no-prevista');return result;
  }
  if(result.issues.length){
    // Una diferencia frente al enunciado es una reserva técnica,
    // no la declaración de que una grafía latina es imposible.
    result.status='reserva-de-analisis';
  }else result.status='estructura-compatible-con-paradigma';
  return result;
}
export function createCompoundWitnessCollector(compounds){
  const wanted=new Set();
  for(const c of compounds)for(const w of c.components)
    wanted.add(latinKey(w.lemma)+'\u0000'+latinKey(w.form));
  const rows=new Map(),seen=new Map();
  return {
    ingest(row,source,revision){
      const key=latinKey(row.lemma)+'\u0000'+latinKey(row.form);
      if(!wanted.has(key))return;
      const foundKey=key+'\u0000'+source;
      const identity=String(row.rawFeatures||row.features?.join(';')||'');
      if(!seen.has(foundKey))seen.set(foundKey,new Set());
      if(seen.get(foundKey).has(identity)||seen.get(foundKey).size>=5)return;
      seen.get(foundKey).add(identity);
      if(!rows.has(key))rows.set(key,[]);
      rows.get(key).push({source,revision,features:identity,
        ...(row.reference?{reference:row.reference}:{})});
    },
    complete(compounds){
      for(const c of compounds){
        c.componentEvidence=c.components.map(w=>{
          const key=latinKey(w.lemma)+'\u0000'+latinKey(w.form);
          const evidence=rows.get(key)||[];
          return {role:w.role,form:w.form,lemma:w.lemma,
            sources:[...new Set(evidence.map(e=>e.source))],evidence};
        });
        c.evidenceSources=[...new Set(c.componentEvidence.flatMap(x=>x.sources))];
        c.componentCoverage=c.componentEvidence.filter(x=>x.sources.length).length;
      }
      return compounds;
    }
  };
}
export function summarizeCompounds(compounds){
  const counter=fn=>Object.fromEntries([...new Set(compounds.map(fn))]
    .sort().map(k=>[k,compounds.filter(x=>fn(x)===k).length]));
  return {schema:COMPOUND_SCHEMA,
    total:compounds.length,
    byPriority:counter(x=>x.priority),
    byKind:counter(x=>x.kind),
    byStatus:counter(x=>x.status),
    byIssue:Object.fromEntries([...new Set(compounds.flatMap(x=>x.issues))]
      .sort().map(issue=>[issue,compounds.filter(x=>x.issues.includes(issue)).length])),
    componentsWithCorpusEvidence:compounds.filter(x=>x.componentCoverage===2).length,
    componentsWithPartialEvidence:compounds.filter(x=>x.componentCoverage===1).length,
    componentsWithoutCorpusEvidence:compounds.filter(x=>x.componentCoverage===0).length,
    individuallyVerified:false,attestedPhrases:0,modifiedBankRecords:0,
    note:'La estructura de una perífrasis y el cotejo de componentes NO prueban la atestiguación de toda la expresión ni certifican respuestas.'};
}
