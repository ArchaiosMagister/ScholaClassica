# Evolutio · Evolución fonética (Latín → castellano)

Webapp autónoma para **estudiar y practicar** las **20 normas oficiales de evolución fonética PAU** facilitadas por el docente. Repositorio distinto de VocabulaLatinaGraecaque y GeneradorExamenes.

## Prueba la webapp

Web publicada: <https://archaiosmagister.github.io/EvolucionFonetica/> (GitHub Pages).

En **Practicar** se puede elegir entre repaso general (filtro estricto de todas las normas necesarias) y **repaso de una sola norma** (filtrado por presencia de esa norma). Después se elige la modalidad (guiada o a ciegas) y el número de tarjetas. Cada tarjeta ofrece **hasta tres intentos para el resultado castellano** y, si se acierta, **hasta tres comprobaciones para identificar las normas**. En ambas fases el alumno puede pulsar «No lo sé · Ver solución» sin esperar a fallar; después de tres fallos la solución aparece automáticamente. Siempre puede pasar a la siguiente ficha tras consultar la explicación. Las soluciones mostradas nunca cuentan como aciertos. La **-m final de acusativo** se trabaja como norma fija, nunca como «apócope» seleccionable.

## Desbloqueo de las tarjetas de práctica (12/11/2026)

La práctica nunca bloquea al alumno de manera indefinida. **Decisión didáctica**: tres intentos por fase y botón permanente «No lo sé · Ver solución». No se generan pistas individualizadas por palabra; las fichas emplean las **respuestas y anotaciones ya revisadas**. En la fase del resultado, tres errores muestran directamente toda la evolución; en la fase de normas, tres comprobaciones fallidas revelan las normas sin atribuirlas al alumno. La consulta es voluntaria desde el primer intento.

El resumen final distingue las fichas acertadas a la primera, las completadas tras fallos y las reveladas. Se conserva el progreso de la sesión hasta pasar a la siguiente palabra y los análisis originales del banco; no se inventan reglas. Los avisos muestran texto además de color y una animación breve de fallo, desactivada con `prefers-reduced-motion`. Pruebas: `tests/reveal.test.mjs`, `tests/engine.test.mjs` y `tests/static.test.mjs`.

## Grafía escolar latina: u consonántica (12/11/2026)

Todas las **522 fichas** mantienen su contenido y sus análisis, pero las **34 formas latinas que contenían «v»** se han escrito con **«u»**: `uitam → vida`, `clauem → llave`, `uerrucam → verruga`, `uiuite → vivid`. Esta es una convención ortográfica de presentación del latín (la `u` puede tener valor vocálico o consonántico); no se modifican las formas castellanas ni se incorpora automáticamente una norma nueva a las fichas.

El cambio es persistente en `data/pilot.json`, en los ejemplos didácticos y en `tools/import-generador.mjs` para evitar regresiones al sincronizar. El original de GeneradorExamenes y sus metadatos se conservan intactos como evidencia de procedencia; las nuevas importaciones se adaptan a `u`. Las búsquedas en Estudiar aceptan tanto `vitam` como `uitam`, sin convertir las `v` castellanas. Las posiciones de los cambios fonéticos, las 20 normas y las dificultades son las mismas, pues `v` y `u` ocupan una sola posición Unicode. La auditoría se encuentra en `tests/latin-orthography.test.mjs`.

## Importación desde GeneradorExamenes (12/11/2026)

**522 fichas jugables:** las 282 anteriores se conservan sin modificación y se incorporan 240 entradas nuevas de `ArchaiosMagister/GeneradorExamenes/data/fonetica/banco_examenes.json`, cotejadas contra la fuente de **655** fichas `APTO_PROPUESTO`.

- **273 coincidencias** entre ambos repositorios (sin duplicar); **382 entradas nuevas** en el origen.
- De las 382, **240** admiten una segmentación ortográfica completa y **unívoca** con las 20 normas; se incluyen con sus posiciones y la etiqueta original de transmisión. La pérdida fija de `-m` y la abertura de `-u-` en `-um` se anotan por separado.
- **142** entradas tienen fenómenos que no se pueden segmentar sin juicio filológico o su reconstrucción no coincide exactamente con el resultado; se conservan en la cola, fuera del sorteo.
- Existen **4 diferencias de clasificación** en palabras coincidentes; están documentadas como conflictos, sin sobrescribir la ficha existente. No se alteró `GeneradorExamenes`.
- El estado `APTO_PROPUESTO` **no implica certificación filológica**. La importación automática verifica la correspondencia textual y el lugar de los grupos, no toda la historia de transmisión. Las adaptaciones cultas se etiquetan explícitamente para no confundirlas con palabras patrimoniales.
- `data/imports/generador-655.json`: copia íntegra y trazable del banco fuente en la revisión consultada; no es un segundo banco jugable.
- `data/imports/revision-generador.json`: cola de 142 entradas pendientes y 4 conflictos, para decisiones docentes posteriores.
- `tools/import-generador.mjs`: normalización de ligaduras, cotejo sin duplicados, segmentación conservadora y extracción de conflictos; `tools/sync-generador.mjs` permite reproducir la importación con una copia actualizada.
- `tests/import-generador*.test.mjs`: pruebas de trazabilidad, preservación del banco anterior, filtrado general/focalizado y corrección completa de las 240 fichas.

