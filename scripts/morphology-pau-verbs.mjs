// Tiempos compuestos latinos: la unidad evaluada es participio + auxiliar,
// NO las palabras por separado. El participio concuerda con el sujeto;
// la voz de los deponentes se explica como morfológicamente pasiva.
import assert from 'node:assert/strict';
import {latinFold} from './morphology-pau-latin2.mjs';
const PERSONS=[
  ['1.ª','singular'],['2.ª','singular'],['3.ª','singular'],
  ['1.ª','plural'],['2.ª','plural'],['3.ª','plural']
];
const SUM={
  perfecto:['sum','es','est','sumus','estis','sunt'],
  pluscuamperfecto:['eram','eras','erat','eramus','eratis','erant'],
  'futuro perfecto':['ero','eris','erit','erimus','eritis','erunt']
};
const COMPOUNDS=[
  ['proficiscor','proficiscor, proficisci, profectus sum (3.ª deponente)','profect','deponente'],
  ['adgredior','aggredior, aggredi, aggressus sum (3.ª deponente)','aggress','deponente'],
  ['relinquo','relinquo, relinquere, reliqui, relictum (3.ª)','relict','pasivo'],
  ['pugno','pugno, pugnare, pugnavi, pugnatum (1.ª)','pugnat','impersonal'],
  ['depopulor','depopulor, depopulari, depopulatus sum (1.ª deponente)','depopulat','deponente'],
  ['commoror','commoror, commorari, commoratus sum (1.ª deponente)','commorat','deponente'],
  ['constituo','constituo, constituere, constitui, constitutum (3.ª)','constitut','pasivo'],
  ['conspicor','conspicor, conspicari, conspicatus sum (1.ª deponente)','conspicat','deponente'],
  ['polliceor','polliceor, polliceri, pollicitus sum (2.ª deponente)','pollicit','deponente'],
  ['venio','venio, venire, veni, ventum (4.ª)','vent','impersonal'],
  ['mitto','mitto, mittere, misi, missum (3.ª)','miss','pasivo']
];
const compoundForms=(base,number,gender)=>base+(number==='plural'?
  ({masculino:'i',femenino:'ae',neutro:'a'})[gender]:
  ({masculino:'us',femenino:'a',neutro:'um'})[gender]);
