# Auditoría transversal: Latín I y Griego I

**Fecha:** 14 de noviembre de 2026  
**Tipo:** auditoría documental y estática; **no altera código ni datos publicados**.  
**Repositorio integrado:** `ArchaiosMagister/ScholaClassica`, commit base `d68a28d6a648d3644bbbbc67cdf1814bd1b531b8`.  
**Fuentes bloqueadas:** `Appendix-grammaticae@a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c` y `VocabulaLatinaGraecaque@0e16505b7631298a0448c4160a5d258f82732bfe`.

## Objetivo y límites

Contrastar **gramática (castellano/valenciano)**, **práctica morfológica** y **vocabulario general/exigible** de Latín I y Griego I. La gramática es un **material de consulta, sin ejercicios**; las prácticas pertenecen a sus aplicaciones respectivas. La revisión examina los contenidos inmutables realmente integrados en ScholaClassica y las pruebas de progresión curricular existentes. No se modifica Appendix ni Vocabula, ni se publica nada con esta auditoría.

Este informe distingue:
- **Confirmado:** discrepancia verificable directamente en los materiales.
- **Pendiente de cotejo filológico individual:** información documentada cuya validez de cada forma no ha sido certificada una a una.
- **Decisión docente:** caso en el que una reasignación curricular no se infiere del código o de una semejanza léxica.

## Inventario y concordancia básica

| Indicador | Latín I | Griego I |
|---|---:|---:|
| Unidades gramaticales | 10 | 14 |
| Temas gramaticales por idioma | 30 | 28 |
| Tablas de gramática en castellano | 30 | 50 |
| Tablas de gramática en valenciano | 42 | 50 |
| Modelos de práctica morfológica | 89 | 92 |
| Fichas de vocabulario total | 856 | 503 |
| Vocabulario general | 741 | 332 |
| Vocabulario de examen | 115 | 171 |

- En **Griego I**, los 28 temas tienen **paridad estructural completa de tablas y filas** entre idiomas: 50 tablas y 381 filas en cada uno. Eso no prueba por sí solo identidad filológica de las grafías.
- En **Latín I**, hay 12 tablas adicionales en valenciano. Se concentran en **UD4** (0 tablas castellanas / 7 valencianas) y **UD5** (2 / 7); la diferencia es una **presentación no equivalente por unidades**, no evidencia de una pérdida en los capítulos autónomos del Appendix.
- No se detectan etiquetas `form`, `input` o `button` en los temas gramaticales curriculares de los dos cursos, en ninguna lengua: sigue respetándose la separación entre consulta y ejercicios.
- Las pruebas automatizadas existentes de `tests/morphology-vocabulary-reconciliation.test.mjs` comprueban 89 fichas latinas y 92 griegas y declaran que ninguna carece de candidatos para reconocimiento, análisis o respuesta escrita. La ausencia de tabla nominal en verbos o infinitivos es intencionada y **no** una incidencia.

## Incidencias confirmadas: prioridad alta

### A1. Latín I: cuatro apartados castellanos contienen solo enlaces al capítulo autónomo

Comparación directa de `assets/curriculum.json` y `val/curriculum.json` del Appendix fijado:

| Unidad y apartado | Castellano | Valenciano |
|---|---|---|
| UD3 · Adjetivos sustantivados | Aviso + enlace a `adjetivos.html`, sin explicación en la ficha | Texto y ejemplos desarrollados en la ficha |
| UD4 · Tercera declinación | Aviso + enlace a `sustantivos.html`, sin paradigmas en la ficha | Explicación y tabla de cuatro paradigmas |
| UD4 · Perfecto y pluscuamperfecto activos | Aviso + enlace a `indicativo.html`, sin paradigmas en la ficha | Desarrollo y seis tablas (dos activas, dos pasivas y dos de `sum`) |
| UD5 · Adjetivos de tercera declinación | Aviso + enlace a `adjetivos.html`, sin paradigmas en la ficha | Desarrollo y cinco tablas |

Los capítulos enlazados existen en la fuente y se copian a ScholaClassica, por lo que no se deben etiquetar como páginas inexistentes. **El problema es curricular y de usabilidad**: la misma unidad ofrece contenido sustantivo diferente según el idioma. La adaptación de 4.º ya demuestra la viabilidad técnica de derivar capítulos completos sin tocar el original.

