'use strict';
// Distractores basados en afinidad léxica: no altera el banco ni las respuestas válidas.
const CHOICE_TOPICS = [
  'familia:padre madre hijo hija hermano hermana esposa marido mujer esposo familia pariente nino nina joven anciano',
  'personas:persona hombre mujer nino nina joven anciano muchacho amigo enemigo esclavo siervo extranjero ciudadano vecino habitante alumno maestro profesor',
  'oficios:campesino agricultor marinero navegante soldado jinete caballero general emperador magistrado cónsul consul sacerdote poeta profesor maestro mensajero gobernador comerciante mercader medico médico cazador guardián guardian',
  'gobierno:rey reina emperador gobernante soberano cónsul consul senador senado magistrado tirano jefe lider líder arconte estratego dictador tribuno gobierno reino imperio',
  'milicia:guerra batalla combate lucha asedio ataque ejército ejercito tropas legión legion campamento victoria derrota soldado enemigo aliado arma armas escudo espada proyectil lanza guerra',
  'edificios:casa vivienda hogar templo palacio edificio aula escuela teatro foro muralla muro puerta torre ciudadela granja villa',
  'lugares:ciudad pueblo aldea villa campo region región provincia territorio patria país pais isla plaza calle camino senda ruta puerto frontera costa ribera',
  'naturaleza:tierra cielo mar rio río montaña monte colina valle bosque selva árbol arbol flor rosa hierba campo prado piedra roca arena',
  'agua:mar rio río agua fuente fuente lago puerto nave barco barco costa ribera flota isla océano oceano navegar',
  'animales:caballo perro gato toro buey cabra oveja león leon fiera lobo pájaro pajaro ave ciervo animal rebaño',
  'tiempo:día dia noche mañana tarde verano invierno otoño otono primavera año ano mes hora tiempo instante época epoca fecha',
  'cosmos:sol luna estrella astro cielo universo cosmos luz sombra oscuridad aire viento nieve lluvia',
  'cuerpo:cuerpo cabeza piel mano pie nariz ojo oreja sangre carne hueso boca lengua vena',
  'objetos:libro carta mensaje palabra letra nombre discurso poema escrito tablilla mesa silla anillo estatua escultura vasija regalo',
  'lenguaje:palabra discurso carta libro letra nombre lengua conversación conversacion mensaje voz noticia opinión opinion',
  'ideas:verdad mentira justicia injusticia ley derecho deber norma virtud sabiduría sabiduria conocimiento ciencia razón razon arte técnica tecnica',
  'emociones:amor odio amistad miedo temor alegría alegria tristeza placer deseo esperanza dolor ira felicidad',
  'economia:oro plata hierro riqueza fortuna dinero pobreza tesoro premio recompensa comercio bienes abundancia',
  'cantidad:mucho mucha poco poca abundante numeroso escaso grande pequeño pequeno enorme entero todo todos ninguno uno primero segundo tercero',
  'cualidad:bueno malo malvado perverso justo injusto sabio ignorante hermoso bello bonito feo célebre celebre famoso ilustre',
  'caracter:valiente audaz fuerte débil debil prudente sensato peligroso temeroso tímido timido feliz triste desafortunado',
  'espacio:alto bajo largo corto ancho estrecho cercano lejano próximo proximo grande pequeño pequeno rápido rapido lento',
  'movimiento:ir venir llegar salir entrar regresar volver marchar caminar correr huir acercarse alejarse partir avanzar subir bajar recorrer navegar',
  'transporte:llevar traer conducir transportar arrastrar enviar mandar recibir recoger coger tomar capturar dar entregar devolver',
  'guerra-verbo:luchar combatir vencer atacar defender perseguir matar destruir devastar saquear conquistar resistir asediar salvar proteger',
  'habla-verbo:hablar decir contar narrar responder preguntar gritar anunciar proclamar ordenar mandar llamar nombrar escribir leer',
  'mente-verbo:saber conocer aprender estudiar enseñar ensenar pensar considerar creer decidir comprender entender recordar olvidar',
  'percepcion-verbo:ver mirar observar contemplar escuchar oír oir sentir distinguir descubrir encontrar buscar',
  'afecto-verbo:amar querer desear odiar temer respetar alegrarse admirar gustar llorar lamentar esperar',
  'accion-verbo:hacer realizar crear fabricar construir fundar preparar colocar poner establecer formar empezar acabar terminar',
  'posesion-verbo:tener poseer guardar conservar retener mantener coger tomar recibir dar proporcionar ofrecer comprar vender',
  'estado-verbo:ser estar parecer permanecer quedarse vivir habitar existir nacer morir llegar volverse',
  'relaciones:con sin entre hacia desde sobre bajo encima debajo alrededor delante detrás detras cerca lejos',
  'enlaces:y o pero sino pues porque aunque cuando mientras así asi entonces por ni que tampoco',
  'frecuencia:siempre nunca frecuentemente amenudo a menudo muchas veces algunas veces raramente todavía todavia aún aun ahora después despues antes primero luego',
  'interrogativos:qué que quién quien cuándo cuando dónde donde adónde adonde cómo como porqué porque'
].map(function(line) {
  const sep = line.indexOf(':');
  return {name: line.slice(0, sep), words: new Set(line.slice(sep + 1).normalize('NFD').replace(/\p{M}/gu, '').split(/\s+/))};
});
// Las equivalencias siguientes no pueden actuar como opciones incorrectas entre sí.
const CHOICE_SYNONYMS = [
  'bonito bello hermoso guapo', 'grande enorme inmenso', 'pequeño chico diminuto',
  'valiente audaz osado', 'rápido veloz', 'viejo antiguo', 'famoso célebre ilustre',
  'sabio docto', 'malo malvado perverso', 'feliz contento alegre',
  'niño muchacho chiquillo', 'maestro profesor docente',
  'rey monarca soberano', 'marinero navegante', 'médico doctor',
  'ciudad urbe', 'aldea poblado', 'camino senda ruta', 'bosque selva',
  'batalla combate', 'dinero pecunia', 'riqueza fortuna',
  'temor miedo', 'placer deleite', 'alegría felicidad',
  'morir fallecer', 'matar asesinar', 'luchar combatir',
  'querer desear', 'saber conocer', 'ver mirar observar',
  'oír escuchar', 'hablar conversar', 'decir expresar',
  'enseñar educar', 'pensar considerar', 'escribir redactar',
  'caminar andar', 'regresar volver', 'partir marcharse',
  'coger tomar agarrar', 'llevar transportar', 'dar entregar',
  'dejar abandonar', 'guardar conservar', 'salvar rescatar',
  'construir edificar', 'vivir habitar', 'mirar contemplar'
].map(function(line) {
  return new Set(line.normalize('NFD').replace(/\p{M}/gu, '').split(' '));
});
function choiceNormalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/æ/g, 'ae').replace(/[‘’'“”.,;:!?¿¡]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function choiceWords(e) {
  const text = (e.answers || []).join(' ') || e.meaning;
  const words = choiceNormalize(text).match(/[a-z]+/g) || [];
  const result = new Set(words);
  for (const word of words) {
    if (word.length > 5 && word.endsWith('es')) result.add(word.slice(0, -2));
    if (word.length > 4 && word.endsWith('s')) result.add(word.slice(0, -1));
  }
  return result;
}
function choicePartOfSpeech(e) {
  const form = choiceNormalize(e.form);
  const first = choiceNormalize((e.answers || [])[0] || e.meaning);
  if (/\bprep\b/.test(form) || /\+\s*(genitivo|acusativo|dativo|ablativo|gen|acc|dat|abl)\b/.test(form)) return 'preposicion';
  if (/\b(conj|part)\b/.test(form) || /^(y|o|pero|sino|pues|porque|aunque|ni|que)$/.test(first)) return 'conjuncion';
  if (/\badv\b/.test(form)) return 'adverbio';
  if (/\bnum\b/.test(form)) return 'numeral';
  if (/\bpron\b/.test(form)) return 'pronombre';
  const original = String(e.form || '').trim();
  const firstOriginal = String((e.answers || [])[0] || '').trim();
  if (/^\p{Lu}/u.test(original) && /^\p{Lu}/u.test(firstOriginal)) return 'nombre-propio';
  if (/(?:ar|er|ir)(?:se)?$/.test(first.split(/[ ,]/)[0]) ||
      /^(ser|estar|hacer|ir|llegar a ser)\b/.test(first)) return 'verbo';
  if (/\/[ao]\b/.test(first) ||
      /\b(bueno|malo|grande|pequeno|fuerte|feliz|triste|justo|injusto|sabio|joven|viejo|nuevo|veloz|rapido|lento|hermoso|bonito|celebre|famoso|audaz|prudente|rico|pobre|libre|mucho|poco|primero|ultimo|todo|nuestro|suyo|proximo|cercano|lejano)\b/.test(first)) return 'adjetivo';
  return 'sustantivo';
}
// Un objeto de vocabulario no se modifica durante la sesión: calcular afinidad una sola vez.
const CHOICE_INFO_CACHE = new WeakMap();
function choiceInfo(e) {
  const cached = CHOICE_INFO_CACHE.get(e);
  if (cached) return cached;
  const words = choiceWords(e);
  const info = {pos: choicePartOfSpeech(e), words, topics: new Set(CHOICE_TOPICS.filter(t => [...words].some(w => t.words.has(w))).map(t => t.name))};
  CHOICE_INFO_CACHE.set(e, info);
  return info;
}
function choiceConflicts(a, b, infoA, infoB) {
  if (a.id === b.id || choiceNormalize(a.meaning) === choiceNormalize(b.meaning)) return true;
  const aa = new Set(accepted(a));
  if (accepted(b).some(v => aa.has(v))) return true;
  for (const group of CHOICE_SYNONYMS) {
    if ([...infoA.words].some(w => group.has(w)) && [...infoB.words].some(w => group.has(w))) return true;
  }
  return false;
}
function pickDistractors(entry, pool, limit = 3) {
  const info = choiceInfo(entry);
  const entries = pool.filter(other => other.id !== entry.id).map(other => {
    const candidate = choiceInfo(other);
    if (choiceConflicts(entry, other, info, candidate)) return null;
    let shared = 0;
    for (const topic of info.topics) if (candidate.topics.has(topic)) shared++;
    const lengthDelta = Math.abs(choiceNormalize(entry.meaning).length - choiceNormalize(other.meaning).length);
    const score = (info.pos === candidate.pos ? 90 : -80) + Math.min(shared, 2) * 65
      + Math.max(0, 12 - lengthDelta) / 2 + Math.random() * 10;
    return {entry: other, info: candidate, score};
  }).filter(Boolean).sort((a,b) => b.score - a.score);
  const selected = [];
  for (const candidate of entries) {
    if (selected.every(x => !choiceConflicts(x.entry, candidate.entry, x.info, candidate.info))) {
      selected.push(candidate);
      if (selected.length === limit) break;
    }
  }
  return selected.map(x => x.entry);
}
