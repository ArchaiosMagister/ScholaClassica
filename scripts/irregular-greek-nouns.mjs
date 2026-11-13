// Cuatro paradigmas irregulares de Griego I, cotejados forma a forma en
// fuentes externas explícitas (no reconstruidos mediante desinencias).
// Verificación de la lematización y genitivo con Vocabula fijado por SHA.
import assert from 'node:assert/strict';
const N=['singular','plural'];
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo'];
const normalize=s=>String(s||'').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u0342]/gu,'').replace(/ς/g,'σ').normalize('NFC');
const noQuantity=s=>String(s).normalize('NFD')
  .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const greekSpec=[
  {lemma:'ἀνήρ',genitive:'ἀνδρός',gender:'masculino',
    forms:[['ἀνήρ','ἄνδρες'],['ἄνερ','ἄνδρες'],
      ['ἄνδρα','ἄνδρας'],['ἀνδρός','ἀνδρῶν'],
      ['ἀνδρί',['ἀνδράσι','ἀνδράσιν']]],
    reference:'https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddel-scott/search.html?exact=true&lq=%E1%BC%80%CE%BD%CE%AE%CF%81&strict=true'},
  {lemma:'γυνή',genitive:'γυναικός',gender:'femenino',
    forms:[['γυνή','γυναῖκες'],['γύναι','γυναῖκες'],
      ['γυναῖκα','γυναῖκας'],['γυναικός','γυναικῶν'],
      ['γυναικί',['γυναιξί','γυναιξίν']]],
    reference:'https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%CE%B3%CF%85%CE%BD%CE%AE'},
  {lemma:'πατήρ',genitive:'πατρός',gender:'masculino',
    forms:[['πατήρ','πατέρες'],['πάτερ','πατέρες'],
      ['πατέρα','πατέρας'],['πατρός','πατέρων'],
      ['πατρί',['πατράσι','πατράσιν']]],
    reference:'https://el.wiktionary.org/wiki/%CF%80%CE%B1%CF%84%CE%AE%CF%81'},
  {lemma:'μήτηρ',genitive:'μητρός',gender:'femenino',
    forms:[['μήτηρ','μητέρες'],['μῆτερ','μητέρες'],
      ['μητέρα','μητέρας'],['μητρός','μητέρων'],
      ['μητρί',['μητράσι','μητράσιν']]],
    reference:'https://el.wiktionary.org/wiki/%CE%BC%CE%AE%CF%84%CE%B7%CF%81'}
];
const systematic='https://dwanethomas.com/wp-content/uploads/2018/08/Greek-Grammar-Machen.pdf';
export function compileGreekIrregularNouns({curriculum,vocabulaData,vocabulaSha,existingRecords=[]}){
  assert.match(vocabulaSha,/^[0-9a-f]{40}$/);
  const m=String(vocabulaData).match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
  assert.ok(m,'Sin vocabulario original');
  const lex=JSON.parse(m[1]);
  const topic=curriculum.griego?.units?.find(x=>x.number===8)?.topics
    ?.find(x=>x.title==='Tercera declinación: consonantes');
  assert.ok(topic?.html?.includes('Tercera declinación · tabla 109'));
  const already=new Set(existingRecords.filter(r=>r.language==='griego'&&
    r.kind==='sustantivo').map(r=>normalize(r.paradigm.split(',')[0])));
  const records=[];
  for(const spec of greekSpec){
    if(already.has(normalize(spec.lemma)))continue;
    const entry=lex.find(r=>r.subject==='gr1'&&r.units?.includes('UD 8')&&
      normalize(r.form.split(',')[0])===normalize(spec.lemma));
    assert.ok(entry,'No figura en el vocabulario de Griego I UD8: '+spec.lemma);
    const declared=entry.form.split(',').slice(1).join(',').replace(/\([^)]*\)/gu,'').trim();
    const bare=declared.replace(/^[–−-]\s*/u,'');
    assert.ok(normalize(spec.genitive).endsWith(normalize(bare))||
      normalize(spec.genitive)===normalize(bare),
      'Genitivo académico diferente al vocabulario de '+spec.lemma);
    const declaredArticle=entry.form.match(/\((ὁ|ἡ|τὸ|τό)\)/u)?.[1];
    assert.ok(declaredArticle,'No hay género docente explícito: '+spec.lemma);
    const expectedGender=declaredArticle==='ὁ'?'masculino':
      declaredArticle==='ἡ'?'femenino':'neutro';
    assert.equal(spec.gender,expectedGender,'Género no concordante');
    const forms=[];
    for(let i=0;i<CASES.length;i++){
      assert.equal(spec.forms[i].length,2);
      for(let j=0;j<N.length;j++){
        const values=Array.isArray(spec.forms[i][j])?spec.forms[i][j]:
          [spec.forms[i][j]];
        assert.ok(values.length>=1&&values.length<=2);
        for(const form of values){
          assert.ok(form&&!/[()\[\]\/]/u.test(form));
          forms.push({form:noQuantity(form),
            analysis:CASES[i]+' '+N[j],case:CASES[i],number:N[j]});
        }
      }
    }
    assert.equal(new Set(forms.map(f=>f.case+':'+f.number)).size,10);
    assert.ok(forms.some(f=>f.case==='genitivo'&&f.number==='singular'&&
      normalize(f.form)===normalize(spec.genitive)));
    records.push({id:'griego-sustantivo-irregular-'+entry.id,
      language:'griego',unit:8,kind:'sustantivo',gender:spec.gender,
      paradigm:spec.lemma+', '+spec.genitive+
        (spec.gender==='masculino'?' (ὁ)':' (ἡ)')+
        ' · 3.ª declinación irregular',
      forms,evidence:{
        source:'Paradigma singular/plural contrastado con gramática y léxico griegos',
        file:'fuentes-lexicograficas-exteriores',
        unit:8,topic:'Tercera declinación: consonantes',
        caption:'Excepción irregular: '+spec.lemma,
        status:'paradigma-documentado',vocabulaSha,
        vocabulaEntry:entry.id,vocabulaGroup:'UD 8',
        genderEvidence:'artículo-de-vocabulario-docente',
        review:'conciliación interfuentes; pendiente de revisión docente individual',
        references:[systematic,spec.reference],
        notes:'Diez casillas cotejadas individualmente con fuentes externas. '+
          'Variantes de ν eufónica solo donde el paradigma fuente lo admite.'
      }});
  }
  return records;
}
