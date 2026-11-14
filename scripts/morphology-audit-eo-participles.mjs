// Paradigmas participiales de eo: iens / euntis y iturus, -a, -um.
// No se inventa un participio perfecto personal *itus*: la pasiva de eo
// solo admite el uso impersonal (itur, itum est), cf. A&G §203.
import assert from 'node:assert/strict';
const GENDERS=['masculino','femenino','neutro'];
const CASES=['nominativo','vocativo','acusativo','genitivo','dativo','ablativo'];
const NUMBERS=['singular','plural'];
const HEAD='eo, ire, ii (ivi), itum (irregular)';
function present(gender,number){
  const n=gender==='neutro';
  return number==='singular'?
    ['iens','iens',n?'iens':'euntem','euntis','eunti','eunte']:
    [n?'euntia':'euntes',n?'euntia':'euntes',
      n?'euntia':'euntes','euntium','euntibus','euntibus'];
}
function future(gender,number){
  const suffix=number==='singular'?
    {masculino:['us','e','um','i','o','o'],
      femenino:['a','a','am','ae','ae','a'],
      neutro:['um','um','um','i','o','o']}[gender]:
    {masculino:['i','i','os','orum','is','is'],
      femenino:['ae','ae','as','arum','is','is'],
      neutro:['a','a','a','orum','is','is']}[gender];
  return suffix.map(x=>'itur'+x);
}
export function compileEoParticiples(){
  const forms=[];
  for(const [tense,voice,method] of [
    ['presente','activa',present],['futuro','activa',future]
  ]){
    for(const gender of GENDERS)for(const number of NUMBERS){
      const cells=method(gender,number);
      assert.equal(cells.length,6);
      for(const [i,cas] of CASES.entries()){
        forms.push({form:cells[i],case:cas,gender,number,tense,voice,
          analysis:'participio · '+HEAD+' · '+tense+' · voz '+voice+
            ' · '+cas+' · '+gender+' · '+number});
      }
    }
  }
  assert.equal(forms.length,72);
  assert.ok(forms.some(f=>f.form==='iens'&&f.case==='nominativo'));
  assert.ok(forms.some(f=>f.form==='euntium'&&f.case==='genitivo'));
  assert.ok(forms.some(f=>f.form==='ituras'&&f.case==='acusativo'));
  assert.ok(!forms.some(f=>/^itus$|^ita$|^itum$/.test(f.form)));
  return {id:'latin2-audit-irregular-participle-eo',language:'latin2',unit:0,
    kind:'participio',headword:HEAD,paradigm:HEAD,forms,
    evidence:{source:'Allen y Greenough §203: participios de eo; cuaderno Latín II pp. 77–78',
      file:'shared/academic/latin2/cuaderno-2026-27-morfologia.tsv',
      unit:0,status:'paradigma-documentado',topic:'Participios irregulares de eo',
      caption:'iens, euntis; iturus, -a, -um',
      verification:'flexión escolar de temas explícitos, pendiente de cotejo individual de cada casilla',
      notes:'Sin participio perfecto personal. itum est se analiza como pasiva impersonal verbal.'}};
}
