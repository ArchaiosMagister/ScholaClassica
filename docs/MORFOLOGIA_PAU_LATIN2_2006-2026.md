# Auditoría morfológica de las PAU de Latín II (Comunitat Valenciana), 2006–2026

## Fuente, delimitación y trazabilidad

Fuente primaria: PDF de 56 páginas aportado por el docente (exámenes de Latín II
de la Comunitat Valenciana entre 2006 y 2026). Se conserva en el entorno del
docente, **no se redistribuye** en ScholaClassica ni se publica en GitHub.

Registro persistente `shared/academic/latin2/pau-cv-2006-2026.tsv`.
Cada fila representa una página y modelo, con la serie **literal de las formas
preguntadas para el análisis morfológico**, sin incluir el resto de palabras del
texto de traducción. La estructura incluye 78 modelos o agrupaciones de examen,
352 ocurrencias y 301 formas gráficas distintas (ignorando diferencias de
mayúsculas y cantidad vocálica).

- 2006–2019: cuatro formas de cada uno de los modelos A y B.
- 2020–2024: ocho propuestas compartidas entre dos textos de examen.
- 2025–2026: selección de cuatro formas subrayadas por opción;
  se incluyen convocatorias de reserva de 2025 presentes en el documento.
- Las páginas de 2010 tienen fragmentación en la extracción de texto: se
  cotejaron con las páginas correspondientes.
- La auditoría identifica formas **completas de más de una palabra**:
  `profectus est`, `relictus erat`, `erant polliciti`,
  `pugnatum est`, `conspicatus est`, `ventum est`, etc.

En cada construcción, `scripts/morphology-pau-latin2.mjs` verifica que
persisten las 352 ocurrencias y 301 formas distintas. El compilador exige
que el banco de Latín II contenga **las 301 formas** dentro de paradigmas
flexivos, nunca como simples palabras independientes. El informe resultante
se publica en `apps/morfologia/data/pau-latin2-audit.json`.

## Qué significa «paradigma completo»

Se incorporan modelos de seis casos y ambos números cuando existen;
los adjetivos distinguen los tres géneros; los verbos integran las
personas en los tiempos de presente/perfecto de indicativo y subjuntivo,
con voz morfológica y los infinitivos como categoría separada.
No se generan singulares ficticios de los numerales `duo`, `tres`,
`ducenti`, ni de `complures` y `deliciae`, que son plurales léxicos.

Las 296 fichas previas de ScholaClassica (Latín I, Griego I, 4.º y
Latín II inicial) conservan sus identificadores y orden. Las nuevas
fichas se añaden únicamente a Latín II, `unit=0` y sin selector de unidad.

## Fuentes filológicas y niveles de prueba

1. **Appendix grammaticae**, revisión fijada en
   `config/sources.lock.json`: paradigmas de relativos y demostrativos
   `qui, quae, quod`, `ipse, ipsa, ipsum` (preexistentes), además de
   `ego`, `tu`, `sui` e `is, ea, id` incorporados ahora.
2. **Vocabula Latina Graecaque**, revisión fijada por SHA. El corpus
   Latin UniMorph proporciona flexiones nominales explícitas. La selección
   de paradigmas completos por casillas conserva la atribución, la
   licencia **CC BY-SA 3.0** y los requisitos de compartir igual:
   [UniMorph Latin](https://github.com/unimorph/lat),
   [licencia de los datos](https://creativecommons.org/licenses/by-sa/3.0/).
   Para su historial y sumas véase
   `data/unimorph-syllabus/manifest.json` en Vocabula.
3. **Paradigmas escolares declarados en scripts**: para vocablos con
   enunciado y tema léxico conocido de las PAU, se aplican las
   terminaciones regulares por declinación o conjugación y se conserva
   la identificación explícita del tema. Estas flexiones **se marcan
   como generadas a partir de un modelo**, no como verificadas
   filológicamente una a una. En particular, los tiempos de los
   verbos comunes no deben confundirse con lecturas de una única
   forma del texto sin comprobar el lema.
4. **Casos especiales**: tablas de indefinidos `quidam`, `quisque`,
   `alius`, del adjetivo `binominis, binomine`, del plural
   `complures`, del sustantivo plural `deliciae`, y de
   `civis` y `percussor`. Se descartan lecturas morfológicas
   inexistentes por analogía.

Los repositorios originales de Appendix, Vocabula y GeneradorExamenes
**no se modifican**; sus fuentes académicas se consultan en modo lectura.

## Pasivos compuestos y deponentes

**La unidad de análisis es toda la expresión verbal y su verbo léxico**:
`profectus est` es `proficiscor, proficisci, profectus sum`,
tercera persona singular, pretérito perfecto de indicativo,
voz morfológica pasiva (**deponente, significado activo**).
No es `est` del verbo `sum` ni una pregunta de análisis de
participio aislado.

Las formas de la voz pasiva compuesta incluyen las concordancias de
género y número pertinentes sin mezclar el valor verbal con la declinación
nominal del participio. Las combinaciones con auxiliar antepuesto,
como `erant polliciti`, se representan como una única forma.

**Sincretismos**: `venit` conserva **presente y perfecto** de
`venio` (tercera singular del indicativo); `pervaserit` puede
corresponder a **futuro perfecto de indicativo** o **perfecto de
subjuntivo** de `pervado`. Los ejercicios de forma aislada
presentan juntas las lecturas acreditadas. Solo la oración decide cuál
queda subrayada como sintácticamente pertinente.

## Pruebas

- `tests/morphology-pau-latin2.test.mjs`: auditoría de 78 modelos,
  352 entradas, 301 grafías, cobertura completa, homografías, modelos
  nominales y pasivos/deponentes con el lema correcto.
- `npm test` y pruebas Chromium: navegación, PWA offline, corrector,
  repaso local y despliegue bajo la subruta real de GitHub Pages.
- La CI detiene la compilación si falta una forma PAU, si un paradigma
  cambia sin revisión o si los identificadores se duplican.

## Límites académicos

Que una forma figure en la lista PAU **no certifica automáticamente todos
los componentes del paradigma generado**. La cobertura del banco
representa paradigmas escolares completos con procedencia y reglas
explícitas; la contrastación léxica y documental *individual* de cada
celda es una tarea distinta. Además, algunas formas entre lemas
homógrafos pueden requerir ejercicios contextuales para evitar
preguntas con soluciones sintácticas arbitrarias.
