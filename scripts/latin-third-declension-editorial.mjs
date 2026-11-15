// Acotación filológica en las copias integradas de Latín I y Latín de 4.º.
// Los textos bloqueados de Appendix, los paradigmas y el progreso son
// inmutables. La regla parisilábica es una pista, no un diagnóstico infalible.
// A&G §§73–78: canis, canis -> canum; civis, civis -> civium.
import assert from 'node:assert/strict';
const LAT='<i lang="la">';
const end='</i>';
export const THIRD_DECLENSION_CORRECTION=Object.freeze({
 es:{
  clueBefore:'Las palabras de tema en consonante son aquellas de distinto número de sílabas en nominativo y genitivo (consultar enunciado), mientras que las palabras de tema en <i lang="la">–i</i> tienen el mismo número de sílabas.',
  clueAfter:'El número de sílabas del nominativo y del genitivo puede servir de pista, pero no determina por sí solo el tema: <i lang="la">civis, civis</i> tiene genitivo plural <i lang="la">civium</i>, mientras que <i lang="la">canis, canis</i> tiene <i lang="la">canum</i>.',
  endingsBefore:'Hay excepciones: las palabras cuyo nominativo acaba en <i lang="la">–bs</i>, <i lang="la">–ns</i>, <i lang="la">–ps</i> o <i lang="la">–rs</i> son de tema en <i lang="la">–i</i> sin contar sílabas.',
  endingsAfter:'Algunos monosílabos con dos consonantes ante <i lang="la">–is</i> en el genitivo, como <i lang="la">urbs, urbis</i> y <i lang="la">ars, artis</i>, presentan los genitivos plurales <i lang="la">urbium</i> y <i lang="la">artium</i>. La terminación del nominativo no permite establecer por sí sola el tema: hay que consultar la flexión documentada.'
 },
 val:{
  clueBefore:'Les paraules de tema en consonant solen tindre un nombre diferent de síl·labes en nominatiu i genitiu, mentre que les de tema en <i lang="la">–i</i> solen tindre el mateix nombre de síl·labes.',
  clueAfter:'El nombre de síl·labes del nominatiu i del genitiu pot servir de pista, però no determina per si sol el tema: <i lang="la">civis, civis</i> té el genitiu plural <i lang="la">civium</i>, mentre que <i lang="la">canis, canis</i> té <i lang="la">canum</i>.',
  endingsBefore:'Hi ha excepcions: les paraules el nominatiu de les quals acaba en <i lang="la">–bs</i>, <i lang="la">–ns</i>, <i lang="la">–ps</i> o <i lang="la">–rs</i> són de tema en <i lang="la">–i</i>, independentment del nombre de síl·labes.',
  endingsAfter:'Alguns monosíl·labs amb dos consonants abans de <i lang="la">–is</i> en el genitiu, com <i lang="la">urbs, urbis</i> i <i lang="la">ars, artis</i>, presenten els genitius plurals <i lang="la">urbium</i> i <i lang="la">artium</i>. La terminació del nominatiu no permet establir per si sola el tema: cal consultar la flexió documentada.'
 }
});
function once(s,from,to,what){
  assert.equal(s.split(from).length,2,
    'La fuente de tercera declinación cambió ('+what+'): revisar antes de importar');
  return s.replace(from,to);
}
export function reconcileThirdDeclensionInstructions(html,locale){
  assert.ok(locale==='es'||locale==='val','Lengua no admitida');
  assert.ok(typeof html==='string'&&html.includes('civium')&&
    html.includes('marium')&&html.includes('ducum'),
    'Se requiere el capítulo completo de tercera declinación');
  const t=THIRD_DECLENSION_CORRECTION[locale];
  const first=once(html,t.clueBefore,t.clueAfter,'pista silábica '+locale);
  const second=once(first,t.endingsBefore,t.endingsAfter,'terminaciones '+locale);
  assert.equal((second.match(/<table\b/gu)||[]).length,
    (html.match(/<table\b/gu)||[]).length,
    'Una enmienda didáctica no puede cambiar los paradigmas');
  assert.equal((second.match(/<td\b/gu)||[]).length,
    (html.match(/<td\b/gu)||[]).length);
  return second;
}
