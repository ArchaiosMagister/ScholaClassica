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

Los resultados por epígrafe, incluidas las posibles ausencias, se
determinan por la ejecución real de
`npm run audit:morfologia:unidades` en GitHub Actions y se adjuntan
como artefacto JSON. Las comprobaciones se ejecutan también desde
`tests/morphology-unit-coverage.test.mjs`, donde una supresión
artificial de los modelos del imperfecto de 4.º debe generar una
reserva explícita.

No se aprueba incorporar formas nuevas ni trasladar contenidos
entre unidades solo a partir de los resultados automáticos. Los
hallazgos que exijan criterio docente se comunicarán como tales antes
de modificar modelos o la PWA.
