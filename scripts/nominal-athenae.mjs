// Las cinco formas áticas de Ἀθῆναι proceden de fuentes lexicográficas
// individuales (Logeion/Wiktionary). No crear singular ni dual por analogía.
import assert from 'node:assert/strict';
const ATTIC=Object.freeze([
 ['nominativo','Ἀθῆναι'],['vocativo','Ἀθῆναι'],
 ['acusativo','Ἀθήνας'],['genitivo','Ἀθηνῶν'],['dativo','Ἀθήναις']
]);
export function compileAthenae({vocabulaData,vocabulaSha,decisions}){
 assert.equal(decisions?.status,'aprobado-por-docente');
 assert.equal(decisions?.choices?.athenae,'plural-documentado-pendiente-fuente');
 assert.match(vocabulaSha,/^[a-f0-9]{40}$/);
 const match=vocabulaData.match(/^window\.VOCAB=(\[[\s\S]*\]);?\s*$/);
 assert.ok(match,'Formato fuente Vocabula no reconocido');
 const lexicon=JSON.parse(match[1]);
 assert.equal(lexicon.length,2055,'Banco Vocabula no fijado');
 const entries=lexicon.filter(x=>x.subject==='gr1'&&x.mode==='examen'&&
  x.form==='Ἀθῆναι, –ῶν'&&x.units.length===1&&x.units[0]==='UD 1–4');
 assert.equal(entries.length,1,'Enunciado de Atenas ambiguo');
 assert.equal(entries[0].id,'b8e417b32b6f3692');
 const forms=ATTIC.map(([cas,form])=>({
  form:form.normalize('NFC'),case:cas,number:'plural',analysis:cas+' plural'
 }));
 assert.equal(new Set(forms.map(f=>f.analysis)).size,5);
 assert.ok(forms.every(x=>x.form&&x.number==='plural'));
 return {
  id:'griego-sustantivo-decision-athenai',language:'griego',unit:4,
  kind:'sustantivo',gender:'femenino',
  paradigm:'Ἀθῆναι, Ἀθηνῶν (αἱ) · pluralia tantum',
  forms,evidence:{
   status:'paradigma-documentado',
   source:'Logeion Morpho y Wiktionary: declinación ática del topónimo',
   file:'cotejo-filologico-atico-individual',
   unit:3,topic:'Primera declinación',caption:'Ἀθῆναι, nombre propio plural',
   vocabulaSha,vocabulaEntry:entries[0].id,vocabulaGroup:'UD 1–4',
   numberScope:'plural',genderEvidence:'femenino plural αἱ',
   decisionId:'griego-athenai',
   teacherDecision:'plural-documentado-pendiente-fuente',
   review:'conciliación interfuentes; cinco casillas del plural ático documentadas; sin singular',
   references:['https://logeion.uchicago.edu/morpho/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9',
    'https://en.wiktionary.org/wiki/%E1%BC%88%CE%B8%E1%BF%86%CE%BD%CE%B1%CE%B9'],
   notes:'No importar las formas dialectales ni el singular de Ἀθήνη. '+
    'Nombre propio plural; solo cinco casos plurales en ejercicios.'
  }
 };
}
