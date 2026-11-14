# Auditoría filológica de Latín II · fase 1 (14-11-2026)

## Alcance

Esta fase revisa **el banco real compilado** de la práctica de morfología de
Latín II y sus generadores, sin certificar por inferencia las formas
producidas por una regla. El índice de corpus disponible se mantiene:
352 apariciones de PAU (301 formas gráficas), 239 apariciones del cuaderno
(223 grafías); la cobertura de esos repertorios sigue siendo una comprobación
**distinta** de la verificación filológica individual de todas las casillas.

Fuentes cotejadas en esta primera fase:

- *Cuaderno de Latín II, curso 2026–2027*, PDF del docente,
  pp. **73–78**, especialmente tablas de paradigmas regulares e irregulares.
- Allen y Greenough, *New Latin Grammar*, §190 (deponentes), §204 (`fīō`),
  §157–180 (voz y paradigma verbal), mediante las ediciones de Dickinson
  College Commentaries y Alpheios.
- El código persistente y el banco de Latín II de
  `ArchaiosMagister/ScholaClassica` (commit inicial
  `99396145f495ba679ab06033972d2ebfc33a6c08`).

No se modifica el PDF ni los repositorios originales de Appendix, Vocabula
o GeneradorExamenes.

## Resultados del primer bloque

| ID | Categoría | Hallazgo | Acción |
| --- | --- | --- | --- |
| LAT2-FIL-001 | **Error confirmado** | Los modelos de `moror` y `populor` fabricaban los imperativos **mora** y **popula**, como si fueran activos. La 1.ª conjugación deponente exige `morare` / `moramini` y `populare` / `populamini`. | Corregido en el generador real; regresiones automáticas de ambas personas |
| LAT2-FIL-002 | **Advertencia de uso** | `fīmus` y `fītis` se encuentran en paradigmas de `fīō`, pero Allen y Greenough (§204) los señalan como formas excepcionales, no características de la prosa clásica. | Mantener el modelo documentado; no equiparar sin advertencia su frecuencia a `fīō, fīs, fit, fīunt`. Pendiente de decisión pedagógica sobre el sorteo |
| LAT2-FIL-003 | **Comprobación sin error** | Perfectos y pluscuamperfectos compuestos deben analizarse como una unidad verbal del lema léxico: `profectus est` (de `proficiscor`), `erant polliciti` (de `polliceor`), `collata erant` (de `confero`), `missi sunt` y `captae sumus`. | Invariantes automáticas; detienen la construcción si se descompone o reetiqueta la forma |
| LAT2-FIL-004 | **Comprobación sin error** | `venit`, `instituit`, `mitteris`, `feram` y `fiam` conservan las dos lecturas morfológicas descritas en sus paradigmas. | Invariantes automáticas que evitan corregir una lectura válida como si fuera falsa |
| LAT2-FIL-005 | **Riesgo estructural** | Hay paradigmas generados por reglas escolares y tablas reutilizadas, marcados con un estado de «paradigma documentado»; **no consta cotejo individual de todas sus formas**. | Auditoría con desglose de procedencia, sin asignarles una verificación individual ficticia |

Las grafías del PDF que parecen erróneas no se copian automáticamente:
`erint` como futuro de `sum` (p. 73), una columna pasiva de 4.ª
plagada de desinencias activas (p. 74), `fuerunt` como perfecto de
subjuntivo de `sum` (p. 75), `volit` (p. 77) y `tulissst` (p. 78)
tienen sus correcciones contrastadas en las fuentes del proyecto.
Esta fase añade salvaguardas sin reimportar las tablas con sus erratas.

## Validación reproducible

El generador `scripts/audit-morphology-latin2.mjs`, incorporado al
`buildMorphology`, produce
`apps/morfologia/data/latin2-filologia-fase1.json` con:

- Número de paradigmas de Latín II, casillas y formas gráficas distintas.
- Desglose de categorías y de nivel de evidencia (tabla fijada,
  paradigma derivado o declarado sin cotejo individual).
- Incidencias **bloqueantes** y **reservas de uso** en grupos distintos.
- Identificación explícita de que el cotejo individual del conjunto
  completo **no está concluido**.

La construcción se detiene si reaparece una incidencia bloqueante.
`tests/morphology-audit-latin2.test.mjs` comprueba además que una
regresión *introducida a propósito* en el imperativo de `moror` se
detecta y se rechaza antes de publicar.

## Siguiente lote, todavía pendiente

1. Contraste por categorías de sustantivos de tercera y cuarta
   declinación, incluyendo temas en -i y excepciones con variantes.
2. Paradigmas adjetivales con temas irregulares, comparativos,
   superlativos y sincretismos de género.
3. Revisión individual de los tiempos de perfecto de los verbos
   prefijados, pasivos impersonales, infinitivos y participios,
   con control de las variantes de `sum` y `fīō`.
4. Cotejo automatizado de las **formas de la PAU/cuaderno** frente a
   diccionarios y corpus académicos. No certificar por extensión
   todas las casillas del paradigma sin evidencia adicional.

El alcance presente permite publicar un **arreglo concreto y probado**
sin anunciar falsamente que la auditoría total del banco está acabada.

## Referencias externas

- Allen y Greenough §190: https://grammars.alpheios.net/allen-greenough/conj20.htm
- Imperativos de deponentes: https://www.usu.edu/markdamen/Latin1000/Presentation/transcriptions/34T.pdf
- Allen y Greenough §204 (`fīō`):
  https://dcc.dickinson.edu/it/grammar/latin/irregular-verbs-f%C4%AB%C5%8D
- Tabla del presente de `fīō` (formas excepcionales entre corchetes):
  https://dcc.dickinson.edu/sites/default/files/f%C4%AB%C5%8D_pres.pdf
