# Conciliación individual del vocabulario de examen «UD 8–9» de Latín 4.º

**Fecha:** 14 de noviembre de 2026. **Origen fijado:** `ArchaiosMagister/VocabulaLatinaGraecaque` commit `0e16505b7631298a0448c4160a5d258f82732bfe`. **Destino:** exclusivamente la copia de Vocabula integrada en `ScholaClassica` y el catálogo docente generado en su compilación. Los repositorios independientes no se modifican.

## Criterio de adscripción

Cada entrada de la modalidad **Examen** etiquetada `UD 8–9` se ha cotejado contra una ficha identificada individualmente de la modalidad **General** de Latín 4.º. Solo se reconoce la **UD8** cuando concurren simultáneamente el mismo lema latino, la misma glosa y la etiqueta expresa `UD 8` en la ficha de General.

La unidad léxica docente no se determina exclusivamente por la declinación o conjugación: en la UD8 hay palabras de la 1.ª, 3.ª y otras categorías repasadas de unidades anteriores. Esas entradas están justificadas porque el banco docente **General UD8** las exige literalmente. No se infiere nada de la etiqueta compartida `8–9`.

## Decisiones fundamentadas (17 de 17)

| Nº | Enunciado original de Examen | Clase | Evidencia individual | Decisión |
|---:|---|---|---|---|
| 1 | `adventŭs, -ūs` | cuarta declinación | General UD8 · `ed2a05a5d7fae7d9` | **UD8** · misma glosa `‘llegada’` |
| 2 | `āudāx, ācis` | adjetivo de tercera declinación | General UD8 · `4717c340e2c45e77` | **UD8** · misma glosa `‘audaz, osado’` |
| 3 | `dĭes, -ei (m. y f.)` | quinta declinación | General UD8, UD10 · `ded2e5a70c73dbfd` | **UD8** · misma glosa `‘día’` |
| 4 | `dīvĕs, -itis` | adjetivo de tercera declinación | General UD7, UD8 · `7bc85211cf6eed68` | **UD8** · misma glosa `‘rico/a’` |
| 5 | `ĕpīstŭla, -æ` | primera declinación | General UD2, UD8 · `148a074bd34f2e9e` | **UD8** · misma glosa `‘carta’` |
| 6 | `ĕquĭtātŭs, -ūs` | cuarta declinación | General UD8, UD10 · `7b6bb3e148515c62` | **UD8** · misma glosa `‘caballería’` |
| 7 | `exercĭtŭs, -ūs` | cuarta declinación | General UD8, UD10 · `c3ca3fd4447c1abb` | **UD8** · misma glosa `ejército` |
| 8 | `impĕtŭs, -ūs` | cuarta declinación | General UD8 · `bc5c8f66c70a4b3c` | **UD8** · misma glosa `‘embestida’` |
| 9 | `iŭbĕō, iussī, iussum` | verbo de segunda conjugación | General UD8 · `e5112a9d263ba1d0` | **UD8** · misma glosa `‘ordenar’` |
| 10 | `iussŭs, -ūs` | cuarta declinación | General UD8 · `0e77c4a3bd3fb4f6` | **UD8** · misma glosa `‘orden, mandato’` |
| 11 | `lătŭs, lătĕris (n.)` | tercera declinación | General UD8 · `a3afbc666cc31557` | **UD8** · misma glosa `‘costado, flanco’` |
| 12 | `mercātŏr, -ōris (m.)` | tercera declinación | General UD8 · `fe33758e10892549` | **UD8** · misma glosa `‘mercader, comerciante’` |
| 13 | `nōmĕn, -mĭnis (n.)` | tercera declinación | General UD8 · `13d51bb64877ea5e` | **UD8** · misma glosa `‘nombre’` |
| 14 | `prūdēns, -ntis` | adjetivo de tercera declinación | General UD8 · `432b2f186c48047f` | **UD8** · misma glosa `‘previsor/a’` |
| 15 | `rēs, rĕī` | quinta declinación | General UD8, UD9 · `7851974ab7020695` | **UD8** · misma glosa `‘cosa, suceso, circunstancia, asunto’` |
| 16 | `spēs, ei` | quinta declinación | General UD8, UD9 · `f92433b6694801a5` | **UD8** · misma glosa `‘esperanza’` |
| 17 | `tēmpŭs, - ŏris (n.)` | tercera declinación | General UD7, UD8 · `727e1c56d80b7b4d` | **UD8** · misma glosa `‘tiempo’` |

**Resultado:** 17 asignadas a `Examen · UD 8`; **0 reservadas** por ausencia de evidencia. Este resultado no supone una promoción automática de otros lemas ni autoriza añadir contenidos de UD9–10. Los rótulos de UD9 y UD10 del vocabulario general y otras entradas de examen ajenas al bloque no se han modificado.

## Trazabilidad e implementación

- El identificador `id`, los campos `originals`, `form`, `meaning` y `answers` se conservan; en las dos fichas normalizadas previamente (*spēs* y *tempus*) se respeta la enmienda editorial ya publicada.
- Solo `units` pasa de `["UD 8–9"]` a `["UD 8"]` en las 17 entradas de Examen de la copia integrada.
- Se añade a cada entrada el metadato interno `curricularProvenance`, con la etiqueta original `UD 8–9`, el `id` concreto de su contraparte General, las unidades acreditadas de esta y el criterio académico. No se muestra como mensaje técnico al alumnado.
- El catálogo docente integrado refleja las nuevas unidades operativas; la fuente bloqueada de Vocabula continúa intacta.
- El adaptador `scripts/latin4-ud8-reconciliation.mjs` falla de forma explícita si falta alguna contraparte, si cambia la glosa, si no figura la UD8, si cambia el contenido del bloque o si surge una nueva entrada sin revisar. **No se completan formas morfológicas por analogía ni se altera ningún corrector.**

## Comprobaciones requeridas

1. El banco sigue con **2055 fichas**, de las que **506** son de Latín 4.º; las **17 entradas de Examen** resultan seleccionables al marcar exclusivamente `UD 8`.
2. El filtro `UD 8–9` deja de aparecer en la modalidad Examen; no cambia el número de fichas de General UD8, ni las etiquetas UD9/UD10 fuera de estas 17.
3. Se preservan los `id` de seguimiento local, traducciones, formas, respuestas y transcripciones originales.
4. Se comprueba que el selector de unidades, la vista de diccionario, la práctica y la PWA offline de la copia integrada usan el nuevo banco. También deben mantenerse las pruebas generales, las de Chromium y la seguridad docente.

**Estado:** revisión individual concluida. Implementación en rama de integración, pendiente del resultado de CI y de autorización para integrar/publicar.
