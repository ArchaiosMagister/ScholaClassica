// Paradigma de παῖς verificado desde las diez filas singulares/plurales
// del corpus UniMorph inmovilizado con Vocabula. NO se infieren formas.
import assert from 'node:assert/strict';
const CASES=[['nominativo','NOM'],['vocativo','VOC'],['acusativo','ACC'],
 ['genitivo','GEN'],['dativo','DAT']];
const NUMBERS=[['singular','SG'],['plural','PL']];
const noQuantity=s=>String(s).normalize('NFD')
 .replace(/[\u0304\u0306]/gu,'').normalize('NFC');
const casKey=s=>String(s).normalize('NFD')
 .replace(/[\u0300\u0301\u0304\u0306\u0308\u0313\u0314\u0342]/gu,'')
 .replace(/ς/gu,'σ').normalize('NFC');
export function compilePais({vocabulaData,unimorphParts,vocabulaSha,decisions}){
 assert.equal(decisions?.choices?.pais,'ambos-generos');
 assert.equal(decisions.status,'aprobado-por-docente');
 assert.match(vocabulaSha,/^[a-f0-9]{40}$/u);
 assert.equal(unimorphParts.length,8);
 const text=vocabulaData.match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/u);
 assert.ok(text,'Formato fuente Vocabula no reconocido');
 const vocab=JSON.parse(text[1]);
 assert.equal(vocab.length,2055,'Banco original Vocabula ha cambiado');
 const matches=vocab.filter(x=>x.subject==='gr1'&&x.mode==='examen'&&
  x.units.length===1&&x.units[0]==='UD 8'&&
  x.form.startsWith('παῖς, '));
 assert.equal(matches.length,1,'Registro curricular paῖs ambiguo');
 const entry=matches[0];
 assert.equal(entry.id,'2132b8254922c90c');
 assert.match(entry.form,/ὁ o ἡ/u,'Ambos géneros deben constar en la fuente');
 const rows=unimorphParts.flat().filter(x=>Array.isArray(x)&&
   casKey(x[0])===casKey('παῖς')&&/^N;(NOM|VOC|ACC|GEN|DAT);(SG|PL)$/u.test(x[2]));
 assert.equal(rows.length,10,'UniMorph paῖs: faltan o sobran casillas');
 const slots=new Map();
 for(const row of rows){
  assert.ok(!slots.has(row[2]),'Casilla duplicada de paῖs '+row[2]);
  slots.set(row[2],row);
 }
 assert.equal(casKey(slots.get('N;NOM;SG')[1]),casKey('παῖς'));
 assert.equal(casKey(slots.get('N;GEN;SG')[1]),casKey('παιδός'));
 for(const code of ['N;NOM;SG','N;NOM;PL','N;GEN;SG',
  'N;DAT;SG','N;ACC;SG']){
  const article=slots.get(code)[3];
  assert.ok(article&&/ὁ|οἱ|τοῦ|τῷ|τὸν/u.test(article)&&
   /ἡ|αἱ|τῆς|τῇ|τὴν/u.test(article),
   'Falta evidencia del doble género: '+code);
 }
 const forms=CASES.flatMap(([cas,tag])=>NUMBERS.map(([number,numberTag])=>{
  const row=slots.get('N;'+tag+';'+numberTag);
  assert.ok(row&&row[1]&&typeof row[1]==='string');
  return {form:noQuantity(row[1]),case:cas,number,analysis:cas+' '+number};
 }));
 const attested={
  'nominativo:singular':'παῖς','nominativo:plural':'παῖδες',
  'vocativo:singular':'παῖ','vocativo:plural':'παῖδες',
  'acusativo:singular':'παῖδα','acusativo:plural':'παῖδας',
  'genitivo:singular':'παιδός','genitivo:plural':'παίδων',
  'dativo:singular':'παιδί','dativo:plural':'παισί'
 };
 for(const row of forms){
  assert.equal(row.form,attested[row.case+':'+row.number],
    'La lectura de παῖς cambió en UniMorph: cotejo filológico obligatorio');
 }
 assert.equal(new Set(forms.map(f=>f.analysis)).size,10);
 return {
  id:'griego-sustantivo-decision-pais',language:'griego',unit:8,
  kind:'sustantivo',gender:'común',agreementGenders:['masculino','femenino'],
  paradigm:'παῖς, παιδός (ὁ / ἡ) · tercera declinación',
  forms,evidence:{
   source:'UniMorph grc + Vocabula, cotejo individual de diez casillas',
   file:'data/unimorph-syllabus/grc/part-06.json',
   unit:8,topic:'Tercera declinación',caption:'παῖς · masculino y femenino',
   status:'paradigma-documentado',vocabulaSha,
   vocabulaEntry:entry.id,vocabulaGroup:'UD 8',license:'CC BY-SA 3.0',
   review:'conciliación interfuentes; diez casillas individualmente cotejadas',
   decisionId:'griego-pais',teacherDecision:'ambos-generos',
   notes:'Un único paradigma de diez casillas, sin dual ni formas inferidas; '+
    'el masculino y femenino solo se distinguen por artículo y concordancia.'
  }
 };
}