Consultar `docs/IMPORTACION_GENERADOR.md` para el inventario, las decisiones y los criterios. La revisión editorial se realiza por lotes y las entradas pendientes no se sortean.

## Repasar una sola norma

En **Practicar → Una sola norma**, el alumno selecciona una de las **20 normas oficiales**. El desplegable muestra cuántas palabras del banco revisado contienen cada categoría. Si escoge una sola norma, aparecen también palabras que incluyen otros fenómenos: por ejemplo, `focum → fuego` es elegible para diptongación aunque también tenga sonorización, abertura y caída fija de `-m`. No se añaden fichas dudosas ni se modifica el banco.

- **Repaso general (sin cambios):** una palabra es elegible únicamente si **todas** sus normas seleccionables están incluidas entre las marcadas. La caída fija de `-m` sigue siendo independiente de la apócope y se evalúa cuando corresponde.
- **Repaso de una norma:** se incluyen **todas las palabras que contienen** la norma seleccionada, sin exigir la selección de otras. El límite de tarjetas se ajusta al número disponible, sin alterar el criterio ni duplicar entradas.
- **Fase 1:** el resultado castellano se puede intentar hasta tres veces. Tras tres errores, o con «No lo sé · Ver solución», se presenta el resultado y la evolución completa. La ficha no cuenta como acertada. En repaso focalizado sigue disponible la pista opcional con los nombres de otras normas.
- **Fase 2:** en guiado se marcan únicamente los grupos y puntos de inserción de la norma elegida; en a ciegas el alumno localiza los tramos. «Comprobar todo» **solo corrige las apariciones de esa norma**, incluidas varias dentro de una misma palabra. Hay hasta tres comprobaciones con al menos una norma elegida. Si ninguna norma está seleccionada, comprobar no consume un intento. Tras tres comprobaciones fallidas, o al pulsar «No lo sé · Ver solución», se revela la explicación; los cambios no identificados **no se contabilizan como aciertos**. Las normas ajenas y la pérdida fija de `-m` siguen sin evaluarse en el repaso focalizado.
- **Al finalizar:** la explicación muestra **todos** los cambios de la palabra; cuando se ha revelado la solución, aparece una señal de fallo discreta y compatible con movimiento reducido. El resumen distingue **sin errores**, **resueltas tras intentos** y **solución consultada**; las reveladas no se suman a los aciertos.
- Desde **Estudiar → Catálogo de normas** existe el botón **«Practicar esta norma»**. Respeta el estado de una práctica en curso y solicita confirmación antes de sustituirla por otra sesión.
- El selector claro/oscuro/OLED, las funciones táctiles, la memoria de sesión al alternar Estudiar/Practicar y los recursos offline permanecen sin cambios.

**Comprobaciones:** `tests/focus-practice.test.mjs` valida el filtrado de las 20 categorías, el bloqueo entre fases, la separación de las normas fijas, los grupos, las inserciones, las respuestas extra, las apariciones múltiples (`lupum`, dos aberturas), y la preservación del repaso general. Se han ejercitado los recorridos completos en Chromium con una simulación DOM a 320, 375, 768 y 1280 píxeles; esto no sustituye a una prueba en iOS físico.


## Cuatro niveles de dificultad didáctica (12/11/2026)

**522 fichas clasificadas provisionalmente**, sin modificar las anotaciones de `data/pilot.json`. La clasificación vive en `data/difficulty.json` y se carga tanto en **Practicar** como en **Estudiar**. En **Practicar** y **Estudiar**, cuatro botones independientes permiten seleccionar cualquier combinación de niveles, con accesos rápidos «Todas» y «Ninguna». Una marca visible **✓** destaca cada nivel activo, también en los temas oscuro y OLED. Las selecciones de ambos modos son independientes. Se combinan con las normas del repaso general y focalizado, la búsqueda y los subtipos del catálogo. Las fichas muestran su nivel.

