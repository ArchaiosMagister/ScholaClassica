# Auditoría transversal y editorial de Latín de 4.º ESO

**Fecha:** 14-11-2026  
**Repositorio y base:** `ArchaiosMagister/ScholaClassica`, commit publicado `33d721dff26812e8d513a78c9d529801aad88f48` (PR #76).  
**Ámbito:** gramática bilingüe de ocho unidades, módulo propio de práctica morfológica y banco estático de vocabulario incorporado desde Vocabula. **Solo informe: no se alteran recursos ni se publica.**

## 1. Fuentes y método

- Gramática: `scripts/adapt-appendix-latin4.mjs`, `scripts/adapt-appendix-latin4-ui.mjs`, `tests/gramatica-latin4.test.mjs`; fuentes de Appendix `a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c`: `assets/curriculum.json`, `val/curriculum.json`, `indicativo.html`, `val/indicativo.html`, `sustantivos.html`, `val/sustantivos.html`, `adjetivos.html` y `val/adjetivos.html`.
- Práctica de morfología: `scripts/morphology-latin4.mjs`, `tests/morphology-latin4.test.mjs`, `public/morfologia/app.mjs`, `public/morfologia/latin-typography.mjs`.
- Vocabulario: revisión fijada de Vocabula `0e16505b7631298a0448c4160a5d258f82732bfe`, archivos `data.js`, `gramatica-paradigmas.js`, `gramatica-latin-imperfectos.js`, `app.js`, `scope.js`.
- Comprobaciones: lectura y comparación de las fuentes fijadas, enumeración de unidades, tablas y modelos, detección textual de rótulos sin traducir y vocablos latinos sin marcado en secciones incluidas; revisión de enunciados visibles y etiquetas exactas de vocabulario. Se contrasta también el resultado de CI del despliegue posterior a PR #76, ejecución `43621300739`, satisfactoria.
- **Límite:** la revisión del vocabulario es sobre el banco estático fijado en Git, no equivale a leer posibles altas posteriores en el servicio docente de producción. Las pruebas de navegador se acreditan por CI/Chromium; no constituye prueba física de Safari en iPad. El barrido editorial identifica incidencias comprobadas, pero no garantiza la ausencia de toda errata léxica.

## 2. Matriz de currículo y cobertura

| UD | Gramática incorporada (castellano/valenciano) | Modelos morfológicos nuevos | Acumulados | Vocabulario General con etiqueta exacta | Examen con etiqueta exacta |
|---|---|---:|---:|---:|---:|
| 1 | Conceptos, casos, 1.ª declinación | 2 | 2 | 29 | 14 |
| 2 | 2.ª declinación, presente activo | 11 | 13 | 45 | 19 |
| 3 | Adjetivos 1.ª clase, preposiciones | 2 | 15 | 60 | 17 |
| 4 | Imperfecto activo | 17 | 32 | 68 | 17 |
| 5 | 3.ª declinación | 6 | 38 | 51 | 17 |
| 6 | Perfecto activo, pasiva presente/imperfecto | 19 | 57 | 54 | 7 |
| 7 | Adjetivos de tercera, pluscuamperfecto activo | 12 | 69 | 70 | 13 |
| 8 | 4.ª/5.ª declinación, personales | 7 | 76 | 79 | 0 (17 en bloque 8–9) |

El vocabulario por unidad admite repetición entre etiquetas; **los recuentos por fila no se suman** para obtener el total. El banco de Latín de 4.º contiene **506 fichas**: 379 generales y 127 de examen. La morfología contiene **76 modelos**: 26 derivados de paradigmas docentes, 49 reutilizados del banco gramatical latino y un paradigma completo de `bonus`. Son modelos/paradigmas, **no 76 lemas exigibles distintos**.

Se confirman ocho unidades y quince apartados gramaticales en cada lengua, con tablas paralelas; el paso de unidad es acumulativo; los contenidos de perfecto y pluscuamperfecto se presentan por separado y no se incorporan pasivas compuestas antes de tiempo. El módulo de práctica contiene modelos en las ocho unidades y no habilita una UD9. La gramática sigue siendo de consulta, sin ejercicios.

## 3. Incidencias editoriales comprobadas

| ID | Gravedad | Lugar y evidencia | Corrección propuesta |
|---|---|---|---|
| E-01 | Media | Gramática UD5 **valenciano**, tabla de 3.ª declinación: cabecera `Caso`; dos `consonante` y dos `neutro` en encabezados de modelos (fuente `val/sustantivos.html` importada por `thirdNouns`). | `Cas`, `consonant`, `neutre` exclusivamente en el artefacto valenciano integrado. |
| E-02 | Baja | Gramática UD2 **ambas lenguas**, tabla de `puer` y `ager`: título y cuatro encabezados de columna usan las palabras latinas sin cursiva; seis usos por lengua. En el texto explicativo sí constan marcadas. | Envolver únicamente `puer` y `ager` en `<i lang="la">…</i>` en título y cabeceras. Mantener `singular` y `plural` en redonda. |
| E-03 | Baja | Gramática UD7 **castellano**: en el párrafo de adjetivos de tema en consonante `pauper, pauperis` y `dives, divitis` figuran sin cursiva (cuatro voces). La versión valenciana ya marca las cuatro. | Marcar las cuatro formas latinas en la derivación castellana de `adjetivos.html`. |
| E-04 | Media | Práctica de morfología: `teacherRecord` usa `item.lemma` directamente, por lo que la ficha visible presenta `puella`, `servus`, `bellum`, `exercitus` sin genitivo. También hay modelos verbales presentados con primer lema y tiempo, como `amo · presente de indicativo activo`. | Enriquecer el **enunciado de presentación** con nominativo/genitivo o formas principales acreditadas; nunca inventar rasgos ni alterar las formas aceptadas en el corrector. Distinguir abreviaturas didácticas legítimas de omisiones. |
| E-05 | Baja | Vocabulario de examen `UD 8–9`: `tēmpŭs, - ŏris (n.)` contiene un espacio indebido entre guion y sufijo. | Normalizar la representación según el criterio de enunciado aprobado, preferentemente `tempus, temporis (n.)`, preservando `originals`. |
| E-06 | Revisión editorial | Vocabulario de examen `UD 8–9`: `spēs, ei` admite lectura abreviada poco clara. | Preferir `spēs, speī` (o `spēs, -eī` si se aprueba la notación abreviada). Mantener la transcripción original para trazabilidad. |

**No marcar como errata** `audax, -acis` / la notación escolar abreviada `audax, ācis` sin cotejo específico: abreviaciones de este tipo aparecen en diccionarios y no autorizan una enmienda automática. Tampoco se consideran castellanismos los términos `singular` y `plural`, comunes a ambas lenguas.

## 4. Incidencias de coordinación curricular

**C-01 — UD9 y UD10 todavía seleccionables en Vocabula integrado.** El generador de opciones de `Vocabula/app.js` crea los filtros desde las etiquetas del banco sin limitar `lat4` a ocho unidades. Aunque la gramática y la morfología se ciñen a UD1–8, el vocabulario sigue conservando fichas de UD9 y UD10. Se recomienda que la **copia integrada** de Vocabula ajuste el itinerario ordinario de 4.º sin modificar el repositorio independiente ni borrar datos.

**C-02 — bloque de examen «UD 8–9»**. Existen **17 fichas de examen** con esa etiqueta literal, y ninguna etiquetada exactamente como UD8. Dado que el docente no imparte UD9 y UD10, **no dividir ni reasignar automáticamente** este bloque. Alternativas para decisión docente: (a) mantenerlo disponible como bloque opcional expresamente señalado y excluirlo del itinerario ordinario; (b) asignar individualmente a UD8 solo las fichas que el docente confirme, conservando la procedencia y grupo originales.

**C-03 — presentación de vocabulario versus enseñanza de flexión.** Algunas palabras exigibles se introducen léxicamente antes de estudiar su declinación o conjugación (por ejemplo, verbos de UD1 antes del presente morfológico de UD2, o adjetivos léxicos de UD2 antes del tema de adjetivos en UD3). Esto **no es por sí mismo un error**: debe distinguirse adquisición léxica de habilitación de ejercicios de flexión. Los modelos de morfología no se adelantan.

## 5. Plan de subsanación (sin ejecución en esta auditoría)

1. Corregir E-01 a E-03 mediante parches explícitos en el adaptador de ScholaClassica, con pruebas de regresión sobre el HTML efectivamente compilado, para **ambos idiomas**. No modificar el repositorio Appendix original.
2. Establecer una presentación completa y coherente de enunciados para E-04, sin alterar identidades de fichas, respuestas, histórico, sorteos ni correctores. Añadir test que compruebe cursivas solo en palabras latinas y mantenga descriptores gramaticales en redonda.
3. Resolver E-05 y E-06 como propuesta de normalización de vocabulario con fuente persistente, `originals` intacto y pruebas de procedencia, sin aplicar cambios silenciosos.
4. Preparar, para decisión docente, el comportamiento de C-01 y C-02 en la **copia integrada**. Mantener UD9–10 disponibles en la fuente original; evitar que el botón «Todas» las incluya en el currículo ordinario de ScholaClassica sin advertencia.
5. Regenerar la PWA y ejecutar pruebas generales y de navegador y regresión offline/bilingüe antes de cualquier integración y publicación posterior.

**Estado:** auditoría concluida; hallazgos documentados; correcciones no ejecutadas; sin publicación ni alteración de repositorios fuente.
