import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { families, rounds, latin1Units } from '../public/apps/modificacion-preverbial/banco.mjs';
import { studyFamilies, familyOrigins } from '../public/apps/modificacion-preverbial/study.mjs';

test('el estudio consulta todas las familias del mismo banco de práctica, en orden alfabético', () => {
  const keys = studyFamilies().map(([key]) => key);
  assert.deepEqual(keys, Object.keys(families).sort((a,b) => a.localeCompare(b,'la')));
  for (const [base, family] of studyFamilies()) {
    const origins = familyOrigins(base, family);
    assert.equal(origins[0].lemma, family.lemma ?? base);
    assert.equal(origins.length, family.compounds.length + 1);
    assert.equal(origins.flatMap(origin => origin.derivatives).length, family.derivatives.length);
    for (const origin of origins) {
      assert.ok(origin.derivatives.every(([lemma]) => lemma === origin.lemma));
    }
  }
});

test('busca bases, infinitivos, preverbios, glosas y derivados en ambas lenguas', () => {
  for (const [query, key] of [
    ['FERO','fero'], ['accipere','capio'], ['recepcion','capio'],
    ['recepció','capio'], ['atraure','traho'], ['arrastrar','traho'],
    ['subter','fugio'], ['perficio perfección','facio']
  ]) assert.ok(studyFamilies(query).some(([base]) => base === key), query);
  assert.deepEqual(studyFamilies('recepción','fero'), []);
  assert.deepEqual(studyFamilies('','mitto').map(([key])=>key), ['mitto']);
  assert.deepEqual(studyFamilies('zzzzzzzz'), []);
  assert.deepEqual(studyFamilies('','unknown'), []);
});

test('la navegación enlaza estudio y práctica y conserva Latín I', async () => {
  const load = name => readFile(new URL('../public/apps/modificacion-preverbial/'+name, import.meta.url),'utf8');
  const [practice, study, practiceJs, studyJs] = await Promise.all(['index.html','estudio.html','practica.mjs','estudio.mjs'].map(load));
  assert.match(practice,/href="\.\/estudio\.html" id="study-link"/);
  assert.match(study,/href="\.\/index\.html" id="practice-link"/);
  assert.ok(practiceJs.includes('./estudio.html?subject=lat1'));
  assert.ok(studyJs.includes('./index.html?subject=lat1'));
  assert.match(study,/aria-current="page">Estudiar/);
});

test('el estudio de Latín I respeta la programación acumulativa y no incorpora fligo sin ficha', () => {
  assert.equal(Object.keys(latin1Units).length, 27);
  assert.equal(Object.keys(families).length, 120);
  assert.equal(studyFamilies('', 'all', { latinI:true }).length, 27);
  for (const [unit, count] of [[2,4],[3,8],[4,12],[5,16],[6,20],[7,24],[8,24],[9,27],[10,27]]) {
    const entries = studyFamilies('', 'all', { latinI:true, unit });
    assert.equal(entries.length, count, 'UD'+unit);
    assert.ok(entries.every(([base])=>latin1Units[base]<=unit));
    assert.ok(rounds.some(round=>!round.source && round.prompts.every(({base})=>latin1Units[base] && latin1Units[base]<=unit)));
  }
  assert.deepEqual(studyFamilies('','fligo',{latinI:true}), []);
  assert.equal(studyFamilies('','traho',{latinI:true}).length, 0);
  assert.equal(studyFamilies('','traho').length, 1);
  for (const base of Object.keys(latin1Units)) {
    assert.ok(rounds.some(round=>!round.source && round.prompts.every(prompt=>latin1Units[prompt.base]) && round.prompts.some(prompt=>prompt.base===base)), base);
  }
});

test('cada familia añadida dispone de significado, compuestos y derivados sin duplicidades internas', () => {
  for (const [base, family] of Object.entries(families)) {
    assert.ok(family.entry && family.meaning, base);
    assert.ok(family.compounds.length >= (family.studyOnly ? 1 : 2), base);
    assert.equal(new Set(family.compounds.map(([lemma])=>lemma)).size, family.compounds.length);
    if (!family.studyOnly) assert.ok(family.derivatives.length >= 2, base);
    assert.ok(family.compounds.every(row=>row.length===4 && row.every(Boolean)), base);
  }
});