| Nivel | Etiqueta | Fichas |
|---|---|---:|
| 1 | Fácil | 101 |
| 2 | Medio | 282 |
| 3 | Difícil | 115 |
| 4 | Muy difícil | 24 |

**Criterio inicial automatizado, pendiente de revisión docente**: número de transformaciones seleccionables, diversidad y rareza de fenómenos, reiteraciones e interacción de fragmentos. La pérdida fija de `-m` final **no incrementa** la dificultad. Es un indicador pedagógico, no una certificación filológica ni una reconstrucción adicional. Entre los ejemplos reales del banco, `bŏnam → buena` queda en el nivel 1 y `annuculum → añojo` en el 4.

Para regenerar: `npm run difficulty:build`; para verificar coherencia: `npm run difficulty:check`. La generación conserva los registros marcados explícitamente con `origin: "docente"`, permitiendo revisiones manuales persistentes sin alterar el banco. Los registros generados tienen `origin: "automatico"`. Las pruebas incluyen integridad de 522 asignaciones, filtros exactos y acumulativos y su interacción con ambas modalidades de práctica. El nuevo JSON y su módulo están incluidos en el precaché offline de la PWA.

## Botón de actualización de la webapp (12/11/2026)

En la cabecera, junto al selector de aspecto, se añade **«↻ Actualizar»**. Al pulsarlo con conexión, se comprueba si hay nueva versión mediante `ServiceWorkerRegistration.update()`; cuando haya un worker en instalación se espera a que se active antes de recargar. Si no existe registro o el navegador no admite service workers se recarga igualmente. Los errores de red o instalación se muestran sin afirmar que haya una actualización. **Antes de recargar una práctica en curso**, se pide confirmación: la sesión no se guarda de forma permanente. El comportamiento es compatible con el funcionamiento sin conexión de la PWA, pero la búsqueda de actualizaciones requiere conexión.

## Barajado de tarjetas de estudio (12/11/2026)

Al abrir **Estudiar**, las fichas disponibles aparecen en orden aleatorio, no alfabético. El orden de la tanda permanece estable al pulsar «Mostrar más», consultar una tarjeta o regresar al listado; la navegación anterior/siguiente utiliza exactamente ese orden. En el buscador, cuando se escribe una consulta, se mantiene la prioridad de coincidencias exactas; el botón **«Barajar tarjetas»** permite mezclar también los resultados de esa consulta. El catálogo por normas y subtipos utiliza igualmente el barajado. No se modifican el banco, las explicaciones, los filtros ni la corrección de **Practicar**. El nuevo comportamiento se incluye en la caché offline.

## Modo Estudiar (consulta sin corrección)

La portada conserva **Practicar** y añade **Estudiar** como secciones independientes. Cambiar de sección no borra una sesión de práctica en curso: sus selecciones y respuestas quedan en memoria mientras la pestaña siga abierta. El modo Estudiar no asigna notas ni modifica la lógica de evaluación: solo baraja el orden de presentación de las fichas.

- **Buscador bidireccional:** localiza las fichas anotadas disponibles por forma latina o resultado castellano, con coincidencias parciales y tolerancia a mayúsculas, ligaduras `æ/ae`, `œ/oe`, cantidades vocálicas y tildes **solo en la búsqueda**. La corrección estricta del modo Practicar no cambia. La lista se pagina sin perder resultados.
- **Catálogo de normas:** presenta exactamente las 20 categorías oficiales, sus definiciones y ejemplos tal como figuran en `src/rules.mjs`. Indica las fichas del banco que contienen cada norma, incluso si requieren otras transformaciones para llegar al castellano. Las normas fijas se consultan dentro de las fichas, no como categoría número 21.
- **Subtipos documentados:** cuando el banco incluye subtipos, pueden filtrarse desde el catálogo (p. ej. `-ct- > -ch-`, `-CUL- > -J-` y `-CUL- > -G-`). Nunca se deducen ejemplos nuevos a partir de una regla.
- **Tarjetas filológicas interactivas:** resultado visible, botones para recorrer cada transformación, letras/grupos originales resaltados según posiciones Unicode de la ficha, puntos de inserción `＋`, tramos discontinuos, nota de la transformación, etapas intermedias **solo cuando están anotadas**, definición oficial, resumen del banco y referencia a fila y lote del Excel. Navegación entre fichas de la consulta sin volver a buscar.
- Las fichas marcadas como pendientes en `docs/REVISION.md` siguen fuera del banco y del buscador; no se generan etimologías ni explicaciones nuevas.
- Módulo puro `src/study.mjs` separado de la evaluación; comprobaciones automáticas en `tests/study.test.mjs`. El recurso está incluido en la caché offline de la PWA.

