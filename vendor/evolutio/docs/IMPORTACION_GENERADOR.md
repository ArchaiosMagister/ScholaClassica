# Importación de GeneradorExamenes — 12 de noviembre de 2026

**Fuente:** `ArchaiosMagister/GeneradorExamenes`, archivo `data/fonetica/banco_examenes.json` (revisión `ae96718559e6ce6a6f2216dced7ea47c71ec48b0`). **Destino:** `ArchaiosMagister/EvolucionFonetica`, banco `data/pilot.json`. No se modifica el repositorio de origen.

## Resultado del cotejo

| Concepto | Fichas |
|---|---:|
| Fuente GeneradorExamenes (`APTO_PROPUESTO`) | 655 |
| Banco original EvolucionFonetica conservado íntegro | 282 |
| Coincidencias de étimo entre ambas fuentes | 273 |
| Entradas nuevas de la fuente | 382 |
| Nuevas con segmentación ortográfica completa y unívoca | **240** |
| Nuevas pendientes de revisión editorial / segmentación | **142** |
| Discrepancias de clasificación entre fichas coincidentes | **4** |
| Banco jugable acumulado | **522** |

Las 240 altas se distribuyen por etiqueta de transmisión original: 124 adaptaciones cultas, 114 sin etiqueta explícita, 1 patrimonial y 1 voz regional/histórica. `APTO_PROPUESTO` es **una preselección didáctica, no certificación lexicográfica**. El importador garantiza solo que los cambios anotados reconstruyen la grafía castellana sin introducir cambios inidentificables, respetando los intervalos del texto latino. El docente podrá revisar progresivamente su filología histórica.

Cuando un sustantivo termina en `-um`, se registra siempre **abertura u → o** como norma seleccionable y caída fija de `-m` como operación independiente. La pérdida fija `-m` no equivale a apócope. Las adaptaciones cultas **no** se presentan como transmisiones patrimoniales completas.

## Cuatro conflictos resueltos: conservar las fichas de EvolucionFonetica

Se han conservado las fichas anteriores sin sobrescribirlas:

| Forma | EvolucionFonetica | GeneradorExamenes | Recomendación |
|---|---|---|---|
| *seniorem → señor* | Palatalización `ni → ñ`, apócope final `e` y pérdida fija de `-m` | N13 Palatalización; N16 Síncopa | **Conservar la ficha actual**: la i de `ni` participa en la palatalización, no se duplica automáticamente como síncopa; la e final sí desaparece. |
| *sensum → seso* | Simplificación `-ns- → -s-`, abertura `u → o` y caída de `-m` | N16 Síncopa | **Conservar la ficha actual**: `-ns- → -s-` encaja directamente en la norma oficial de simplificación N15. |
| *sponsam → esposa* | Prótesis `e-`, simplificación `-ns- → -s-` y caída fija de `-m` | N14 Prótesis; N16 Síncopa | **Conservar la ficha actual**: N15 permite tratar `-ns- → -s-` como simplificación. |
| *sponsum → esposo* | Prótesis `e-`, simplificación `-ns- → -s-`, abertura `u → o` y caída fija de `-m` | N14 Prótesis; N16 Síncopa | **Conservar la ficha actual**, por el mismo motivo y por la abertura final confirmada por el docente. |

**Decisión docente del 12 de noviembre de 2026:** conservar las cuatro fichas actuales, sin alterar sus transformaciones ni el banco de GeneradorExamenes. Las anotaciones aprobadas prevalecen frente a las etiquetas originales discordantes.

- *seniorem → señor*: palatalización ni → ñ, apócope de e final y pérdida fija de -m; no contabilizar una síncopa adicional de la i.
- *sensum → seso*: simplificación ns → s, abertura u → o y pérdida fija de -m; no reclasificar el grupo como síncopa.
- *sponsam → esposa*: prótesis e-, simplificación ns → s y caída fija de -m.
- *sponsum → esposo*: prótesis e-, simplificación ns → s, abertura u → o y caída fija de -m.

Las aprobaciones quedan en `data/imports/decisiones-docentes.json`, asociadas a los identificadores y a las firmas de normas de ambas fuentes. La cola `data/imports/revision-generador.json` conserva las cuatro incidencias en `resolvedConflicts`, y mantiene **0 conflictos abiertos y 142 entradas nuevas pendientes**. El sincronizador compara las firmas y, si una ficha o su etiqueta original cambia, vuelve a presentar el conflicto en lugar de aplicar automáticamente una decisión obsoleta.

## Cola de revisión: 142 entradas

`data/imports/revision-generador.json` contiene identificador original, forma latina, resultado castellano, normas N01–N20, vía de transmisión y motivo de que no se incorporase a la práctica. La cola se genera sin interpretar como error las etiquetas originales: a menudo la discrepancia se debe a fenómenos intermedios, posiciones discutibles o información que no se puede inferir del simple par étimo/resultado.

Entre los candidatos pendientes están *advocatum → abogado* (cambios adicionales), *ampullam → ampolla* (valor de `-ll-`), *aquam → agua* (tratamiento de labiovelar), *factum → hecho* (aspiración y palatalización), *gemmam → yema* y *lactem → leche*. Sus alternativas se propondrán en tarjetas razonadas por lotes de revisión docente. No participan en sorteos ni se muestran como fichas con análisis confirmado hasta aprobar su segmentación.

## Reproducción y pruebas

- `data/imports/generador-655.json`: copia inmutable de la fuente en esta revisión.
- `tools/import-generador.mjs`: cotejo sin duplicados, equivalencia de códigos, generación posicional y retención de dudas.
- `tools/sync-generador.mjs`: auditoría reproducible que respeta las decisiones docentes persistentes; opción explícita `--apply`, sin modificar el origen.
- `tests/import-generador.test.mjs`: transformaciones sintéticas, exclusiones, reglas y posiciones.
- `tests/import-generador-integration.test.mjs`: recuentos exactos, huella SHA-256 de las 282 fichas originales, resoluciones persistentes y simulación de corrección de todas las nuevas fichas, incluida la modalidad focalizada.
- `tests/decisiones-docentes.test.mjs`: regresiones de las cuatro decisiones aprobadas, abertura final y caída fija, y reapertura automática al cambiar las etiquetas.

**Nota de seguridad docente:** el motor no inventa respuestas nuevas ni elimina advertencias; copia únicamente `APTO_PROPUESTO`, comprueba coincidencias originales y rechaza grupos no alineables o de segmentación múltiple. Aceptar una solución ortográfica sin ambigüedad no implica que la etimología histórica completa esté probada por el procedimiento automático.
