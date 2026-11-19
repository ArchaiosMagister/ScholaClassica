'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const persons=['1st sg.','2nd sg.','3rd sg.','1st pl.','2nd pl.','3rd pl.'];
const present=['amō','amās','amat','amāmus','amātis','amant'];
const imperfect=['amābam','amābās','amābat','amābāmus','amābātis','amābant'];
const perfect=['amāvī','amāvistī','amāvit','amāvimus','amāvistis','amāvērunt'];
const passive=['amor','amāris','amātur','amāmur','amāminī','amantur'];
const answer={
 slug:'amo',url:'https://latindictionary.co/amo',
 attribution:'Latin Dictionary / Perseus / Wiktionary (CC BY-SA)',
 lemmas:[{headword:'amō',part_of_speech:'verb',
  principal_parts:['amō','amāre','amāvī','amātum'],inflection:'conjugation-1',
  paradigm:{kind:'verb',tables:[
   {title:'active indicative',columns:['present','imperfect','perfect'],rows:persons.map((label,i)=>({
    label,cells:[[present[i]],[imperfect[i]],[perfect[i]]]
   }))},
   {title:'passive indicative',columns:['present'],rows:persons.map((label,i)=>({label,cells:[[passive[i]]]}))}
  ]}
 }]
};
const cases=['nominative','genitive','dative','accusative','ablative','vocative'];
const singular=['puella','puellae','puellae','puellam','puellā','puella'];
const plural=['puellae','puellārum','puellīs','puellās','puellīs','puellae'];
const puella={slug:'puella',attribution:'Perseus and Wiktionary (CC BY-SA)',lemmas:[
 {part_of_speech:'noun',principal_parts:['puella','puellae'],gender:'feminine',
 paradigm:{kind:'noun',tables:[{title:'declension',columns:['singular','plural'],
  rows:cases.map((label,i)=>({label,cells:[i===0?['puella','puellula']:[singular[i]],[plural[i]]]}))}]}}
]};
const bonusSing=[
 [['bonus'],['bona'],['bonum']],[['bonī'],['bonae'],['bonī']],
 [['bonō'],['bonae'],['bonō']],[['bonum'],['bonam'],['bonum']],
 [['bonō'],['bonā'],['bonō']],[['bone'],['bona'],['bonum']]
];
const bonusPl=[
 [['bonī'],['bonae'],['bona']],[['bonōrum'],['bonārum'],['bonōrum']],
 [['bonīs'],['bonīs'],['bonīs']],[['bonōs'],['bonās'],['bona']],
 [['bonīs'],['bonīs'],['bonīs']],[['bonī'],['bonae'],['bona']]
];
const bonus={slug:'bonus',lemmas:[
 {part_of_speech:'adjective',principal_parts:['bonus','bona','bonum'],
  paradigm:{kind:'adj',tables:[
   {title:'singular',columns:['masculine','feminine','neuter'],rows:cases.map((label,i)=>({label,cells:bonusSing[i]}))},
   {title:'plural',columns:['masculine','feminine','neuter'],rows:cases.map((label,i)=>({label,cells:bonusPl[i]}))}
  ]}}
]};
let calls=0;
const win={},scope={window:win,console,AbortController,setTimeout,clearTimeout,
 fetch:async url=>{
  calls++;
  assert.ok(url.startsWith('https://latindictionary.co/api/v1/entry/'));
  const name=url.split('/').at(-1);
  assert.ok(['amo','puella','bonus'].includes(name));
  return {ok:true,json:async()=>({amo:answer,puella,bonus})[name]};
 }};
