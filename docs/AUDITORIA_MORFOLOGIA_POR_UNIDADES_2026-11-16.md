# Auditoría de cobertura real de morfología por unidades

**Fecha:** 16/11/2026. **Ámbito:** ScholaClassica (Latín I, Latín 4.º y
Griego I), dos idiomas. **Alcance:** solo lectura y diagnóstico; esta PR
no amplía bancos, no asigna unidades nuevas y no publica material sin
verificación.

## Estado curricular conciliado con la PR #120

La primera auditoría partía de **92 paradigmas de Latín I**. La
ampliación aprobada en la [PR #120](https://github.com/ArchaiosMagister/ScholaClassica/pull/120) anexa dos fichas
al banco de ScholaClassica, una para UD1 y otra para UD2. Por tanto,
en la ejecución **combinada** con #120, el censo correcto es:

| Curso | Unidades de gramática | Paradigmas de práctica | Altas por unidad |
| --- | ---: | ---: | --- |
| Latín I | 10 | **94** | **13, 8**, 13, 16, 6, 4, 21, 3, 7, 3 |
| Latín 4.º | 8 | 76 | 2, 11, 2, 17, 6, 19, 12, 7 |
| Griego I | 14 | 94 | 3, 2, 6, 11, 6, 2, 13, 19, 2, 6, 2, 4, 3, 15 |

**Total: 264 paradigmas**, en las mismas 32 unidades y 73 epígrafes.
Los IDs, el orden de los registros anteriores, el progreso y la
cobertura de Latín 4.º y Griego I se preservan. La presencia de una
familia flexiva todavía no certifica la exhaustividad filológica de
todos sus subtipos.

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

La auditoría inicial (antes de #120) identificó dos reservas de cobertura,
ambas en Latín I. El diagnóstico actualizado comprueba las **formas,
su evidencia curricular y los ejercicios que pueden generarse**.
Solo considera cerrada cada reserva si el registro conserva exactamente
las cinco formas y el alcance didáctico autorizado.

Tras ejecutar la auditoría sobre #120, **las dos reservas quedan
resueltas**; si falta una forma o se permite producir locativos,
la reserva reaparece como incidencia en el informe.

| Curso y unidad | Tema | Diagnóstico documental | Decisión |
| --- | --- | --- | --- |
| Latín I UD1 | Infinitivo de presente activo | Appendix documenta *amare, habere, ducere, audire, capere*. La ficha `latin-ud1-infinitivos-presente-ejemplos` es de UD1, contiene **solo esas cinco formas** con voz activa y tiempo presente y conserva la evidencia del epígrafe. | **Resuelta**: 5 preguntas de análisis, 5 de elección de forma y 5 escritas; sin infinitivos pasivos o compuestos anticipados |
| Latín I UD2 | Locativo | Appendix documenta *Corinthi, Romæ, domi, humi, ruri*. La ficha `latin-ud2-locativos-ejemplos` contiene las cinco formas marcadas como locativo singular y `practiceScope=recognition-only`. | **Resuelta**: 5 preguntas de reconocimiento, **0 de elección/producción escrita y 0 tablas**; el locativo sigue siendo un caso residual no productivo |

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
- `tests/morphology-unit-coverage.test.mjs` comprueba los **264
  paradigmas**, 32 unidades y 73 epígrafes, exige **cero reservas
  pendientes y dos cierres acreditados** e inspecciona la generación de
  preguntas en ambas unidades. Si desaparece un ejemplo o se permite
  producir locativos, vuelve a abrir la reserva. También exige un aviso
  ante la desaparición artificial del imperfecto de Latín 4.º y
  mantiene la comprobación del infinitivo de UD8.
- GitHub Actions conserva la matriz estructurada como artefacto JSON
  durante 30 días y ejecuta los tests completos de regresión.

**La PR #118 continúa siendo exclusivamente una auditoría**: no
modifica ningún paradigma, ID, progreso ni aplicación original. Las dos
fichas académicas se incorporan únicamente mediante la **PR #120**.

**Dependencia de integración:** primero fusionar #120 y confirmar sus
pruebas; después devolver #118 a la rama base `main`, ejecutar de
nuevo la batería combinada y fusionar #118 solo si todo es correcto.
No fusionar ni publicar #118 contra una base que todavía tenga los
92 paradigmas anteriores.
