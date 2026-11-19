// Grafía escolar de las formas latinas: una sola u, vocálica o consonántica.
// No se aplica a palabras castellanas, glosas, URLs o pruebas de transmisión.
export function latinU(value){
 return String(value??'').replace(/v/g,'u').replace(/V/g,'U');
}
export function latinKey(value){
 return latinU(value).toLocaleLowerCase('es')
  .replace(/æ/g,'ae').replace(/œ/g,'oe')
  .normalize('NFD').replace(/[\u0300-\u036f]/gu,'')
  .replace(/[^\p{L}\p{N}]/gu,'');
}
// En las explicaciones cambia SOLO la forma latina del lema, incluidas
// variantes de mayúsculas o cantidades vocálicas; nunca la traducción.
export function normalizeLatinLemmaMentions(explanation,latin){
 const target=latinKey(latin);
 return String(explanation??'').replace(/[\p{L}\p{M}]+/gu,token=>
  latinKey(token)===target?latinU(token):token);
}
