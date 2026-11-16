// Cierre conservador de dos reservas curriculares: Latín I UD1 y UD2.
// Solo ejemplos literales del Appendix fijado; nada se flexiona por analogía.
import assert from 'node:assert/strict';

export const EARLY_LATIN1_INFINITIVES=Object.freeze([
  ['amare','amo','1.ª conjugación'],
  ['habere','habeo','2.ª conjugación'],
  ['ducere','duco','3.ª conjugación'],
  ['audire','audio','4.ª conjugación'],
  ['capere','capio','3.ª mixta']
]);
export const EARLY_LATIN1_LOCATIVES=Object.freeze([
  ['Corinthi','en Corinto'],
  ['Romæ','en Roma'],
  ['domi','en casa'],
  ['humi','en el suelo'],
  ['ruri','en el campo']
]);
export const LATIN1_EARLY_IDS=Object.freeze({
  infinitives:'latin-ud1-infinitivos-presente-ejemplos',
  locatives:'latin-ud2-locativos-ejemplos'
});
const textOf=html=>String(html||'').replace(/<[^>]+>/gu,' ')
  .replace(/&aelig;/gu,'æ').replace(/&nbsp;/gu,' ')
  .replace(/\s+/gu,' ').normalize('NFC');

function lesson(curriculum,unit,title){
  const topic=curriculum?.latin?.units?.find(u=>u.number===unit)
    ?.topics?.find(t=>t.title===title);
  assert.ok(topic,'Falta tema curricular de Latín I UD'+unit+': '+title);
  return textOf(topic.html);
}
function evidence(unit,topic,caption,notes,extra={}){
  return {source:'Appendix grammaticae',file:'assets/curriculum.json',
    unit,topic,caption,status:'paradigma-documentado',notes,...extra};
}
export function compileLatin1EarlyAttested(curriculum){
  const infinitiveTopic='Infinitivo de presente activo';
  const infText=lesson(curriculum,1,infinitiveTopic);
  const locativeTopic='El locativo';
  const locText=lesson(curriculum,2,locativeTopic);
  for(const [form] of EARLY_LATIN1_INFINITIVES){
    assert.ok(infText.includes(form),
      'La fuente dejó de documentar el infinitivo UD1 '+form);
  }
  for(const [form,meaning] of EARLY_LATIN1_LOCATIVES){
    assert.ok(locText.includes(form),
      'La fuente dejó de documentar el locativo UD2 '+form);
    // El propio texto escolar explica su valor, no se deduce del nominativo.
    assert.ok(locText.includes(meaning),
      'Falta el significado documentado del locativo '+form);
  }
  assert.match(infText,/terminaciones de presente activo/iu);
  assert.match(locText,/no es productivo/iu);

  const infinitives={
    id:LATIN1_EARLY_IDS.infinitives,
    language:'latin',unit:1,kind:'infinitivo',
    paradigm:'amare, habere, ducere, audire, capere · ejemplos de presente activo',
    forms:EARLY_LATIN1_INFINITIVES.map(([form,lemma,conjugation])=>({
      form,analysis:'infinitivo de presente activo · '+conjugation+
        ' · '+lemma,tense:'presente',voice:'activa',
      conjugation,lemma
    })),
    evidence:evidence(1,infinitiveTopic,'Cinco infinitivos expresos de UD1',
      'Solo los cinco ejemplos incluidos literalmente en el tema. '+
      'No se incorporan tiempos compuestos ni infinitivos pasivos.')
  };
  const locatives={
    id:LATIN1_EARLY_IDS.locatives,
    language:'latin',unit:2,kind:'sustantivo',
    paradigm:'Formas locativas aisladas · cinco ejemplos documentados',
    forms:EARLY_LATIN1_LOCATIVES.map(([form,meaning])=>({
      form,analysis:'valor locativo documentado · '+meaning,
      case:'locativo',number:'singular',meaning
    })),
    evidence:evidence(2,locativeTopic,'Cinco locativos expresos de UD2',
      'Caso residual no productivo. Se reconocen cinco ejemplos aislados '+
      'con su valor local, sin inventar paradigmas regulares. Una forma '+
      'aislada puede tener otros análisis fuera del contexto escolar.',
      {practiceScope:'recognition-only',sourceNumber:'singular'})
  };
  assert.equal(infinitives.forms.length,5);
  assert.equal(locatives.forms.length,5);
  assert.equal(new Set([...infinitives.forms,...locatives.forms]
    .map(row=>row.form)).size,10);
  return [infinitives,locatives];
}