test('Latín II ofrece las nueve familias nuevas sin adelantar contenidos de Latín I', () => {
  for (const base of ['ago','caedo','cedo','claudo','lego','scribo','sum','teneo','venio']) {
    assert.equal(studyFamilies('',base).length,1);
    assert.equal(studyFamilies('',base,{latinI:true}).length,0);
    assert.ok(rounds.some(round=>round.prompts.some(prompt=>prompt.base===base)),base);
  }
  assert.equal(studyFamilies('occidere').filter(([key])=>['caedo','cado'].includes(key)).length,2);
  assert.equal(rounds.length,97);
});

test('el segundo bloque de Latín II tiene cobertura de estudio y práctica y no se adelanta a Latín I', () => {
  for (const base of ['moveo','pello','rapio','rego','rumpo','sto','struo','solvo','premo','quaero','iungo','fundo','frango']) {
    assert.equal(studyFamilies('',base).length,1);
    assert.equal(studyFamilies('',base,{latinI:true}).length,0);
    assert.ok(rounds.some(round=>round.prompts.some(prompt=>prompt.base===base)),base);
  }
  assert.ok(studyFamilies('compresion').some(([base])=>base==='premo'));
  assert.ok(studyFamilies('transfundere').some(([base])=>base==='fundo'));
});

test('los homógrafos tienen fichas y significados independientes y no se sortean sin contexto', () => {
  for (const lemma of ['sero','volo']) {
    const matches=studyFamilies(lemma).filter(([,f])=>f.lemma===lemma);
    assert.equal(matches.length,2);
    assert.notEqual(matches[0][1].entry,matches[1][1].entry);
    for (const [id,family] of matches) {
      assert.equal(family.studyOnly,true);
      assert.equal(familyOrigins(id,family)[0].lemma,lemma);
      assert.ok(!rounds.some(round=>round.prompts.some(prompt=>prompt.base===id)));
    }
  }
  assert.equal(familyOrigins('volo-querer',families['volo-querer'])[1].compositionLabel,'Componente');
});

test('el tercer bloque de Latín II respeta las unidades de Latín I y permite practicar los veinte verbos', () => {
  for (const base of ['emo','haereo','maneo','misceo','moneo','muto','nosco','oro','paro','puto','rogo','scio','seco','sisto','sumo','tango','tego','vivo','voco','volvo']) {
    assert.equal(studyFamilies('',base).length,1);
    assert.equal(studyFamilies('',base,{latinI:true}).length,0);
    assert.ok(rounds.some(round=>round.prompts.some(prompt=>prompt.base===base)),base);
  }
  for (const base of ['tango','vivo']) assert.equal(families[base].compounds.length,2);
  assert.ok(studyFamilies('redención').some(([base])=>base==='emo'));
  assert.ok(studyFamilies('conjunción').some(([base])=>base==='iungo'));
  assert.ok(studyFamilies('revolución').some(([base])=>base==='volvo'));
});

test('las 120 familias corresponden exactamente al inventario docente fijado, incluidos homógrafos', () => {
  const expected = ["ago","arceo","cado","caedo","cano","capio","carpo","cedo","cerno","cieo","clamo","claudo","colo","creo","cubo","curo","curro","dico","disco","do","doceo","duco","emo","eo","facio","fero","figo","fingo","flecto","for","frango","fugio","fundo","gero","gigno","gradior","habeo","haereo","iacio","iungo","labor","lego","levo","ligo","maneo","misceo","mitto","moneo","moror","moveo","muto","nosco","nuntio","orior","oro","paro","pello","pendo","peto","plecto","pleo","pono","porto","precor","prehendo","premo","pugno","puto","quaero","quatio","rapio","rego","rogo","rumpo","salio","sapio","scando","scio","scribo","seco","sedeo","sentio","sequor","sero-entrelazar","sero-sembrar","sino","sisto","solvo","specio","spiro","statuo","sterno","sto","stringo","struo","sum","sumo","tango","tego","tendo","teneo","tollo","torqueo","traho","tueor","tundo","turbo","vado","vagor","vasto","veho","vello","venio","verto","video","vivo","voco","volo-querer","volo-volar","volvo"];
  assert.deepEqual(Object.keys(families).sort(),expected);
  const consulted = Object.entries(families).filter(([,family])=>family.studyOnly);
  assert.equal(consulted.length,24);
  for (const [key,family] of Object.entries(families)) {
    assert.equal(rounds.some(round=>round.prompts.some(prompt=>prompt.base===key)),!family.studyOnly,key);
  }
  assert.equal(families.sino.compounds.length,1);
  assert.equal(studyFamilies('desinencia')[0][0],'sino');
  assert.ok(studyFamilies('praefigere').some(([key])=>key==='figo'));
  assert.ok(studyFamilies('constitución').some(([key])=>key==='statuo'));
});