function emitRecord(id,headword,forms,{source,caption}={}){
  const dedup=[...new Map(forms.map(f=>[latinFold(f.form)+'|'+f.analysis,f])).values()];
  assert.ok(dedup.length>=6,'Paradigma verbal insuficiente: '+id);
  return {id:'latin2-pau-'+id,language:'latin2',unit:0,kind:'verbo',
    headword,paradigm:headword,forms:dedup,
    evidence:{source:source||'PAU de Latín II: texto + paradigmas regulares documentados',
      file:'shared/academic/latin2/pau-cv-2006-2026.tsv',
      status:'paradigma-documentado',topic:'Tiempos compuestos completos',
      caption:caption||id,verification:'modelo flexivo regular por concordancia y auxiliar; revisar variantes históricas',
      notes:'El participio y el auxiliar se evalúan como una sola forma verbal, con el lema léxico del verbo.'}};
}
export function compilePauCompoundVerbs(exams){
  const requested=new Set(exams.flatMap(q=>q.forms.map(latinFold)));
  const results=[];
  for(const [lemma,headword,stem,type] of COMPOUNDS){
    const forms=[];
    for(const [tense,auxiliaries] of Object.entries(SUM)){
      for(const [i,[person,number]] of PERSONS.entries()){
        for(const gender of type==='impersonal'?['neutro']:
          ['masculino','femenino','neutro']){
          if(type==='impersonal'&&(i!==2||number!=='singular'))continue;
          const ppp=compoundForms(stem,number,gender);
          const canonical=ppp+' '+auxiliaries[i];
          const voice=type==='deponente'?'pasiva (deponente, sentido activo)':'pasiva';
          const analysis='verbo · '+headword+' · '+person+' persona · '+number+
            ' · '+tense+' · indicativo · voz '+voice;
          forms.push({form:canonical,person:person+' '+number,tense,
            voice,analysis});
          if(lemma==='adgredior'&&stem==='aggress')
            forms.push({form:canonical.replace(/^aggress/,'adgress'),person:person+' '+number,tense,voice,analysis});
          // En textos latinos el auxiliar puede preceder al participio.
          if(lemma==='polliceor')forms.push({form:auxiliaries[i]+' '+ppp,
            person:person+' '+number,tense,voice,analysis});
        }
      }
    }
    assert.ok(forms.some(f=>requested.has(latinFold(f.form))),
      'Un compuesto no corresponde a una forma examinada: '+lemma);
    results.push(emitRecord('compuesto-'+lemma,headword,forms));
  }
  const utor='utor, uti, usus sum (3.ª deponente)';
  const future=[];
  for(const [number,masc,fem,neut] of [
    ['singular','usurus','usura','usurum'],
    ['plural','usuri','usurae','usura']
  ]){
    for(const form of [masc,fem,neut])future.push({
      form:form+' esse',tense:'futuro',voice:'activa',number,
      analysis:'infinitivo · '+utor+' · futuro · voz activa'
    });
  }
  assert.ok(future.some(f=>f.form==='usurum esse'));
  results.push({id:'latin2-pau-infinitivo-utor',language:'latin2',
    unit:0,kind:'infinitivo',headword:utor,paradigm:utor,forms:future,
    evidence:{source:'PAU de Latín II (septiembre 2009), modelo B',
      file:'shared/academic/latin2/pau-cv-2006-2026.tsv',status:'paradigma-documentado',
      topic:'Infinitivo futuro deponente',notes:'Formas completas del participio futuro + esse. Unidad de análisis: infinitivo.'}});
  return results;
}
const present=['venio','venis','venit','venimus','venitis','veniunt'];
const imperfect=['veniebam','veniebas','veniebat','veniebamus','veniebatis','veniebant'];
const future=['veniam','venies','veniet','veniemus','venietis','venient'];
const perfect=['veni','venisti','venit','venimus','venistis','venerunt'];
const pluperfect=['veneram','veneras','venerat','veneramus','veneratis','venerant'];
const futurePerfect=['venero','veneris','venerit','venerimus','veneritis','venerint'];
const subjPresent=['veniam','venias','veniat','veniamus','veniatis','veniant'];
const subjImperfect=['venirem','venires','veniret','veniremus','veniretis','venirent'];
const subjPerfect=['venerim','veneris','venerit','venerimus','veneritis','venerint'];
const subjPluperfect=['venissem','venisses','venisset','venissemus','venissetis','venissent'];
export function compileVenioParadigm(){
  const headword='venio, venire, veni, ventum (4.ª)',forms=[];
  for(const [mood,tense,values] of [
    ['indicativo','presente',present],['indicativo','imperfecto',imperfect],
    ['indicativo','futuro',future],['indicativo','perfecto',perfect],
    ['indicativo','pluscuamperfecto',pluperfect],
    ['indicativo','futuro perfecto',futurePerfect],
    ['subjuntivo','presente',subjPresent],
    ['subjuntivo','imperfecto',subjImperfect],
    ['subjuntivo','perfecto',subjPerfect],
    ['subjuntivo','pluscuamperfecto',subjPluperfect]
  ]){
    assert.equal(values.length,6);
    values.forEach((form,i)=>{
      const [person,number]=PERSONS[i];
      forms.push({form,person:person+' '+number,tense,voice:'activa',
        analysis:'verbo · '+headword+' · '+person+' persona · '+number+
          ' · '+tense+' · '+mood+' · voz activa'});
    });
  }
  const v=emitRecord('venio-indicativo-subjuntivo',headword,forms,{
    source:'PAU de Latín II: venire, venisset, venit; conjugación regular de venio',
    caption:'venio: cinco tiempos de presente/perfecto en indicativo y subjuntivo'
  });
  assert.deepEqual(v.forms.filter(f=>f.form==='venit').map(f=>f.tense),['presente','perfecto']);
  return v;
}
