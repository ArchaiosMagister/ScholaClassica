# Ampliación de repaso de sintaxis — candidaturas pendientes de aprobación
**Fecha:** 20 de noviembre de 2026. **Repositorio:** ArchaiosMagister/ScholaClassica.

> **No publicable:** informe y JSON de propuestas; ninguna pregunta de este lote forma parte de `vendor/vocabula/gramatica-contenidos.js`, del módulo compilado ni del progreso del alumnado. No fusionar ni desplegar hasta autorización docente.

## Criterios

- Fuente exclusiva de contenidos: `vendor/appendix/assets/curriculum.json`; capítulo `vendor/appendix/casos.html` para el predicativo de Latín I; correspondencia de 4.º: `docs/GRAMATICA_LATIN4_BILINGUE_2026-11-14.md`.
- Distinguir contenido nuevo de **repaso sintáctico acumulativo** en unidades centradas en morfología. Conservar la secuencia de las unidades: **Latín 4.º UD1–8**, **Latín I UD1–10**, **Griego I UD1–14** (sin crear nuevos temas sintácticos en Griego I UD11–14).
- Diseño autocorregible: una solución inequívoca, tres distractores distintos y una explicación filológica por pregunta; mismo esquema `s/u/t/c/p/a/w/x` del banco heredado.
- Futuro alta, **solo tras aprobación**: añadir los registros al **final** del array original de 84 preguntas para no alterar los índices/IDs `concept-i` de las anteriores. No cambiar léxico, Morfología, Appendix, Evolutio, progreso ni fuentes vendorizadas.

## Cobertura contrastada

| Curso | Sintaxis existente | Candidatas | Total posible |
| --- | ---: | ---: | ---: |
| Latín 4.º | 2 | 16 | 18 |
| Latín I | 10 | 10 | 20 |
| Griego I | 15 | 10 | 25 |
| **Total** | **27** | **36** | **63** |

| Curso | Unidad | Preguntas actuales | Propuestas | Posible total |
| --- | --- | ---: | ---: | ---: |
| Latín 4.º | UD 1 | 0 | 2 | 2 |
| Latín 4.º | UD 2 | 0 | 2 | 2 |
| Latín 4.º | UD 3 | 2 | 2 | 4 |
| Latín 4.º | UD 4 | 0 | 2 | 2 |
| Latín 4.º | UD 5 | 0 | 2 | 2 |
| Latín 4.º | UD 6 | 0 | 2 | 2 |
| Latín 4.º | UD 7 | 0 | 2 | 2 |
| Latín 4.º | UD 8 | 0 | 2 | 2 |
| Latín I | UD 1 | 0 | 1 | 1 |
| Latín I | UD 2 | 2 | 1 | 3 |
| Latín I | UD 3 | 1 | 1 | 2 |
| Latín I | UD 4 | 0 | 1 | 1 |
| Latín I | UD 5 | 1 | 1 | 2 |
| Latín I | UD 6 | 1 | 1 | 2 |
| Latín I | UD 7 | 0 | 1 | 1 |
| Latín I | UD 8 | 2 | 1 | 3 |
| Latín I | UD 9 | 0 | 1 | 1 |
| Latín I | UD 10 | 3 | 1 | 4 |
| Griego I | UD 1 | 1 | 1 | 2 |
| Griego I | UD 2 | 1 | 1 | 2 |
| Griego I | UD 3 | 0 | 1 | 1 |
| Griego I | UD 4 | 3 | 1 | 4 |
| Griego I | UD 5 | 2 | 1 | 3 |
| Griego I | UD 6 | 1 | 1 | 2 |
| Griego I | UD 7 | 1 | 1 | 2 |
| Griego I | UD 8 | 1 | 1 | 2 |
| Griego I | UD 9 | 2 | 1 | 3 |
| Griego I | UD 10 | 3 | 1 | 4 |
| Griego I | UD 11 | 0 | 0 | 0 |
| Griego I | UD 12 | 0 | 0 | 0 |
| Griego I | UD 13 | 0 | 0 | 0 |
| Griego I | UD 14 | 0 | 0 | 0 |