### Comprobaciones

Ejecutar `npm test` (incluye búsqueda, catálogo, subtipos, resaltado, integridad del banco y ausencia de regresiones de práctica). La interfaz ha sido probada mediante una simulación DOM en Chromium para anchuras de escritorio y móvil. La navegación real a `http://localhost` y a `file://` está bloqueada en el navegador de este entorno; no equivale a una prueba en iOS físico.

## Inicio local y pruebas

```bash
python3 -m http.server 8000
# Abrir http://localhost:8000
npm test
```

No hay paquetes de producción ni compilación. JavaScript nativo, HTML y CSS compatibles con GitHub Pages. El service worker almacena la web y el banco para lectura sin conexión después de la primera visita. El ámbito PWA es relativo y funciona bajo la ruta `/EvolucionFonetica/`.

## Fuentes y ampliaciones

- `data/pilot.json`: banco acumulado anotado (522 fichas: 282 procedentes del Excel y 240 añadidas desde GeneradorExamenes) con trazabilidad por fuente. Los 282 registros anteriores permanecen íntegros.
- `src/rules.mjs`: exactamente las 20 categorías oficiales; incluye subtipos de -CUL- > -J- y -CUL- > -G-.
- `src/engine.mjs`: filtrado estricto y focalizado por norma, corrección y validación de rangos; los fragmentos solapados son legítimos.
- `src/app.mjs`: interfaz, selección táctil, inserciones y navegación.
- `tests/engine.test.mjs`: pruebas de integridad, corrección, progreso y regresiones.
- `docs/COBERTURA.md`: cobertura real y palabras por norma.
- `docs/REVISION.md`: discrepancias con el Excel y cuestiones que necesitan revisión filológica.

**Importante:** el Excel original no se modifica ni se incorpora íntegramente al repositorio; se utiliza para preparar lotes pequeños con anotaciones revisadas. Para ampliar el banco, añadir registros con nuevos ID y rangos Unicode correctos, mantener todos los fenómenos exigibles y ejecutar `npm test`. La publicación automática sólo se realiza cuando el trabajo de GitHub Actions aprueba las pruebas.

**Revisión específica:** `miraculum → milagro` incorporada con el subtipo -CUL- → -G- y seis cambios anotados. La explicación está documentada en `docs/REVISION.md`.

## Limitaciones del banco actual

- Cada palabra presenta los cambios indicados por las normas didácticas del corpus, no una reconstrucción histórico-fonética exhaustiva de cada etapa del latín al romance.
- Todas las categorías tienen al menos un ejemplo; algunos **subtipos** de palatalización, simplificación, grafías griegas quedan pendientes de incorporación segura; los subtipos -CUL- → -J- y -CUL- → -G- ya están representados.
- No hay servidor, cuentas de alumnado ni estadísticas persistentes; el resumen pertenece a la sesión actual.
- La interfaz está preparada para pantallas táctiles; las pruebas automáticas de lógica no equivalen a certificación manual en cada dispositivo físico.

## Interacción y temas (versión piloto 1.1)

- **Aspecto:** Claro, Oscuro y OLED (fondo negro puro), seleccionables desde la cabecera. La preferencia se conserva en `localStorage` y cambia también el color de la barra del navegador.
- **Fase 2 guiada:** cada fragmento tiene una tarjeta con su selector de norma dentro. Las respuestas permanecen sin corregir hasta pulsar **«Comprobar todo»**. Las asociaciones con grupos solapados se comprueban contra su objetivo exacto.
- **Fase 2 a ciegas:** se marcan letras o puntos `+`, se pulsa **«Añadir cambio»** y se elige la norma en esa tarjeta. Se pueden añadir, quitar o modificar cambios y también marcar fragmentos no contiguos.
- La corrección es **conjunta**: se señalan respuestas incorrectas o pendientes sin borrar las elecciones del alumno; no se avanza si faltan cambios o sobran asociaciones erróneas. Las normas fijas siguen separadas del filtrado.
- En móviles, el selector de fragmentos se desplaza horizontalmente para no partir grupos de letras.


## Confirmación visual de aciertos (piloto 1.2)

- Al pulsar «Comprobar todo» y **acertar todos los cambios**, aparece un aviso «¡Todas las normas correctas!» y una animación breve de confeti decorativa, sin bloquear la navegación. No se muestra confeti en correcciones incompletas ni al reintentar. Se respeta `prefers-reduced-motion` (sin animación cuando el usuario solicita movimiento reducido).
- Cuando una palabra contiene pérdida de -m final de acusativo, la opción **«Pérdida fija de -m final» aparece al comienzo de las normas del desplegable**, tras el texto inicial «Selecciona una norma…». Para las palabras sin este fenómeno, la opción no aparece. El filtrado de las 20 normas seleccionables permanece inalterado.

