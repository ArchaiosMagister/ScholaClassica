# Auditoría de cobertura real de morfología por unidades

**Fecha:** 16/11/2026. **Ámbito:** ScholaClassica (Latín I, Latín 4.º y
Griego I), dos idiomas. **Alcance:** solo lectura y diagnóstico; esta PR
no amplía bancos, no asigna unidades nuevas y no publica material sin
verificación.

## Estado previo confirmado

| Curso | Unidades de gramática | Paradigmas de práctica | Altas por unidad |
| --- | ---: | ---: | --- |
| Latín I | 10 | 92 | 12, 7, 13, 16, 6, 4, 21, 3, 7, 3 |
| Latín 4.º | 8 | 76 | 2, 11, 2, 17, 6, 19, 12, 7 |
| Griego I | 14 | 94 | 3, 2, 6, 11, 6, 2, 13, 19, 2, 6, 2, 4, 3, 15 |

Estos recuentos proceden del último informe transversal sobre las
fuentes compiladas y muestran que todas las unidades contienen al menos
un modelo. **No prueban que todos los epígrafes flexivos dispongan de
ejercicios específicos.**

## Método nuevo

`scripts/audit-morphology-curricular-coverage.mjs` contrasta los
**73 epígrafes de las 32 unidades** de Appendix en castellano con la
misma secuencia y estructura de tablas en valenciano, y con los modelos
documentados de la práctica de morfología. Para cada epígrafe:

1. Clasifica si introduce una flexión, reutiliza modelos previos,
   explica sintaxis/invariables, o enseña un caso morfológico especial.
2. Cuenta los modelos de su categoría **introducidos en la unidad**
   (sin confundirlos con los modelos acumulados de cursos anteriores).
3. Señala por separado las fichas con evidencia cuyo
   `evidence.topic` coincide literalmente con el epígrafe.
4. Intenta generar ejercicios de análisis, selección de forma,
   respuesta escrita y tabla completa utilizando exclusivamente los
   registros pertinentes. **Un modo que no produzca preguntas se
   documenta**, pero no equivale automáticamente a ausencia del tema:
   por ejemplo, los pronombres personales no permiten una tabla de
   declinación convencional que mezcle personas.
5. Archiva una matriz completa de unidad, epígrafe, naturaleza,
   modelos, casillas, actividades y reservas:
   `build/academic-audits/morphology/cobertura-por-unidades-v1.json`.

La ausencia de un modelo introducido en la UD se marca como
**candidatura para revisión**, no como un error filológico demostrado.
Quedan excluidos de esta inferencia los epígrafes de sintaxis,
preposiciones y construcciones con adjetivos sustantivados que
reutilizan flexión ya explicada.

**Reglas docentes mantenidas:** Latín 4.º solo UD1–8;
las UD9–10 no se adelantan. No se generan paradigmas por analogía,
ni se reinterpretan las unidades de Vocabula, ni se editan la gramática
bilingüe y la tabla de progreso del alumnado.

## Resultados y decisiones

La primera ejecución completa comparó las 32 unidades y 73 epígrafes
con los registros y cuatro modalidades de preguntas. Identificó
**tres coincidencias incompletas por tipo técnico**, pero la revisión
directa de las formas redujo los candidatos a **dos reservas reales
de cobertura**, ambas en **Latín I**.

| Curso y unidad | Tema | Diagnóstico documental | Decisión |
| --- | --- | --- | --- |
| Latín I UD1 | Infinitivo de presente activo | Appendix documenta literalmente las terminaciones y los ejemplos `amare`, `habere`, `ducere`, `audire`, `capere`. En la práctica no hay un paradigma `infinitivo` introducido en UD1. | Candidato claro: estudiar una ficha con **solo esas cinco formas** verificadas; no inventar nuevas conjugaciones ni anticipar infinitivos compuestos |
| Latín I UD2 | Locativo | Appendix explica la naturaleza no productiva del caso y documenta `Corinthi`, `Romæ`, `domi`, `humi`, `ruri`. No hay casillas con `case=locativo` en los modelos acumulados hasta UD2. | Reservar para decisión docente: practicar ejemplos expresos como formas aisladas o mantener el locativo como contenido de consulta; **no generar un paradigma locativo regular** |

La comprobación detallada descartó un falso positivo:

- **Latín I UD8, infinitivos:** el registro
  `latin-ud8-infinitivos` contiene los cinco infinitivos de presente
  activos, los cinco pasivos y cuatro formas compuestas documentadas.
  Se almacena como `kind=verbo`, pero sus análisis identifican
  expresamente `infinitivo`. La auditoría nueva exige también este
  rasgo real, no solo una etiqueta `kind`.
- **Latín I UD9, tiempos pasivos compuestos:** los ejemplos se
  practican como formas verbales con `pasivo` en el análisis. La
  flexión completa del participio recibe tratamiento en la UD10.
  No sería correcto exigir ya una tabla independiente completa del
  participio de perfecto en UD9 para acreditar los ejemplos pasivos.

**Latín de 4.º:** sus ocho unidades incorporan la familia de formas
correspondiente a cada epígrafe flexivo, sin anticipar UD9 ni UD10.

**Griego I:** todas las unidades en que se introduce una familia
flexiva cuentan con modelos de la categoría y ejemplos que pueden
participar en las actividades. Las UD4 y algunos epígrafes de otras
unidades se destinan a sintaxis, preposiciones o reutilización de
morfología anterior: no se han señalado como lagunas.

Esta es una **auditoría de cobertura curricular por epígrafe**, no
una certificación de que cada subclase, irregularidad, grafía griega,
variante manuscrita o forma de cada lema se haya verificado
individualmente. La presencia de un paradigma con un `kind`
compatible es una **primera evidencia**, no prueba de cobertura
exhaustiva de cada subtema. La revisión filológica individual
continúa gobernada por sus pruebas especializadas.

## Pruebas y repetibilidad

- `npm run audit:morfologia:unidades` produce la matriz y los
  hallazgos, sin cambios de contenido.
- `tests/morphology-unit-coverage.test.mjs` comprueba las 262 fichas,
  32 unidades y 73 epígrafes, los **dos candidatos** registrados, y
  verifica que el infinitivo de UD8 es una forma verbal realmente
  generable. También exige un aviso ante la desaparición artificial
  del imperfecto de 4.º.
- GitHub Actions conserva la matriz estructurada como artefacto JSON
  durante 30 días y ejecuta los tests completos de regresión.

**No se ha añadido ni modificado ningún paradigma, ficha, unidad, ID,
banco histórico, progreso o aplicación original.** La selección del
siguiente cambio didáctico queda separada de esta auditoría.