## Preguntas propuestas y respuesta correcta
Las alternativas erróneas y explicaciones completas figuran en [el JSON de revisión](candidatos-sintaxis-appendix-2026-11-20.json). Ninguna fila está aprobada.

### Latín 4.º

| Unidad | Enunciado propuesto | Respuesta | Tratamiento |
| --- | --- | --- | --- |
| UD 1 | En «Puella rosas amat», ¿qué función tiene «puella»? | Sujeto | Contenido de la unidad |
| UD 1 | En «Puella amico rosam dat», ¿qué función tiene «rosam»? | Complemento directo | Contenido de la unidad |
| UD 2 | En «Servus dominum videt», ¿qué función tiene «dominum»? | Complemento directo | Repaso acumulativo |
| UD 2 | En «Servus domini laborat», ¿qué función tiene «domini»? | Complemento del nombre | Repaso acumulativo |
| UD 3 | En «Puella in silva habitat», ¿qué valor tiene «in silva»? | Lugar en donde | Contenido de la unidad |
| UD 3 | En «Puella in silvam ambulat», ¿qué expresa «in silvam»? | Dirección hacia un lugar | Contenido de la unidad |
| UD 4 | En «Puella rosas amabat», ¿qué función conserva «rosas»? | Complemento directo | Repaso acumulativo |
| UD 4 | En «Servus in villa laborabat», ¿qué función tiene «in villa»? | Complemento circunstancial de lugar | Repaso acumulativo |
| UD 5 | En «Rex militem videt», ¿qué función tiene «militem»? | Complemento directo | Repaso acumulativo |
| UD 5 | En «Servus regis laborat», ¿qué función tiene «regis»? | Complemento del nombre | Repaso acumulativo |
| UD 6 | En «Puella a magistro laudatur», ¿qué función tiene «a magistro»? | Complemento agente | Contenido de la unidad |
| UD 6 | En «Servus a domino vocatur», ¿cuál es el sujeto paciente? | Servus | Contenido de la unidad |
| UD 7 | En «Milites fortes pugnant», ¿qué función tiene «milites fortes»? | Sujeto | Repaso acumulativo |
| UD 7 | En «Rex fortis venit», ¿qué rasgos comparten «rex» y «fortis»? | Masculino, singular y nominativo | Contenido de la unidad |
| UD 8 | En «Magister mihi librum dat», ¿qué función tiene «mihi»? | Complemento indirecto | Contenido de la unidad |
| UD 8 | En «Magister me laudat», ¿qué función tiene «me»? | Complemento directo | Contenido de la unidad |

### Latín I

| Unidad | Enunciado propuesto | Respuesta | Tratamiento |
| --- | --- | --- | --- |
| UD 1 | En «Puella amico rosam dat», ¿qué función tiene «amico»? | Complemento indirecto | Contenido de la unidad |
| UD 2 | En «In horto habitat», ¿qué expresa «in horto»? | Lugar en donde | Contenido de la unidad |
| UD 3 | En «Servus a domino laudatur», ¿qué función tiene «a domino»? | Complemento agente | Contenido de la unidad |
| UD 4 | En «Cicero, orator Romanus, venit», ¿qué función tiene «orator Romanus»? | Aposición | Contenido de la unidad |
| UD 5 | En «puellæ ludunt fessæ» («las niñas juegan cansadas»), ¿qué función tiene «fessæ»? | Complemento predicativo del sujeto | Contenido de la unidad |
| UD 6 | En «Puella quam video rosas carpit», ¿qué función tiene «quam»? | Complemento directo de «video» | Contenido de la unidad |
| UD 7 | En «Mihi liber est», ¿qué expresa «mihi»? | El poseedor en dativo | Contenido de la unidad |
| UD 8 | En «Dux milites pontem iungere iubet», ¿qué función tiene «milites» dentro del AcI? | Sujeto del infinitivo | Contenido de la unidad |
| UD 9 | En «Marcus altior quam Sextus est», ¿qué expresa «quam Sextus»? | Segundo término de la comparación | Contenido de la unidad |
| UD 10 | En «Urbe capta, milites discesserunt», ¿qué construcción es «urbe capta»? | Ablativo absoluto | Contenido de la unidad |

