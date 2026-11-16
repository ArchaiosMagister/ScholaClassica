import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {entryKey,mergeCatalog,matchCatalog} from '../public/docente/vocabula-catalog.mjs';

const root=resolve(import.meta.dirname,'..');
const original=JSON.parse(readFileSync(join(root,'dist/docente/vocabula-catalog.json'),'utf8')).words;
const fixture=(id,mode,form,meaning,answers,units=['UD 5'])=>({
  id,subject:'lat1',mode,form,meaning,answers,units
});

test('Enunciado y significado idénticos no destruyen IDs ni fuentes General/Examen',()=>{
  assert.equal(original.length,2055);
  const ids=new Set(original.map(row=>row.id));
  assert.equal(ids.size,2055);
  const groups=mergeCatalog(original,[]);
  assert.equal(groups.reduce((sum,group)=>sum+group.sources.length,0),2055);
  assert.deepEqual(new Set(groups.flatMap(group=>group.sources.map(x=>x.id))),ids);
  for(const group of groups){
    const records=original.filter(e=>entryKey(e)===entryKey(group));
    assert.deepEqual(group.sources.map(x=>x.id),records.map(x=>x.id));
    for(let i=0;i<records.length;i++){
      assert.deepEqual(group.sources[i].units,records[i].units);
      assert.deepEqual(group.sources[i].answers,records[i].answers);
      assert.equal(group.sources[i].mode,records[i].mode);
      assert.equal(group.sources[i].meaning,records[i].meaning);
    }
  }
});
test('Todas las glosas y respuestas originales están indexadas, incluidas sus fuentes',()=>{
  const cases=[
    fixture('g','general','silva, –æ','‘selva’',['selva','soto'],['UD 3']),
    fixture('e','examen','silva, –æ','‘bosque’',['bosque'],['UD 6']),
    fixture('single','general','rus, ruris (n.)','‘campo’',['campo'],['UD 5'])
  ];
  const before=JSON.stringify(cases),catalog=mergeCatalog(cases,[]);
  const silva=catalog.find(row=>row.form==='silva, –æ');
  assert.equal(silva.semanticConflict,true);
  assert.deepEqual(silva.sources.map(x=>x.id),['g','e']);
  for(const search of ['selva','soto','bosque','UD 3','UD 6','g','e']){
    assert.ok(matchCatalog(catalog,{subject:'lat1',search}).rows.some(x=>x.form==='silva, –æ'),
      'Búsqueda de procedencias y respuestas: '+search);
  }
  assert.equal(matchCatalog(catalog,{search:'soto',subject:'gr1'}).total,0);
  assert.equal(matchCatalog(catalog,{search:'campo'}).total,1);
  assert.equal(JSON.stringify(cases),before);
});
test('Sobreescritura: recuperar originales en la búsqueda aun con aportación activa',()=>{
  const cases=[
    fixture('silva-general','general','silva, –æ','‘selva’',['arboleda'],['UD 3']),
    fixture('silva-examen','examen','silva, –æ','‘bosque’',['bosque'],['UD 6'])
  ];
  const custom={id:'teacher-1',subject:'lat1',form:'silva, –æ',
    meaning:'silva revisada',answers:['selva modificada'],units:['UD 5'],
    in_exam:true,active:true};
  const originalSnapshot=JSON.stringify(cases);
  const active=mergeCatalog(cases,[custom]);
  assert.equal(active.length,1);
  assert.equal(active[0].origin,'docente');
  assert.equal(active[0].originalSemanticConflict,true);
  assert.deepEqual(active[0].originalSources.map(s=>s.id),['silva-general','silva-examen']);
  for(const term of ['arboleda','bosque','silva-general','silva-examen','selva modificada']){
    assert.equal(matchCatalog(active,{search:term}).total,1,
      'El original y la sustitución deben seguir encontrándose: '+term);
  }
  const inactive=mergeCatalog(cases,[{...custom,active:false}]);
  assert.equal(inactive.length,2,'La retirada debe mostrar original + aportación retirada');
  assert.equal(inactive.find(x=>x.origin==='original').sources.length,2);
  assert.equal(inactive.find(x=>x.origin==='docente').active,false);
  assert.equal(JSON.stringify(cases),originalSnapshot);
});
test('La interfaz muestra una subficha por cada ID y mantiene bloqueada la edición global ambigua',()=>{
  const script=readFileSync(join(root,'public/docente/admin-vocabula.mjs'),'utf8');
  const css=readFileSync(join(root,'public/docente/style.css'),'utf8');
  assert.match(script,/for\(const source of word\.sources\)/);
  assert.match(script,/for\(const source of word\.originalSources\)/);
  assert.match(script,/\s*' · ID '\+source\.id/);
  assert.match(script,/if\(word\?\.origin==='original'&&word\.semanticConflict\)/);
  assert.match(script,/if\(signatures\.size>1&&!sameOverride\)/);
  assert.match(script,/if\(conflictingCustom\)/);
  assert.match(script,/if\(body\.active&&historical\.length>1&&/);
  assert.match(script,/window\.confirm/);
  assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage/);
  assert.match(css,/#vocab-admin \.admin-word-variant/);
  assert.match(css,/\[data-theme="dark"\],\[data-theme="oled"\]/);
});
