// Auditoría documental por tema y unidad: no corrige ni genera paradigmas.
// La presencia de una categoría flexiva no certifica por sí sola que cada
// contenido curricular de ese tema esté individualmente representado.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCurricularScope} from './audit-curricular-scope.mjs';
import {makeQuestions} from '../public/morfologia/engine.mjs';
import {makeWrittenQuestions,makeTableExercises} from '../public/morfologia/written.mjs';

const d=(topic,kinds,markers=[])=>({topic,mode:'introduced',kinds:Array.isArray(kinds)?kinds:[kinds],markers});
const reuse=(topic,kinds)=>({topic,mode:'reused',kinds:Array.isArray(kinds)?kinds:[kinds]});
const non=(topic,reason)=>({topic,mode:'not-flexional',reason});
const special=(topic,feature)=>({topic,mode:'special-case',feature});

export const CURRICULAR_MORPHOLOGY_PLAN=Object.freeze({
 latin1:[
  [d('Primera y segunda declinación','sustantivo'),
   d('Conjugaciones y presente activo','verbo'),
   d('Infinitivo de presente activo','infinitivo'),
   non('Funciones básicas de los casos','Funciones sintácticas; no hay paradigma adicional')],
  [d('Adjetivos de la primera clase','adjetivo'),
   non('Preposiciones','Categoría invariable; no se declina ni conjuga'),
   d('Imperfecto de indicativo activo','verbo'),
   special('El locativo','locativo')],
  [d('Pronombres personales','pronombre'),
   reuse('Adjetivos sustantivados',['adjetivo','sustantivo']),
   d('Presente e imperfecto pasivos','verbo'),
   d('Imperativo de presente','verbo')],
  [d('Tercera declinación','sustantivo'),
   d('Perfecto y pluscuamperfecto activos','verbo'),
   non('Aposición y dativo de aproximación','Funciones sintácticas, sin nuevos paradigmas')],
  [d('Adjetivos de la tercera declinación','adjetivo'),
   d('Pronombre reflexivo y pronombre fórico','pronombre')],
  [d('Demostrativos y relativo','pronombre'),
   non('Oraciones de relativo','Sintaxis de subordinación')],
  [d('Cuarta y quinta declinación','sustantivo'),
   d('Verbos deponentes','verbo'),
   d('Futuro imperfecto de indicativo: activa, pasiva y sum','verbo'),
   non('Dativo posesivo','Función sintáctica')],
  [d('Infinitivos y oración de infinitivo','verbo',['infinitivo']),
   d('Identidad y énfasis','pronombre'),
   non('Quod causal','Nexo y sintaxis, sin flexión propia')],
  [d('Comparativos y superlativos','adjetivo'),
   d('Participio de perfecto y tiempos compuestos pasivos','verbo',['pasivo'])],
  [d('Participios concertados y ablativo absoluto','participio'),
   non('Acusativo de extensión','Función sintáctica')]
 ],
 latin4:[
  [non('Lengua flexiva y conceptos fundamentales','Introducción conceptual'),
   non('Funciones de los casos','Sintaxis de los casos'),
   d('Primera declinación','sustantivo')],
  [d('Segunda declinación','sustantivo'),
   d('Conjugaciones y presente de indicativo','verbo')],
  [d('Adjetivos de primera clase y concordancia','adjetivo'),
   non('Preposiciones y casos','Preposiciones invariables y régimen')],
  [d('Imperfecto de indicativo activo','verbo')],
  [d('Tercera declinación','sustantivo')],
  [d('Perfecto de indicativo activo','verbo'),
   d('Voz pasiva: presente e imperfecto','verbo')],
  [d('Adjetivos de la tercera declinación','adjetivo'),
   d('Pluscuamperfecto de indicativo activo','verbo')],
  [d('Cuarta y quinta declinación','sustantivo'),
   d('Pronombres personales','pronombre')]
 ],
 griego1:[
  [d('Segunda declinación masculina','desinencia'),
   d('Presente de εἰμί','verbo'),
   non('Copulativas con nominativo y genitivo','Sintaxis')],
  [d('Segunda declinación neutra','desinencia'),
   d('Presente de indicativo activo','verbo'),
   non('Acusativo y demás casos','Funciones de los casos')],
  [d('Primera declinación','desinencia'),d('El artículo','artículo')],
  [non('Preposiciones','Invariables, sin declinación'),
   non('Genitivo como complemento de régimen','Sintaxis')],
  [d('Adjetivos 2–1–2 y 2–2','adjetivo'),
   d('Adjetivos irregulares: πολύς y μέγας','adjetivo'),
   reuse('Sustantivación del adjetivo',['adjetivo','artículo'])],
  [d('Presente medio-pasivo','verbo'),
   d('Infinitivos de presente activo y medio','infinitivo')],
  [d('Demostrativos, anafórico y personales','pronombre')],
  [d('Interrogativos e indefinidos','pronombre'),
   non('Oraciones interrogativas','Sintaxis'),
   d('Tercera declinación: consonantes','sustantivo')],
  [d('Pronombre relativo ὅς, ἥ, ὅ','pronombre'),
   non('Oraciones de relativo','Sintaxis')],
  [d('Participios de presente activo y medio','participio'),
   reuse('Participio concertado, atributivo y genitivo absoluto','participio')],
  [d('Futuro e imperfecto activos','verbo')],
  [d('Aoristo sigmático y temático','verbo')],
  [d('Perfecto y pluscuamperfecto activos','verbo')],
  [d('Verbos contractos','verbo'),
   d('Temas en silbante','sustantivo')]
 ]
});
const COURSE=Object.freeze([
 {id:'latin1',language:'latin',grammar:'latin',total:10},
 {id:'latin4',language:'latin4',grammar:'latin',total:8},
 {id:'griego1',language:'griego',grammar:'griego',total:14}
]);
// Dos reservas docentes cerradas en PR #120. Verificamos la identidad,
 // la adscripción, las formas literales y el alcance de los ejercicios:
 // una casilla nominal de locativo no equivale a una declinación regular.
