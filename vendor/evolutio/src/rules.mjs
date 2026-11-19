// Terminología de las PAU facilitada por el docente. Los identificadores no se traducen.
export const RULES = Object.freeze([
  { id: 'ABER', name: 'Abertura', description: 'La -i- y la -u- se abren a -e- y -o- respectivamente.', examples: ['manum → mano', 'cibum → cebo'] },
  { id: 'AFER', name: 'Aféresis', description: 'Pérdida de uno o más sonidos al principio de palabra.', examples: ['spasmum → pasmo'] },
  { id: 'APOC', name: 'Apócope', description: 'Pérdida de un sonido al final de palabra, distinta de la caída fija de -m de acusativo.', examples: ['cantare → cantar'] },
  { id: 'ASMIL', name: 'Asimilación', description: 'Un sonido se transforma para asemejarse a otro con el que está en contacto.', examples: ['rupturam → ruttura → rotura'] },
  { id: 'ASPIR', name: 'Aspiración', description: 'La f- inicial se aspira, se pierde en la pronunciación y en castellano se escribe h.', examples: ['filium → hijo', 'fabam → haba'] },
  { id: 'CONS', name: 'Consonantización', description: 'Una semiconsonante pasa a representarse o funcionar como consonante.', examples: ['iocum → juego', 'uita → vida', 'uerrucam → verruga'] },
  { id: 'DIPT', name: 'Diptongación', description: 'Una vocal se convierte en diptongo.', examples: ['focum → fuego'] },
  { id: 'DISIMIL', name: 'Disimilación', description: 'Un sonido se diferencia de otro semejante próximo para facilitar su pronunciación.', examples: ['animam → alma', 'lilium → lirio', 'arborem → árbol'] },
  { id: 'EPENT', name: 'Epéntesis', description: 'Introducción de un sonido dentro de una palabra.', examples: ['hominem → hombre'] },
  { id: 'GRIE', name: 'Evolución de grafías griegas', description: 'y → i; ph → f; th → t; ch → c/q.', examples: ['lyra → lira', 'thesaurum → tesoro', 'chartam → carta'] },
  { id: 'METAT', name: 'Metátesis', description: 'Cambio de lugar de un sonido: -arium → -airo → -ero; desplazamiento de r en otros contextos.', examples: ['ferrarium → ferrairo → herrero', 'semper → siempre'] },
  { id: 'MONOP', name: 'Monoptongación', description: 'Un diptongo latino (ae, oe, au) se reduce a una vocal.', examples: ['poenam → pena'] },
  { id: 'PALAT', name: 'Palatalización', description: 'Un sonido o grupo desplaza su articulación hacia el paladar; incluye -ll-, -lt-, -gn-, -mn-, -nn-, -ni-, -di-, -ti-, -li-, -ct-, -x-, cl-, pl- y fl-.', examples: ['multum → mucho', 'lignum → leño', 'noctem → noche', 'clauem → llave'] },
  { id: 'PROT', name: 'Prótesis', description: 'Adición de un sonido al principio de la palabra.', examples: ['spiritum → espíritu'] },
  { id: 'SIMPL', name: 'Simplificación', description: 'Reducción de consonantes dobles y de grupos: -mb- → -m-, -pt- → -t-, -ns- → -s-, -tt- → -t-.', examples: ['buccam → boca', 'plumbum → plomo', 'captare → catar', 'mensa → mesa', 'attonitum → atónito'] },
  { id: 'SINC', name: 'Síncopa', description: 'Pérdida de un sonido o grupo en el interior de palabra.', examples: ['turbidum → turbio', 'cadere → caer'] },
  { id: 'SONOR', name: 'Sonorización', description: 'Una consonante sorda intervocálica (p, t, c/k/q) se hace sonora (b, d, g).', examples: ['lupum → lobo', 'latus → lado'] },
  { id: 'VOC', name: 'Vocalización', description: 'Una consonante pasa a vocal; en los ejemplos oficiales, al → au → o.', examples: ['alterum → autro → otro'] },
  { id: 'MIN_MBR', name: '-MIN- → -MBR-', description: 'Síncopa de la -i- y aparición de b epentética: -min- → -mbr-. Se cuenta como una sola norma específica.', examples: ['hominem → hombre', 'feminam → hembra'] },
  { id: 'CUL', name: 'Evolución de -CUL-', description: 'El grupo -cul- evoluciona a -j- (tras síncopa) o a -g- (en la secuencia oficial con metátesis).', examples: ['oculum → ojo', 'miraculum → milagro'], subtypes: ['-CUL- > -J-', '-CUL- > -G-'] },
]);
export const FIXED_RULE = Object.freeze({ id: 'FIX_M', name: 'Pérdida fija de -m final', description: 'La -m final del acusativo latino desaparece; no se cuenta como apócope seleccionable.' });
export const ruleName = (id) => id === FIXED_RULE.id ? FIXED_RULE.name : RULES.find(r => r.id === id)?.name ?? id;