### Griego I

| Unidad | Enunciado propuesto | Respuesta | Tratamiento |
| --- | --- | --- | --- |
| UD 1 | En «ὁ φίλος τοῦ ἀνθρώπου», ¿qué función tiene «τοῦ ἀνθρώπου»? | Complemento del nombre | Contenido de la unidad |
| UD 2 | En «τῷ ἀνθρώπῳ δῶρον δίδωσιν», ¿qué función tiene «τῷ ἀνθρώπῳ»? | Complemento indirecto | Contenido de la unidad |
| UD 3 | En «ἡ κόρη γράφει», ¿qué función tiene el grupo «ἡ κόρη»? | Sujeto | Repaso acumulativo |
| UD 4 | En «ἀκούω τοῦ ἀνθρώπου», ¿qué función tiene «τοῦ ἀνθρώπου»? | Complemento de régimen verbal | Contenido de la unidad |
| UD 5 | En «ὁ ἀγαθός», sin sustantivo expreso, ¿cómo funciona «ἀγαθός»? | Adjetivo sustantivado | Contenido de la unidad |
| UD 6 | En «ἐσθίειν ἐθέλω» («quiero comer»), ¿qué función tiene «ἐσθίειν»? | Complemento directo | Contenido de la unidad |
| UD 7 | En «αὐτὸς γράφει», ¿qué función tiene «αὐτός»? | Sujeto | Repaso acumulativo |
| UD 8 | En «τίς λέγει;», ¿de qué tipo es la oración? | Interrogativa directa | Contenido de la unidad |
| UD 9 | En «ὁ ἄνθρωπος, ὃν ὁ φίλος βλέπει, λόγον λέγει», ¿qué función tiene «ὃν»? | Complemento directo de «βλέπει» | Contenido de la unidad |
| UD 10 | En «ὁ λέγων ἀνήρ», ¿qué uso tiene el participio «λέγων»? | Participio atributivo | Contenido de la unidad |

## Dos correspondencias curriculares que requieren decisión docente

**Latín I UD4 — Aposición y dativo de aproximación.** Appendix lo explica expresamente en UD4, pero la lista histórica de temas del motor de repaso no presenta esa etiqueta. Si se aprueba la candidatura se incorporará el epígrafe al selector/esquema de la unidad sin alterar los anteriores.

**Latín I UD7 — Dativo posesivo.** También está explicado en Appendix UD7 y falta en el temario heredado del repaso; requiere añadir la etiqueta de manera compatible.

**Latín I UD5 — Predicativo.** Se conserva en el motor el tema «El complemento predicativo» y se emplea el ejemplo literal de `vendor/appendix/casos.html`: *puellæ ludunt fessæ*. El currículo dinámico de la quinta unidad no detalla ese apartado: conservar la concordancia con el temario docente legado.

## Comprobaciones exigidas antes de incorporación

1. Autorización individual o por lotes de las 36 candidaturas, y de los dos títulos del temario de Latín I (UD4 y UD7).
2. Inserción **al final** del banco de 84 preguntas, conservando índice, ID, categoría y progreso de las 84 anteriores. Comprobar que las 6 preguntas de UD0 siguen excluidas de la práctica.
3. Pruebas Node y Chromium para unidades, modalidades y respuestas. En 4.º, pruebas específicas de las ocho unidades; Griego I UD11–14 sin temas nuevos inventados.
4. Pruebas de regresión completas y publicación de `main` solo si todo supera CI; los repositorios originales permanecen sin archivar ni borrar.

**Decisión pendiente:** aprobar el lote completo; aprobarlo con exclusiones/correcciones; o pedir otro lote antes de integración.
