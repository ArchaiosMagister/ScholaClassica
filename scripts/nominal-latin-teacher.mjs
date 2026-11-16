// Sustantivos latinos importados por decisión docente expresa: no importar
// tablas masivas ni alterar Vocabula, UniMorph ni entradas históricas.
import assert from 'node:assert/strict';
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const NUMBERS=['singular','plural'];
const noQuantity=s=>String(s).normalize('NFD')
 .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
export function checkLexeme({vocabulaData,id,lemma,form,unit,mode='general'}){
 const m=vocabulaData.match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/u);
 assert.ok(m,'No se reconoce Vocabula original');
 const entries=JSON.parse(m[1]);
 assert.equal(entries.length,2055);
 const all=entries.filter(x=>x.id===id);
 assert.equal(all.length,1,'Identidad original duplicada o ausente');
 const entry=all[0];
 assert.equal(entry.subject,'lat1');
 assert.equal(entry.mode,mode);
 assert.equal(entry.form,form);
 assert.ok(entry.units.includes(unit),'No se corresponde con unidad acreditada');
 assert.ok(entry.form.startsWith(lemma+','));
 return entry;
}
export function latinNounRecord({lemma,genitive,unit,declension,forms,
 gender,source,id,entry,vocabulaSha,decision,notes,restrictedVariants}){
 assert.match(vocabulaSha,/^[a-f0-9]{40}$/u);
 const cells=CASES.flatMap(cas=>NUMBERS.map(number=>{
  const word=forms[cas]?.[number];
  assert.equal(typeof word,'string','Falta casilla '+cas+' '+number);
  return {form:noQuantity(word),analysis:cas+' '+number,case:cas,number};
 }));
 assert.equal(cells.length,12);
 assert.equal(new Set(cells.map(f=>f.analysis)).size,12);
 return {
  id:'latin-sustantivo-decision-'+id,
  language:'latin',unit,kind:'sustantivo',gender,
  paradigm:lemma+', '+genitive+' · '+declension,
  forms:cells,evidence:{
   status:'paradigma-documentado',source:'Cotejo escolar individual de DCC y decisión docente',
   file:'cotejo-lexicografico-individual',
   unit,topic:declension,caption:'Paradigma documentado '+lemma,
   vocabulaSha,vocabulaEntry:entry.id,vocabulaGroup:entry.units.join(', '),
   decisionId:'latin-'+id,teacherDecision:decision,
   references:[source],review:'conciliación interfuentes; doce casillas documentadas',
   notes,
   ...(restrictedVariants?{restrictedVariants}:{})
  }
 };
}
export function compileCantus({vocabulaData,vocabulaSha,decisions}){
 assert.equal(decisions?.status,'aprobado-por-docente');
 assert.equal(decisions.choices?.cantus,'cuarta-sin-mezcla');
 const entry=checkLexeme({vocabulaData,id:'d20502b9069bd664',
  lemma:'cantus',form:'cantus, –us',unit:'UD 7'});
 const forms={
  nominativo:{singular:'cantus',plural:'cantūs'},
  vocativo:{singular:'cantus',plural:'cantūs'},
  acusativo:{singular:'cantum',plural:'cantūs'},
  genitivo:{singular:'cantūs',plural:'cantuum'},
  dativo:{singular:'cantuī',plural:'cantibus'},
  ablativo:{singular:'cantū',plural:'cantibus'}
 };
 const record=latinNounRecord({lemma:'cantus',genitive:'cantūs',
  unit:7,declension:'4.ª declinación',forms,gender:'masculino',
  source:'https://dcc.dickinson.edu/grammar/latin/4th-declension-nouns',
  id:'cantus',entry,vocabulaSha,decision:'cuarta-sin-mezcla',
  notes:'Solo tema en -u de cuarta declinación; excluir posibles formas de segunda declinación.'});
 assert.equal(record.forms.find(f=>f.analysis==='genitivo singular').form,'cantus');
 assert.ok(!record.forms.some(f=>['canti','cantorum','cantis','cantos','cante'].includes(f.form)));
 return record;
}

export function compileLiber({vocabulaData,vocabulaSha,decisions}){
 assert.equal(decisions?.status,'aprobado-por-docente');
 assert.equal(decisions.choices?.liber,'guardar-ambos');
 const entry=checkLexeme({vocabulaData,id:'f2f776558dba45b1',
   lemma:'liber',form:'liber, –bri',unit:'UD 1'});
 const forms={
  nominativo:{singular:'liber',plural:'librī'},
  vocativo:{singular:'liber',plural:'librī'},
  acusativo:{singular:'librum',plural:'librōs'},
  genitivo:{singular:'librī',plural:'librōrum'},
  dativo:{singular:'librō',plural:'librīs'},
  ablativo:{singular:'librō',plural:'librīs'}
 };
 const record=latinNounRecord({lemma:'liber',genitive:'librī',
  unit:1,declension:'2.ª declinación (pérdida de -e-)',forms,gender:'masculino',
  source:'https://dcc.dickinson.edu/latin-core-list1',
  id:'liber',entry,vocabulaSha,decision:'guardar-ambos',
  notes:'Sustantivo masculino libro, distinto del adjetivo līber, lībera, līberum (libre).'});
 assert.ok(!record.forms.some(f=>['libera','liberum','liberam'].includes(f.form)));
 return record;
}
