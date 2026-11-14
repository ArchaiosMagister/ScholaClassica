// Revisión de nueve paradigmas exigibles de Griego I: 90 casillas
// contrastadas individualmente con paradigmas de flexión ática.
// Inventario estático transcrito tras cotejo de tablas nominales externas.
// No construye ni corrige formas por reglas: si una casilla del corpus
// congelado discrepa, interrumpe la compilación y exige revisión.
// NO equivale a documentar 90 ocurrencias en autores clásicos.
import assert from 'node:assert/strict';

export const REVIEW_DATE='2026-11-14';
export const CASE_ORDER=['nominativo','vocativo','acusativo','genitivo','dativo'];
export const NUMBER_ORDER=['singular','plural'];
const FIRST_GRAMMAR='https://human.libretexts.org/Bookshelves/Languages/Greek/Ancient_Greek_I%3A_A_21st_Century_Approach_%28Peek%29/01%3A_Chapters/1.17%3A_First_Declension_Nouns_in__and_-_and';
const SECOND_GRAMMAR='https://human.libretexts.org/Bookshelves/Languages/Greek/Ancient_Greek_I%3A_A_21st_Century_Approach_%28Peek%29/01%3A_Chapters/1.19%3A_Second_Declension_Nouns';

// Cada fila es exactamente [caso, singular, plural] en orden
// nominativo, vocativo, acusativo, genitivo, dativo.
// Fuente por lema: tabla de declinación ática del artículo indicado;
// contraste gramatical independiente: Peek (BGSU/LibreTexts).
export const INDIVIDUAL_GREEK_NOUN_CHECKS=[
 {id:'arche',lemma:'ἀρχή',unit:5,gender:'femenino',
  url:'https://en.wiktionary.org/wiki/ἀρχή',grammar:FIRST_GRAMMAR,
  forms:[
   ['nominativo','ἀρχή','ἀρχαί'],
   ['vocativo','ἀρχή','ἀρχαί'],
   ['acusativo','ἀρχήν','ἀρχάς'],
   ['genitivo','ἀρχῆς','ἀρχῶν'],
   ['dativo','ἀρχῇ','ἀρχαῖς']
  ]},
 {id:'strategos',lemma:'στρατηγός',unit:5,gender:'masculino',
  url:'https://en.wiktionary.org/wiki/στρατηγός',grammar:SECOND_GRAMMAR,
  forms:[
   ['nominativo','στρατηγός','στρατηγοί'],
   ['vocativo','στρατηγέ','στρατηγοί'],
   ['acusativo','στρατηγόν','στρατηγούς'],
   ['genitivo','στρατηγοῦ','στρατηγῶν'],
   ['dativo','στρατηγῷ','στρατηγοῖς']
  ]},
 {id:'epistole',lemma:'ἐπιστολή',unit:7,gender:'femenino',
  url:'https://en.wiktionary.org/wiki/ἐπιστολή',grammar:FIRST_GRAMMAR,
  forms:[
   ['nominativo','ἐπιστολή','ἐπιστολαί'],
   ['vocativo','ἐπιστολή','ἐπιστολαί'],
   ['acusativo','ἐπιστολήν','ἐπιστολάς'],
   ['genitivo','ἐπιστολῆς','ἐπιστολῶν'],
   ['dativo','ἐπιστολῇ','ἐπιστολαῖς']
  ]},
 {id:'kephale',lemma:'κεφαλή',unit:7,gender:'femenino',
  url:'https://en.wiktionary.org/wiki/κεφαλή',grammar:FIRST_GRAMMAR,
  forms:[
   ['nominativo','κεφαλή','κεφαλαί'],
   ['vocativo','κεφαλή','κεφαλαί'],
   ['acusativo','κεφαλήν','κεφαλάς'],
   ['genitivo','κεφαλῆς','κεφαλῶν'],
   ['dativo','κεφαλῇ','κεφαλαῖς']
  ]},
 {id:'mache',lemma:'μάχη',unit:7,gender:'femenino',
  url:'https://en.wiktionary.org/wiki/μάχη',grammar:FIRST_GRAMMAR,
  forms:[
   ['nominativo','μάχη','μάχαι'],
   ['vocativo','μάχη','μάχαι'],
   ['acusativo','μάχην','μάχας'],
   ['genitivo','μάχης','μαχῶν'],
   ['dativo','μάχῃ','μάχαις']
  ]},
 {id:'petra',lemma:'πέτρα',unit:7,gender:'femenino',
  url:'https://en.wiktionary.org/wiki/πέτρα',grammar:FIRST_GRAMMAR,
  forms:[
   ['nominativo','πέτρα','πέτραι'],
   ['vocativo','πέτρα','πέτραι'],
   ['acusativo','πέτραν','πέτρας'],
   ['genitivo','πέτρας','πετρῶν'],
   ['dativo','πέτρᾳ','πέτραις']
  ]},
 {id:'ouranos',lemma:'οὐρανός',unit:9,gender:'masculino',
  url:'https://en.wiktionary.org/wiki/οὐρανός',grammar:SECOND_GRAMMAR,
  // El plural está morfológicamente justificado, pero el propio
  // repertorio señala que no es de uso clásico: registro posterior.
  historicalReservation:'Cinco casillas plurales gramaticales, sin testimonio de uso clásico en el repertorio cotejado; uso posterior.',
  forms:[
   ['nominativo','οὐρανός','οὐρανοί'],
   ['vocativo','οὐρανέ','οὐρανοί'],
   ['acusativo','οὐρανόν','οὐρανούς'],
   ['genitivo','οὐρανοῦ','οὐρανῶν'],
   ['dativo','οὐρανῷ','οὐρανοῖς']
  ]},
 {id:'hoplon',lemma:'ὅπλον',unit:10,gender:'neutro',
  url:'https://en.wiktionary.org/wiki/ὅπλον',grammar:SECOND_GRAMMAR,
  forms:[
   ['nominativo','ὅπλον','ὅπλα'],
   ['vocativo','ὅπλον','ὅπλα'],
   ['acusativo','ὅπλον','ὅπλα'],
   ['genitivo','ὅπλου','ὅπλων'],
   ['dativo','ὅπλῳ','ὅπλοις']
  ]},
 {id:'phobos',lemma:'φόβος',unit:10,gender:'masculino',
  url:'https://en.wiktionary.org/wiki/φόβος',grammar:SECOND_GRAMMAR,
  forms:[
   ['nominativo','φόβος','φόβοι'],
   ['vocativo','φόβε','φόβοι'],
   ['acusativo','φόβον','φόβους'],
   ['genitivo','φόβου','φόβων'],
   ['dativo','φόβῳ','φόβοις']
  ]}
];