## Ampliación de vocabulario: segundo lote de 100 fichas

- El banco pasa de **52 a 152 palabras**, sin eliminar ni modificar ninguna ficha del primer lote.
- Se han incorporado **100 entradas de las diez tandas** del Excel; cada una lleva asignadas las letras o grupos exactos, subtipos de norma cuando procede, explicación y referencia a fila.
- El lote aporta ejemplos de 17 normas; las 20 siguen representadas acumuladamente.
- `data/batches/2026-11-12-100.json`: manifiesto de las 100 incorporaciones y huella de integridad del banco anterior.
- `docs/LOTE_100.md`: relación completa de las nuevas fichas y cuadro de cobertura.
- `tests/batch-100.test.mjs`: pruebas de conservación del primer lote, modo guiado/a ciegas, filtros, grupos y acumulación de datos.

El nombre `data/pilot.json` se conserva por compatibilidad con la PWA instalada; el contenido ya es el banco acumulado. Se incrementa la versión de caché offline para que las instalaciones reciban las palabras nuevas.

## Ampliación III: 100 fichas adicionales (252 en total)

- Incorporadas otras **100 entradas patrimoniales** de las diez tandas del Excel, sin repetir las anteriores.
- Refuerzo de palatalización en grupos `-ni-`, `-gn-`, `-mn-`, `-nn-`, `-ct-`, `-li-`, `-di-`, `-ti-`, `pl-`, además de simplificaciones, diptongaciones, abertura y `-CUL-`.
- No se fuerzan como patrimoniales los ejemplos de grafías griegas catalogados como cultismos: siguen siendo ejemplos de referencia de la norma, no fichas nuevas del sorteo.
- `data/batches/2026-11-12-100-tercero.json`: trazabilidad del lote y huella SHA-256 de las 152 palabras anteriores.
- `docs/LOTE_100_TERCERO.md`: 100 nuevas fichas, reglas, subtipos, filas del Excel y cobertura acumulada.
- `tests/batch-100-third.test.mjs`: validación de 100 fichas en ambos modos de corrección conjunta y preservación del banco anterior.
- `tools/build_batch3.py` y `tools/selected_batch_3_rows.py`: especificaciones de anotación manual para preparar este lote desde la extracción del Excel. No se ejecutan en producción.

El archivo `data/pilot.json` conserva su nombre por compatibilidad con el service worker y la web instalada.

## Ampliación IV: 30 ejemplos nuevos para normas escasas (282 en total)

Se han añadido 30 entradas del Excel docente, revisadas y anotadas en posiciones originales, sin duplicados y con huella de integridad de las 252 anteriores. Se priorizan vocalización, epéntesis, grafías griegas, consonantización, metátesis, -MIN- > -MBR-, -CUL- > -G- y simplificación. No se inventan fichas de aféresis/asimilación/disimilación cuando no hay candidatas seguras.

- `data/batches/2026-11-12-normas-escasas.json`: manifiesto con filas y normas.
- `docs/LOTE_30_ESCASAS.md`: inventario, notas de filología histórica y fuentes.
- `tests/priority-30.test.mjs`: pruebas de integridad y funcionamiento en práctica general, focalizada y Estudiar.
- `tools/build_scarce_batch.py`: transcripción explícita de las 30 fichas; requiere la extracción del Excel del profesor y un banco base de 252 palabras.

La versión de la caché de la PWA se incrementa para que el nuevo vocabulario llegue a los dispositivos instalados.


## Decisiones docentes sobre el cotejo con GeneradorExamenes (12-11-2026)

Aprobadas como **conservar** las fichas de *seniorem → señor*, *sensum → seso*, *sponsam → esposa* y *sponsum → esposo*, sin modificar sus análisis. En particular, *-ns- → -s-* se sigue clasificando como simplificación; *seniorem* mantiene su palatalización y apócope final. En las formas en *-um* son independientes la abertura *u → o* y la caída fija de *-m*.

El registro persistente está en `data/imports/decisiones-docentes.json`; el sincronizador `tools/sync-generador.mjs` aplica únicamente las decisiones cuyas firmas sigan concordando y reabre cualquier discrepancia posterior. Quedan **142 entradas nuevas pendientes**, y las cuatro incidencias resueltas se documentan sin borrarlas del historial. El banco jugable sigue teniendo **522 fichas**.
