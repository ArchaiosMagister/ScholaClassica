// Latín II: dos paradigmas nominales explícitos del cuaderno, p. 70.
// Solo se incorporan las casillas de cinco casos realmente documentadas:
// los pronombres carecen de vocativo y unus es aquí numeral singular.
// Rectifica la errata "alterae" en acusativo femenino plural -> alteras.
import assert from 'node:assert/strict';
const CASES=['nominativo','acusativo','genitivo','dativo','ablativo'];
const GENDERS=['masculino','femenino','neutro'];
const ALTER={
  singular:[
    ['alter','altera','alterum'],
    ['alterum','alteram','alterum'],
    ['alterius','alterius','alterius'],
    ['alteri','alteri','alteri'],
    ['altero','altera','altero']
  ],
  plural:[
    ['alteri','alterae','altera'],
    ['alteros','alteras','altera'],
    ['alterorum','alterarum','alterorum'],
    ['alteris','alteris','alteris'],
    ['alteris','alteris','alteris']
  ]
};
const UNUS=[
  ['unus','una','unum'],
  ['unum','unam','unum'],
  ['unius','unius','unius'],
  ['uni','uni','uni'],
  ['uno','una','uno']
];
function fromTable(kind,id,headword,type,degree,byNumber){
  const forms=[];
  for(const [number,grid] of Object.entries(byNumber)){
    assert.equal(grid.length,5);
    for(const [i,cas] of CASES.entries()){
      assert.equal(grid[i].length,3);
      for(const [j,gender] of GENDERS.entries()){
        const form=grid[i][j];
        const analysis=kind==='pronombre'?
          'pronombre · '+type+' · '+headword+' · '+cas+' · '+gender+' · '+number:
          'adjetivo · grado '+degree+' · '+headword+' · '+cas+' · '+
            gender+' · '+number+' · tipo '+type;
        forms.push({form,case:cas,gender,number,analysis});
      }
    }
  }
  return {id:'latin2-cuaderno-nominal-'+id,language:'latin2',unit:0,
    kind,headword,paradigm:headword,forms,
    evidence:{source:'Cuaderno de Latín II, p. 70, cotejado con Allen y Greenough §113',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      status:'paradigma-documentado',topic:'Paradigmas pronominales y numerales',
      caption:headword,unit:0,
      verification:'casillas explícitas cotejadas por género, número y caso',
      notes:id==='alter'?
        'El acusativo femenino plural correcto es alteras, no alterae como figura por errata en el cuaderno.':
        'Se incluye el singular propio del numeral unus; los usos plurales restringidos requieren tratamiento aparte.'}};
}
export function compileCuadernoNominalReference(existing=[]){
  const records=[
    fromTable('pronombre','alter','alter, altera, alterum',
      'indefinido (entre dos)',null,ALTER),
    fromTable('adjetivo','unus','unus, una, unum',
      'numeral cardinal','no aplicable (numeral)',{singular:UNUS})
  ];
  // Las 5 filas por género son 30 y 15 casillas respectivamente.
  assert.deepEqual(records.map(r=>r.forms.length),[30,15]);
  assert.ok(records[0].forms.some(f=>f.form==='alteras'&&
    f.case==='acusativo'&&f.gender==='femenino'&&f.number==='plural'));
  assert.ok(!records[0].forms.some(f=>f.form==='alterae'&&f.case==='acusativo'));
  const ids=new Set(existing.map(r=>r.id));
  return records.filter(r=>!ids.has(r.id));
}
