# Evolutio valenciano: reconciliación y piloto docente de doce fichas (18/11/2026)

**Solo preparación académica. No modifica el generador, la matriz de 522, las 17 normas, el banco castellano ni el acceso del alumnado. No fusionar con `main` ni publicar.** Esta PR depende de la #119 y debe revisarse *después* de resolver las discrepancias señaladas.

## 1. Reconciliación de ramas antiguas

Fuentes congeladas: [PR #45](https://github.com/ArchaiosMagister/ScholaClassica/pull/45), [PR #46](https://github.com/ArchaiosMagister/ScholaClassica/pull/46) y [PR #119](https://github.com/ArchaiosMagister/ScholaClassica/pull/119).

| Estado | PR #46 | PR #119 |
|---|---:|---:|
| Correspondencias léxicas con documentación/contraste | 221 | 120 revisadas + 66 contrastadas sin fonética = **186** |
| Entradas de #46 que la #119 conserva solo como propuestas | — | **38** |
| Entradas de #46 que la #119 deja sin resultado valenciano | — | **3** |
| Conjuntos de normas antes asignados sin traslado a #119 | — | **26** |
| Fichas para práctica | **0** | **0** |

Las **41 discrepancias** (ID, étimo, resultado, estado y reglas de ambas ramas) están archivadas sin editar en [`reconciliacio-pr45-46-119-2026-11-18.json`](../shared/academic/evolutio-valenciano/reconciliacio-pr45-46-119-2026-11-18.json). La reducción de 221 a 186 **no implica 35 errores** ni obliga a promover automáticamente las 41 fichas: responde a alcances de revisión distintos y a reservas posteriores, que deben justificarse individualmente. No se descarta evidencia existente en la #46.

Tres casos se mantienen **sin solución valenciana activa** por las reservas explícitas de la #119: *octo → huit*, *dictum → dit*, *sigĭllum → segell*. Las restantes 38 conservan su propuesta y necesitarán cotejo lexicográfico, normativo o de transmisión antes de mejorar su estado.

**Decisiones docentes de la #45.** Las reglas editoriales de *matrem → mare*, *fabam → fava* y *caballum → cavall* se mantienen en la #119, sin transformar su aceptación escolar en «ficha aprobada para jugar». En *noctem → nit* **sí hay divergencia**: la #45 la calificaba de provisional e incluía `VOC, SIMPL, APOC, FIX_M`; la #119 la clasifica editorialmente como revisada y utiliza `VOC, SIMPL, FIX_M`. La exclusión de `APOC` y la nueva etiqueta requieren confirmación del criterio docente antes de habilitarla. No entra en este piloto.

**Conclusión de integración:** no fusionar las PR #45/#46 sobre #119 ni cerrarlas como «integradas» hasta resolver el destino de cada reserva; mantener todo en ramas separadas.

## 2. Primer piloto: doce formas de deducción sencilla

El fichero [`pilot-candidats-12-2026-11-18.json`](../shared/academic/evolutio-valenciano/pilot-candidats-12-2026-11-18.json) recoge identificadores del banco existente, leyes propuestas, fuentes y bloqueos. Criterios: resultado común, hasta dos leyes seleccionables, relación etimológica registrada en la #119, sin nombres propios ni reservas complejas, sin inventar fases intermedias.

| Étimo | Resultado | Normas seleccionables **propuestas** |
|---|---|---|
| `tĕrram` | terra | — (solo `FIX_M` fija) |
| `pŏrtam` | porta | — (solo `FIX_M` fija) |
| `farinam` | farina | — (solo `FIX_M` fija) |
| `focum` | foc | APÒCOPE |
| `pontem` | pont | APÒCOPE |
| `catenam` | cadena | SONORITZACIÓ |
| `uitam` | vida | SONORITZACIÓ |
| `matrem` | mare | SIMPLIFICACIÓ (criterio docente) |
| `buccam` | boca | OBERTURA + SIMPLIFICACIÓ |
| `cuppam` | copa | OBERTURA + SIMPLIFICACIÓ |
| `aucam` | oca | MONOFTONGACIÓ |
| `cælum` | cel | MONOFTONGACIÓ + PALATALITZACIÓ |

**Valor de las fuentes recuperadas:**
- DCVB, fichas individualizadas que ya registra la #119; ejemplos expresos de *[oca < auca](https://dcvb.iec.cat/results.asp?word=oca)* y *[cel < caelum](https://dcvb.iec.cat/results.asp?word=cel)*. El registro etimológico no demuestra automáticamente cada norma.
- Gran Enciclopèdia Catalana: [sonorización intervocálica](https://www.enciclopedia.cat/gran-enciclopedia-catalana/sonoritzacio), [`boca < bucca` y consonantes geminadas](https://www.enciclopedia.cat/gran-enciclopedia-catalana/c-16), [`copa < cuppa`](https://www.enciclopedia.cat/gran-enciclopedia-catalana/p-7), [vocalismo](https://www.enciclopedia.cat/gran-enciclopedia-catalana/e-6) y [grafía/fonética de *cel*](https://www.enciclopedia.cat/gran-enciclopedia-catalana/s-9). Distinguir leyes generales y ejemplos puntuales de una cadena histórica completa.

Hay deliberadamente tres fichas en que solo opera `FIX_M`: son ejercicios pedagógicamente fáciles para estudiar la correspondencia, pero **no deben usarse para examinar la identificación de una norma seleccionable**. `FIX_M` nunca debe aparecer entre las respuestas elegibles.

## 3. Control de calidad y requisitos de aprobación

En las doce fichas: `normativeDnvIndividualChecked=false`, `completeHistoricalChainCertified=false`, `allSchoolLawsIndividuallyCertified=false`, `approvedByTeacher=false` y `playable=false`.

**Pendientes obligatorios antes de convertirlas en ejercicios:**
1. Consultar el artículo normativo individual vigente de **DNV/AVL** para cada forma, con acepción y grafía; el recuperador no ha permitido acceder de manera fiable a esos artículos, así que no se anotan verificaciones ficticias.
2. Cotejar la explicación de cada cambio escolar, su orden y su segmento Unicode; decidir explícitamente si la prueba histórica disponible basta para ese uso didáctico. Aportar evidencia adicional cuando sea necesario.
3. Pedir aprobación docente del grupo, especialmente de los casos con dos normas, y fijar dificultad.
4. Preparar **otra PR funcional aislada**, con salida valenciana optativa y regresiones de banco, IDs, progreso, castellano, filtros y PWA. No aprovechar directamente los estados editoriales de la #119 como autorización.

La prueba `tests/evolutio-valenciano-pilot12-reconciliacion.test.mjs` comprueba los IDs, correspondencias, normas, dos límites de dificultad, estados no jugables, los 41 desfases y la reserva de *noctem*. La CI completa debe pasar en esta PR dependiente, **sin job de publicación**.

## 4. Límites de alcance

Esta selección no pretende cubrir las 17 normas. Es un primer conjunto pequeño y transparente para contrastar la experiencia docente; más adelante se priorizará cobertura de normas sin introducir artificialmente ejemplos opacos. Toda la revisión se guarda fuera de `public/` y `dist/`.