export function verifyNineGreekNounRecords(records){
 assert.ok(Array.isArray(records),'El lote de sustantivos no es una lista');
 assert.equal(records.length,INDIVIDUAL_GREEK_NOUN_CHECKS.length,
  'La revisión solo cubre los nueve paradigmas autorizados');
 const checkedRecords=[];
 for(const target of INDIVIDUAL_GREEK_NOUN_CHECKS){
  const original=records.find(x=>x.id==='griego-sustantivo-'+target.id);
  assert.ok(original,'No consta el paradigma '+target.lemma);
  assert.equal(original.unit,target.unit,'Unidad curricular inesperada de '+target.lemma);
  assert.equal(original.gender,target.gender,'Género inesperado de '+target.lemma);
  assert.equal(original.kind,'sustantivo');
  assert.ok(original.paradigm.startsWith(target.lemma+','),'Enunciado inesperado');
  assert.equal(original.forms.length,10,'Casillas fuera del inventario: '+target.lemma);
  assert.equal(target.forms.length,5,'Cinco filas por nombre');
  const byKey=new Map(original.forms.map(f=>[f.case+':'+f.number,f]));
  assert.equal(byKey.size,10,'Duplicidad caso/número: '+target.lemma);
  let checked=0;
  const slots=[];
  for(const [i,row] of target.forms.entries()){
   assert.equal(row.length,3);
   assert.equal(row[0],CASE_ORDER[i],'Orden de casos del registro');
   for(const [j,number] of NUMBER_ORDER.entries()){
    const form=byKey.get(row[0]+':'+number);
    assert.ok(form,'Falta casilla '+target.lemma+' '+row[0]+' '+number);
    assert.equal(form.form.normalize('NFC'),row[j+1].normalize('NFC'),
     'Desacuerdo de acentos, espíritu o flexión: '+target.lemma+' '+row[0]+' '+number);
    assert.equal(form.analysis,row[0]+' '+number,'Análisis incoherente');
    slots.push({case:row[0],number,form:form.form,
     status:'paradigma-ático-contrastado',
     ...(target.historicalReservation&&number==='plural'?
      {usage:'no-acreditado-en-griego-clasico-por-esta-fuente'}:{})});
    checked++;
   }
  }
  assert.equal(checked,10);
  assert.equal(slots.length,10);
  assert.equal(original.evidence.status,'paradigma-documentado',
   'La verificación individual no debe sustituir otro estado desconocido');
  assert.equal(original.evidence.review,
   'conciliación interfuentes; pendiente de revisión docente individual',
   'La verificación no puede alterar la identidad del origen interfuentes');
  const record=structuredClone(original);
  record.evidence={
   ...original.evidence,
   review:'conciliación interfuentes; 10/10 formas contrastadas individualmente con tabla de declinación ática y gramática académica; no constituye prueba de atestación textual para cada forma',
   individualVerification:{
    status:'contrastado-individualmente',
    date:REVIEW_DATE,scope:'morfología ática escolar, sin dual ni artículos',
    source:target.url,grammar:target.grammar,
    sourceRelationship:'UniMorph syllabus y Wiktionary pueden compartir origen; el cotejo de la clase flexiva con Peek es independiente',
    checkedCount:10,slots,
    ...(target.historicalReservation?
     {historicalReservation:target.historicalReservation,
      practiceExclusion:{
       policy:'exclude-plural-from-new-exercises',
       reason:'Uso plural no acreditado para griego clásico; mantener formas y progreso histórico',
       slots:slots.filter(x=>x.number==='plural').map(x=>x.case+':'+x.number)
      }}:{})
   }
  };
  checkedRecords.push(record);
 }
 assert.equal(checkedRecords.reduce((sum,r)=>sum+r.evidence.individualVerification.checkedCount,0),90);
 assert.equal(new Set(checkedRecords.map(r=>r.id)).size,9);
 return checkedRecords;
}
