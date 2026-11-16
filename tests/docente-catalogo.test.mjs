import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {entryKey,mergeCatalog,matchCatalog,matchingOriginals}
  from '../public/docente/vocabula-catalog.mjs';

const entry=(id,mode,form,meaning,answers,units=['UD 6'],subject='lat1')=>({
  id,subject,mode,form,meaning,answers,units
});
test('Glosas distintas no se fusionan, ni siquiera cuando coinciden la forma o las unidades',()=>{
  const data=[
    entry('silva-g','general','silva, –æ','‘selva’',['selva','bosque'],['UD 3','UD 6']),
    entry('silva-e','examen','silva, –æ','‘bosque’',['bosque'],['UD 6']),
    entry('gens-1','general','gens, gentis (f.)','‘pueblo’',['pueblo'],['UD 4']),
    entry('gens-2','general','gens, gentis (f.)','‘pueblo’, ‘gente’',['pueblo','gente'],['UD 6']),
    entry('akouo-g','general','ἀκούω','‘escuchar’',['escuchar'],['UD 1–4'],'gr1'),
    entry('akouo-e','examen','ἀκούω','‘escuchar’ (+ gen. CRV)',['escuchar'],['UD 1–4'],'gr1')
  ];
  const snapshot=JSON.stringify(data);
  const catalog=mergeCatalog(data,[]);
  assert.equal(catalog.length,3);
  const silva=catalog.find(group=>group.form==='silva, –æ');
  assert.deepEqual(silva.originals.map(item=>item.id),['silva-g','silva-e']);
  assert.deepEqual(silva.originals.map(item=>item.mode),['general','examen']);
  assert.deepEqual(silva.originals.map(item=>item.meaning),['‘selva’','‘bosque’']);
  assert.deepEqual(silva.originals.map(item=>item.answers),[['selva','bosque'],['bosque']]);
  assert.deepEqual(silva.originals.map(item=>item.units),[['UD 3','UD 6'],['UD 6']]);
  assert.equal(catalog.find(group=>group.form==='gens, gentis (f.)').originals.length,2);
  assert.equal(catalog.find(group=>group.subject==='gr1').originals[1].meaning,
    '‘escuchar’ (+ gen. CRV)');
  assert.equal(JSON.stringify(data),snapshot,'La agrupación no modifica el banco fuente');
  assert.equal(matchCatalog(catalog,{search:'bosque'}).total,1);
  assert.equal(matchCatalog(catalog,{search:'gen. CRV'}).total,1);
  assert.equal(matchCatalog(catalog,{search:'pueblo',subject:'gr1'}).total,0);
  assert.equal(matchCatalog(catalog,{pageSize:1}).more,true);
});

test('Una versión docente conserva todas las fichas originales visibles y su retirada es reversible',()=>{
  const entries=[
    entry('general-1','general','silva, –æ','‘selva’',['selva']),
    entry('examen-1','examen','silva, –æ','‘bosque’',['bosque'])
  ];
  const custom={id:'uuid-1',subject:'lat1',form:'silva, –æ',meaning:'‘arboleda’',
    answers:['arboleda'],units:['UD 7'],in_exam:true,active:true};
  const before=JSON.stringify(entries);
  for(const active of [true,false]){
    const catalog=mergeCatalog(entries,[{...custom,active}]);
    assert.equal(catalog.length,1);
    assert.equal(catalog[0].originals.length,2);
    assert.equal(catalog[0].docentes.length,1);
    assert.deepEqual(catalog[0].originals.map(x=>x.meaning),['‘selva’','‘bosque’']);
    assert.equal(catalog[0].docentes[0].active,active);
    assert.equal(catalog[0].docentes[0].origin,'docente');
    assert.equal(catalog[0].docentes[0].id,'uuid-1');
    assert.deepEqual(matchingOriginals(catalog,custom).map(x=>x.id),['general-1','examen-1']);
    assert.equal(matchCatalog(catalog,{search:'arboleda'}).total,1);
  }
  assert.equal(JSON.stringify(entries),before);
  assert.equal(entryKey(entries[0]),'lat1|silva, –æ');
});

test('Banco integrado: los 2055 IDs y los nueve grupos de glosas discrepantes siguen separados',()=>{
  const root=resolve(import.meta.dirname,'..');
  const data=JSON.parse(readFileSync(join(root,'dist/docente/vocabula-catalog.json'),'utf8'));
  assert.equal(data.schema,1);
  assert.equal(data.words.length,2055);
  const unique=new Set(data.words.map(item=>item.id));
  assert.equal(unique.size,2055);
  const merged=mergeCatalog(data.words,[]);
  assert.equal(merged.reduce((n,group)=>n+group.originals.length,0),2055);
  const nine=[
    ['lat1','appropinquo, appropinquavi, appropinquatum (1ª)'],
    ['lat1','silva, –æ'],
    ['lat1','gens, gentis (f.)'],
    ['gr1','ἀκούω'],
    ['gr1','ἀρχή, –ῆς'],
    ['gr1','ἄρχω'],
    ['gr1','βασιλεύω'],
    ['gr1','λαμβάνω'],
    ['gr1','οἰκέω']
  ];
  const differingAnswers=[
    ['lat1','bonus, –a, –um'],
    ['lat1','capio, cepi, captum (mx.)'],
    ['lat1','multus, –a, –um'],
    ['lat1','venio, veni, ventum (4ª)'],
    ['lat1','video, vidi, visum (2ª)'],
    ['lat1','silva, –æ'],
    ['lat1','gens, gentis (f.)'],
    ['lat1','vetus, veteris'],
    ['lat1','impetus, –us'],
    ['lat4','dūco (3ª)'],
    ['lat4','īmpĕrātŏr, –oris (m.)'],
    ['gr1','οἰκέω']
  ];
  for(const [subject,form] of differingAnswers){
    const group=merged.find(row=>row.key===entryKey({subject,form}));
    assert.ok(group,form);
    assert.ok(new Set(group.originals.map(item=>JSON.stringify(item.answers))).size>=2,
      'No fusionar las respuestas General/Examen o entre UDs de '+form);
  }
  for(const [subject,form] of nine){
    const group=merged.find(row=>row.key===entryKey({subject,form}));
    assert.ok(group,form);
    assert.ok(group.originals.length>=2,form+' debe mantener las fuentes');
    assert.ok(new Set(group.originals.map(item=>item.meaning)).size>=2,
      form+' debe mostrar cada glosa, incluso regencias');
    for(const item of group.originals){
      const fromBank=data.words.find(source=>source.id===item.id);
      assert.ok(fromBank);
      for(const field of ['mode','form','meaning','answers','units'])
        assert.deepEqual(item[field],fromBank[field],item.id+' perdió '+field);
    }
  }
  for(const group of merged)
    for(const original of group.originals)
      assert.equal(entryKey(original),group.key);
});