**Riesgo offline confirmado por configuración:** `scripts/build-gramatica-pwa.mjs::GRAMMAR_CORE` precarga `curso.html`, índices, JS, CSS y currículos, pero **no** incluye `adjetivos.html`, `sustantivos.html` ni `indicativo.html`. El service worker tampoco los incorpora al caché dinámicamente; por tanto, los enlaces de estas fichas **no están garantizados sin conexión**.

**Propuesta:** incorporar los extractos pertinentes **solo en las copias de Latín I** de ScholaClassica para ambas lenguas, con revisión de progresión y pruebas PWA, o, alternativamente, precargar explícitamente los capítulos si se prefiere conservar los enlaces. La primera opción evita perder el contexto de unidad.

### A2. Latín I, UD4: anticipo del perfecto y pluscuamperfecto pasivos en valenciano

El tema de la UD4 se titula **«Perfet i plusquamperfet actius»**, pero contiene un párrafo que describe la pasiva con participio perfecto + `sum` y dos tablas `Paradigma · veu passiva`, con formas como `amatus sum`. Los tiempos pasivos compuestos se desarrollan después en **UD9**. Es una introducción anticipada en el material, no una incorporación anticipada demostrada en el sorteo morfológico.

**Propuesta:** limitar el cuerpo de UD4 a los tiempos **activos**, manteniendo `sum` en el contexto correspondiente y reservando las construcciones pasivas compuestas para la unidad posterior. Replicar el criterio en castellano al completar el apartado A1. El adaptador de 4.º ya separa activas y pasivas; no copiar todo el capítulo indiscriminadamente.

## Erratas de ortotipografía y equivalencia de tablas

### A3. Latín I, UD1: títulos de `puer` y `ager` sin cursivas

En **ambas** lenguas, la leyenda de la tabla «Segunda declinación · puer y ager» y los cuatro encabezados `puer · singular/plural` y `ager · singular/plural` dejan los lemas latinos en redonda. Son **seis apariciones léxicas por idioma**. La corrección ya existe para la **copia derivada de 4.º**, pero **no** modifica los currículos originales de Latín I.

**Propuesta:** trasladar esa corrección editorial a las copias integradas de Latín I.

### A4. Latín I, UD3: tabla de pronombres personales asimétrica

- **Castellano:** los encabezados indican persona, número y traducción, pero `ego`, `tu`, `nos`, `vos` están en redonda.
- **Valenciano:** esos lemas están en `<i lang="la">…</i>`, pero los encabezados **no** explicitan las personas y números como en castellano.

**Propuesta:** encabezados paralelos que expresen persona, número, traducción apropiada y solo las formas latinas en cursiva.

### A5. Latín I, UD6: título «Relativo» en valenciano y `quod` sin cursiva

El encabezado de la tabla contiene, en ambos idiomas, `Relativo · <i>qui</i>, <i>quæ</i>, quod`. En valenciano corresponde **«Relatiu»**, y `quod` debe recibir el mismo marcado `lang="la"` y cursiva que los otros dos términos.

### A6. Latín I, UD7: `sum, esse` en redonda en la leyenda del futuro

En ambas lenguas la leyenda `sum, esse · futuro imperfecto` / `futur imperfet` no aplica cursiva a `sum, esse`. Mantener el descriptor del tiempo en redonda.

### A7. Griego I, UD5: falta el espíritu suave de `ἀγαθή`