export const EARLY_LATIN1_RESOLUTIONS=Object.freeze({
  infinitives:{
    id:'latin-ud1-infinitivos-presente-ejemplos',unit:1,kind:'infinitivo',
    topic:'Infinitivo de presente activo',
    forms:['amare','habere','ducere','audire','capere']
  },
  locatives:{
    id:'latin-ud2-locativos-ejemplos',unit:2,kind:'sustantivo',
    topic:'El locativo',
    forms:['Corinthi','Romæ','domi','humi','ruri']
  }
});
function verifiedEarlyRecord(records,definition,{locative=false}={}){
  const matches=records.filter(r=>r.id===definition.id);
  if(matches.length!==1)return null;
  const r=matches[0];
  if(r.language!=='latin'||r.unit!==definition.unit||r.kind!==definition.kind||
     r.evidence?.topic!==definition.topic||
     r.evidence?.status!=='paradigma-documentado'||
     r.forms.length!==5||
     JSON.stringify(r.forms.map(f=>f.form.normalize('NFC')))!==
       JSON.stringify(definition.forms.map(s=>s.normalize('NFC'))))return null;
  if(locative){
    if(r.evidence?.practiceScope!=='recognition-only'||!r.forms.every(f=>
      f.case==='locativo'&&f.number==='singular'&&
      String(f.analysis).includes('valor locativo')))return null;
  }else if(r.evidence?.practiceScope||!r.forms.every(f=>
    f.tense==='presente'&&f.voice==='activa'&&
    String(f.analysis).includes('infinitivo de presente activo')))return null;
  return r;
}
const rng=()=>0.371;
const tableCount=html=>(String(html).match(/<table\b/gu)||[]).length;
const sampleModes=(bank,language,unit,kind,subset)=>{
  if(!subset.length)return {choiceAnalysis:0,choiceForm:0,written:0,tables:0};
  const local={...bank,records:subset};
  const req={language,unit,kind,limit:20,rng};
  const output={};
  for(const [key,compute] of [
    ['choiceAnalysis',()=>makeQuestions(local,{...req,activity:'analysis'}).length],
    ['choiceForm',()=>makeQuestions(local,{...req,activity:'form'}).length],
    ['written',()=>makeWrittenQuestions(local,req).length],
    ['tables',()=>makeTableExercises(local,req).length]
  ]){
    try{output[key]=compute()}
    catch(error){output[key]=0;output[key+'Error']=String(error?.message||error)}
  }
  return output;
};
export function auditMorphologyCurricularCoverage({bank,curricula},{sampleExercises=true}={}){
  assert.ok(bank?.records?.length>=262,'Banco de morfología ausente');
  const courses={};
  const findings=[];
  for(const spec of COURSE){
    const es=curricula[spec.id]?.es?.[spec.grammar]?.units;
    const va=curricula[spec.id]?.val?.[spec.grammar]?.units;
    assert.ok(Array.isArray(es)&&Array.isArray(va)&&es.length===spec.total&&va.length===es.length,
      'Secuencia ES/VAL incompleta: '+spec.id);
    const plan=CURRICULAR_MORPHOLOGY_PLAN[spec.id];
    assert.equal(plan.length,spec.total,'Plan morfológico incompleto: '+spec.id);
    const records=bank.records.filter(x=>x.language===spec.language);
    const units=[];
    for(let index=0;index<spec.total;index++){
      const number=index+1,lessons=es[index].topics,translations=va[index].topics;
      assert.equal(es[index].number,number,'Orden de unidades ES: '+spec.id);
      assert.equal(va[index].number,number,'Orden de unidades VAL: '+spec.id);
      assert.deepEqual(lessons.map(x=>x.title),plan[index].map(x=>x.topic),
        'El tema escolar cambió: revisar matriz '+spec.id+' UD'+number);
      assert.equal(lessons.length,translations.length,
        'Cantidad de epígrafes desigual ES/VAL '+spec.id+' UD'+number);
      assert.deepEqual(lessons.map(x=>tableCount(x.html)),
        translations.map(x=>tableCount(x.html)),
        'Tablas desiguales ES/VAL '+spec.id+' UD'+number);
      const introduced=records.filter(r=>r.unit===number);
      const accumulated=records.filter(r=>r.unit<=number);
      const topics=plan[index].map((rule,i)=>{
        const same=introduced.filter(r=>rule.kinds?.includes(r.kind));
        const all=accumulated.filter(r=>rule.kinds?.includes(r.kind));
        const evidenceSame=introduced.filter(r=>r.evidence?.topic===rule.topic);
        const markers=rule.markers||[];
        const markerMatches=markers.every(marker=>same.some(r=>
          r.forms.some(f=>String(f.analysis||'').toLowerCase()
            .includes(marker.toLowerCase()))));
        let status='no-aplica-flexion',forms=0,exercise=null;
        if(rule.mode==='special-case'){
          const specialForms=accumulated.flatMap(r=>r.forms||[])
            .filter(f=>f.case===rule.feature);
          forms=specialForms.length;
          const locative=spec.id==='latin1'&&number===2&&
            rule.topic==='El locativo'?
            verifiedEarlyRecord(records,EARLY_LATIN1_RESOLUTIONS.locatives,
              {locative:true}):null;
          status=locative?'caso-especial-presente':
            (forms?'caso-especial-incompleto':'caso-especial-sin-ficha');
          if(sampleExercises&&locative){
            const modes=sampleModes(bank,spec.language,number,'sustantivo',[locative]);
            exercise={sustantivo:modes};
            if(modes.choiceAnalysis!==5||modes.choiceForm!==0||
               modes.written!==0||modes.tables!==0)
              status='caso-especial-politica-invalida';
          }
        }else if(rule.mode==='introduced'||rule.mode==='reused'){
          forms=same.reduce((a,r)=>a+r.forms.length,0);
          if(rule.mode==='introduced'){
            status=rule.kinds.every(kind=>same.some(r=>r.kind===kind))&&markerMatches?
              'categoria-introducida':
              (same.length?'categoria-sin-rasgo-tematico':'sin-modelo-nuevo-de-la-categoria');
          }else{
            status=rule.kinds.every(kind=>all.some(r=>r.kind===kind))?
              'aplicacion-de-modelos-previos':'aplicacion-sin-todos-los-modelos';
          }
          if(sampleExercises){
            exercise=Object.fromEntries(rule.kinds.map(kind=>{
              const subset=rule.mode==='introduced'?same.filter(r=>r.kind===kind):
                all.filter(r=>r.kind===kind);
              return [kind,sampleModes(bank,spec.language,number,kind,subset)];
            }));
          }
          if(spec.id==='latin1'&&number===1&&
             rule.topic==='Infinitivo de presente activo'){
            const infinitive=verifiedEarlyRecord(records,EARLY_LATIN1_RESOLUTIONS.infinitives);
            status=infinitive?'ejemplos-documentados-practicables':
              'ejemplos-documentados-pendientes';
            if(infinitive&&sampleExercises){
              const modes=exercise?.infinitivo;
              if(modes?.choiceAnalysis!==5||modes?.choiceForm!==5||
                 modes?.written!==5||modes?.tables!==0)
                status='ejemplos-documentados-no-practicables';
            }
          }
        }
        const result={
          topic:rule.topic,mode:rule.mode,
          ...(rule.kinds?{kinds:rule.kinds}:{}),
          ...(rule.reason?{reason:rule.reason}:{}),
          ...(rule.feature?{feature:rule.feature}:{}),
          status,newRecords:same.length,newForms:forms,
          exactTopicEvidence:evidenceSame.length,
          inheritedRecords:all.length,
          ...(markers.length?{markers,markerMatches}:{}),
          ...(exercise?{exercise}:{}),
          ...(rule.mode==='introduced'?{recordIds:same.map(r=>r.id)}:{})
        };
        if(['sin-modelo-nuevo-de-la-categoria','categoria-sin-rasgo-tematico',
           'aplicacion-sin-todos-los-modelos','caso-especial-sin-ficha',
           'caso-especial-incompleto','caso-especial-politica-invalida',
           'ejemplos-documentados-pendientes',
           'ejemplos-documentados-no-practicables'].includes(status)){
          findings.push({course:spec.id,unit:number,topic:rule.topic,
            status,affectedKinds:rule.kinds||[rule.feature],
            note:'Candidato de revisión. La ausencia de un modelo introducido en esta unidad no demuestra por sí sola falta de todas las formas; cotejar material y práctica.'});
        }
        return result;
      });
      units.push({
        unit:number,topics,
        newRecords:introduced.length,newByKind:Object.fromEntries(
          [...new Set(introduced.map(r=>r.kind))].sort().map(k=>[
            k,introduced.filter(r=>r.kind===k).length])
        ),
        cumulativeRecords:accumulated.length,
        newForms:introduced.reduce((s,r)=>s+r.forms.length,0)
      });
    }
    assert.equal(units.reduce((s,u)=>s+u.newRecords,0),records.length,
      'No figuran todos los paradigmas: '+spec.id);
    courses[spec.id]={grammarUnits:spec.total,records:records.length,units};
  }
  const ud1=courses.latin1.units[0].topics.find(t=>
    t.topic==='Infinitivo de presente activo');
  const ud2=courses.latin1.units[1].topics.find(t=>t.topic==='El locativo');
  const resolutions=[
    ...(ud1.status==='ejemplos-documentados-practicables'?[{
      course:'latin1',unit:1,topic:ud1.topic,
      recordId:EARLY_LATIN1_RESOLUTIONS.infinitives.id,
      forms:EARLY_LATIN1_RESOLUTIONS.infinitives.forms,
      scope:'Análisis, elección y escritura: cinco infinitivos presentes activos',
      sourcePR:120
    }]:[]),
    ...(ud2.status==='caso-especial-presente'?[{
      course:'latin1',unit:2,topic:ud2.topic,
      recordId:EARLY_LATIN1_RESOLUTIONS.locatives.id,
      forms:EARLY_LATIN1_RESOLUTIONS.locatives.forms,
      scope:'Solo reconocimiento de cinco locativos; sin producción ni tabla',
      sourcePR:120
    }]:[])
  ];
  return {
    schema:'scholaclassica-cobertura-morfologia-unidades/v1',
    counts:{latin1:courses.latin1.records,latin4:courses.latin4.records,
      griego1:courses.griego1.records},
    courses,findings,
    findingsTotal:findings.length,
    resolutions,
    resolutionsTotal:resolutions.length,
    limitations:[
      'La presencia de modelos de una categoría no acredita todos los subtipos ni todas las formas de un epígrafe.',
      'Los epígrafes sintácticos y las preposiciones invariables no se cuentan como paradigmas faltantes.',
      'Una ausencia se señala para revisión docente/filológica, no autoriza generar flexiones por analogía.',
      'La comparación ES/VAL comprueba estructura y número de tablas, no equivalencia semántica de cada explicación.',
      'Ningún ID, forma, unidad, progreso o fichero de aplicaciones originales se modifica.'
    ]
  };
}
export function loadMorphologyCurricularCoverage(root){
  const {bank,curricula}=loadCurricularScope(root);
  return {bank,curricula};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
  const root=resolve(import.meta.dirname,'..');
  const report=auditMorphologyCurricularCoverage(loadMorphologyCurricularCoverage(root));
  const out=join(root,'build/academic-audits/morphology');
  mkdirSync(out,{recursive:true});
  writeFileSync(join(out,'cobertura-por-unidades-v1.json'),
    JSON.stringify(report,null,2)+'\n');
  console.log('AUDITORIA_MORFOLOGIA_UNIDADES',JSON.stringify({
    counts:report.counts,findingsTotal:report.findingsTotal,
    findings:report.findings,
    resolutionsTotal:report.resolutionsTotal,
    resolutions:report.resolutions,
    byUnit:Object.fromEntries(Object.entries(report.courses).map(([key,c])=>[
      key,c.units.map(u=>({unit:u.unit,newRecords:u.newRecords,
        newByKind:u.newByKind,topics:u.topics.map(t=>({topic:t.topic,status:t.status,
          newRecords:t.newRecords,exercise:t.exercise}))}))
    ]))
  }));
}