function load(name){vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),scope,{filename:name})}
load('data.js');load('gramatica-enunciados.js');load('gramatica-respaldo-online.js');
async function main(){
 const api=win.GrammarOnlineBackup;
 const candidates=api.candidates('lat1',['UD 1','UD 2','UD 3','UD 4']);
 assert.ok(candidates.some(x=>x.lemma==='amo'));
 assert.ok(!candidates.some(x=>x.lemma==='palabra-que-no-existe'));
 const data=await api.load('lat1','amo');
 assert.equal(data.supported,true);
 assert.equal(calls,1);
 const write=data.items.filter(q=>q.mode==='write');
 const choices=data.items.filter(q=>q.mode==='choice');
 assert.equal(write.length,24,'Cuatro tiempos o voces con seis personas');
 assert.ok(choices.length>=18);
 assert.ok(write.some(q=>q.subject==='lat1'&&q.unit==='UD 1'&&q.topic==='El presente de indicativo y el infinitivo'));
 assert.ok(write.some(q=>q.subject==='lat1'&&q.unit==='UD 2'&&q.topic==='El imperfecto de indicativo'));
 assert.ok(write.some(q=>q.subject==='lat1'&&q.unit==='UD 3'&&q.topic==='Voz pasiva'));
 assert.ok(write.some(q=>q.subject==='lat1'&&q.unit==='UD 4'&&q.topic==='El perfecto y el pluscuamperfecto de indicativo'));
 assert.ok(write.every(q=>q.category==='Morfología verbal'&&q.language==='lat'&&q.source==='Latin Dictionary API'));
 assert.ok(write.every(q=>q.accepted.length&&q.accepted.includes(q.answer.toLowerCase().normalize('NFD').replace(/\p{M}/gu,''))));
 assert.ok(write.every(q=>q.prompt.includes('amo, amavi, amatum (1ª)')));
 assert.ok(choices.every(q=>new Set(q.options).size===q.options.length&&q.options.includes(q.answer)));
 assert.equal(new Set(data.items.map(q=>q.id)).size,data.items.length);
 const latin4=await api.load('lat4','amo');
 assert.ok(latin4.items.some(q=>q.unit==='UD 2'&&q.topic==='Repaso morfológico acumulativo')||
  latin4.items.some(q=>q.unit==='UD 2'&&q.topic==='Presente'));
 assert.equal(calls,1,'Una consulta por lema, con caché entre cursos');
 const unknown=await api.load('lat1','palabra-inventada');
 assert.equal(unknown.items.length,0);
 assert.equal(calls,1,'Un lema ajeno al vocabulario no genera solicitudes');
 const noun=await api.load('lat1','puella');
 const nounWrites=noun.items.filter(q=>q.mode==='write');
 assert.equal(nounWrites.length,12,'Las declinaciones deben admitir seis casos y dos números');
 assert.ok(nounWrites.every(q=>q.category==='Morfología nominal'&&q.topic==='Primera y segunda declinación'));
 assert.ok(nounWrites.every(q=>!q.accepted.includes('puellula')),'No se admiten diminutivos de la tabla como variantes');
 assert.ok(nounWrites.some(q=>q.answer==='puellārum'));
 const adjective=await api.load('lat1','bonus');
 const adjectiveWrites=adjective.items.filter(q=>q.mode==='write');
 assert.equal(adjectiveWrites.length,36,'Tres géneros, seis casos y dos números');
 assert.ok(adjectiveWrites.some(q=>q.topic==='Los adjetivos'&&q.prompt.includes('femenino singular')));
 assert.equal(calls,3);
 const greek=await api.load('gr1','λύω');
 assert.equal(greek.supported,false);
 assert.equal(greek.items.length,0,'El diccionario latino no genera respuestas griegas');
 assert.equal(calls,3);
 const altered=JSON.parse(JSON.stringify(answer));
 altered.lemmas[0].principal_parts[2]='un-perfecto-falso';
 assert.equal(api.asQuestions('lat1','amo',altered).length,0,'Rechazar principales que no coincidan con el vocabulario');
 console.log('OK respaldo online: 24 preguntas de escritura, análisis inequívocos, currículos y enunciados completos sin inventar formas.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