En **ambos** currículos, el enunciado del adjetivo de primera clase aparece en una descripción de tabla como `ἀγαθός, αγαθή, ἀγαθόν`. La forma femenina correcta es **`ἀγαθή`**, con espíritu suave. Está acreditada por el **Centro de la Lengua Griega** (https://www.greek-language.gr/greekLang/ancient_greek/tools/lexicon/lemma.html?id=125) y el paradigma lexicográfico (https://el.wiktionary.org/wiki/ἀγαθός). No supone cambiar una flexión almacenada en el corrector; la incidencia localizada es de **encabezado visible**.

**Propuesta:** corregir exactamente esa grafía en ambas copias integradas; añadir prueba comparativa en el encabezado sin modificaciones automáticas masivas al griego politónico.

## Cuestiones curriculares que no deben corregirse por inferencia

### C1. Vocabulario de Latín I: etiquetas que exceden las diez unidades

Existen **140 fichas del vocabulario general** con la etiqueta `UD 11–12`, mientras la gramática de Latín I termina en la UD10. Pueden ser fichas también asignadas a otras unidades. La modalidad de examen tiene **115** fichas y etiquetas explícitas de UD1 a UD7, **ninguna** de UD8–10. No cabe concluir sin criterio docente que faltan palabras de examen, ni eliminar las 140 del origen.

**Propuesta:** revisar si el alumnado debe ver `UD 11–12` como material complementario; y confirmar si la ausencia de examen UD8–10 es deliberada. Cualquier ocultación se aplicaría solo a la interfaz integrada.

### C2. Vocabulario de Griego I: bloque sin adscripción y examen hasta UD10

El general contiene **184 fichas** marcadas `Sin unidad acreditada`; no pertenecen automáticamente a ninguna unidad ni al banco exigible. La modalidad de examen tiene **171** fichas en bloques y grupos (`UD 1–4`, `UD 5`, `UD 6–7`, `UD 8`, `UD 9`, `UD 10`, `Palabras básicas`, `Preposiciones`). No hay etiquetas de examen específicas de **UD11–14**, aunque la gramática continúa hasta la UD14.

**Propuesta:** preservar los bloques exactos y las 184 fichas sin unidad. Consultar el criterio docente antes de crear exigibles por unidad para los temas finales.

### C3. Nueve paradigmas nominales griegos pendientes de revisión individual

La importación `compileGreekExigibleNounBatch` incorpora nueve sustantivos documentados por diez casillas cada uno (`ἀρχή`, `στρατηγός`, `ἐπιστολή`, `κεφαλή`, `μάχη`, `πέτρα`, `οὐρανός`, `ὅπλον`, `φόβος`). Las pruebas los aceptan en el motor y verifican concordancia interna, **pero sus metadatos conservan explícitamente** la nota `pendiente de revisión docente individual`.

**Propuesta:** realizar una revisión filológica específica de esas 90 casillas y separar claramente **tabla documentada** de **forma individualmente comprobada**. El estado de verificación actual no autoriza a describir las 90 formas como certificadas individualmente.

### C4. Vocabulario no es idéntico a elegibilidad morfológica

Los enunciados de vocabulario pueden adelantarse para comprensión léxica (ej. verbos o adjetivos latinos antes del tema de inflexión). No se debe exigir que su primera aparición léxica coincida con la primera unidad de práctica de sus flexiones. Las pruebas `availableRecords` siguen siendo la referencia de elegibilidad y deben conservarse.

## Orden de intervención propuesto

1. **Corregir A1 y A2 juntas**: contenidos de Latín I sin saltos a capítulos completos y sin adelantar las pasivas compuestas. Añadir una comprobación de modo offline en esos cuatro apartados.
2. **Corregir A3–A7**: etiquetas, cursivas y el espíritu de `ἀγαθή`, con pruebas de equivalencia ES/VAL y una comprobación visual en iPad y Chromium.
3. **Cotejar C3**: noventa formas de nueve sustantivos griegos, con decisiones filológicas rastreables.
4. **Presentar las decisiones C1 y C2** en tarjetas docentes, sin reasignaciones automáticas.
5. Auditoría de cierre: cotejar las tablas bilingües, casos/morfología, diccionario de Vocabula, PWA offline y regresiones completas antes de pedir publicación.

## Pruebas y estado

Este informe se basa en lectura de fuentes bloqueadas, cotejo programático de estructura de los currículos y examen del código y las pruebas del motor. **No se han modificado los artefactos de alumnado ni ejecutado en esta tarea nuevas baterías de navegador**. La última validación automatizada de la rama principal (antes de esta auditoría) fue satisfactoria, pero no prueba que las erratas editoriales A1–A7 estén resueltas: son el resultado de esta revisión estática.

**Estado de entrega:** hallazgos confirmados y plan de corrección preparado; **sin cambios de código ni publicación**.
