# Auditoría de procedencia y adscripción de vocabulario

**Fecha:** 12 de noviembre de 2026  
**Alcance:** banco estático `data.js` de Vocabula Latina Græcaque, cotejado con los seis archivos Word proporcionados por el profesor.  
**Criterio:** adscripciones de **lemas** a asignatura, modalidad y unidad o bloque; no se ha dado por revisada toda la morfología ni la totalidad de las traducciones.

## Fuentes y cobertura

| Corpus | Documento original | Cobertura |
| --- | --- | --- |
| Latín I · General | `Vocabulario por unidades copia2 lat1.docx` | 10 agrupaciones verificadas |
| Latín I · Examen | `Vocabulario de examen por unidades lat1.docx` | 7 agrupaciones verificadas |
| Latín de 4.º · General | `Vocabulario por uds lat4.docx` | 10 agrupaciones verificadas |
| Latín de 4.º · Examen | `vocabulario para examen por uds lat4.docx` | 9 agrupaciones verificadas |
| Griego I · Examen | `Copia de Vocabulario para examen gr1.docx` | 8 agrupaciones verificadas |
| Griego I · General | `voc gr1 alfabetico.docx` | 330 lemas normalizados verificados en conjunto; **el Word no los divide por unidades** |

En total se cotejan **44 agrupaciones con unidades acreditadas** y el conjunto de lemas de Griego general. La huella de cada grupo está en `tests/fixtures/vocabulary-provenance.json`. La prueba `tests/check-vocabulary-provenance.cjs` se ejecuta antes de integrar nuevas versiones en `main`.

No se ha proporcionado un documento equivalente para **Latín II**; su división por bloques no queda certificada por esta auditoría.

## Cinco adscripciones recuperadas (Latín I · General)

El documento incluía cinco formas cuyo apartado de unidad no contenía traducción. El banco había omitido esas adscripciones al descartar entradas sin traducción. La traducción **sí** figura en otra unidad del propio corpus, de modo que se reutiliza la ficha existente y no se inventan acepciones.

| Forma | Unidad restaurada | Traducción ya acreditada en |
| --- | --- | --- |
| `neque (conj.)` | UD 3 | UD 7 |
| `non (adv.)` | UD 3 | UD 2 |
| `noster, –tra, –trum` | UD 3 | UD 5 (misma forma abreviada) |
| `loquor, locutus sum (3ª)` | UD 11–12 | UD 9–10 |
| `pugno, pugnavi, pugnatum (1ª)` | UD 11–12 | UD 9–10 |

Solo se modificó la propiedad `units` de las cinco fichas anteriores. Se mantuvieron sus identificadores, enunciados, traducciones, respuestas admitidas y restantes adscripciones.

## Griego I general: límite de la acreditación

El documento de Griego general es **alfabético**, no una lista por unidades. Se ha comprobado la presencia de sus 330 lemas normalizados en el banco; hay 332 fichas, porque dos claves léxicas tienen variantes de entrada. La correspondencia de un lema con las unidades de examen solo se acredita cuando ese mismo lema aparece en el documento de examen con el bloque identificado.

Las **148 fichas con unidad o bloque acreditado** son coherentes con el documento de examen. Las **184 restantes** conservan «Sin unidad acreditada»; **no se infieren unidades** por traducción, semejanza formal ni contenido gramatical. Las agrupaciones UD 1–4 y UD 6–7 se mantienen indivisas.

## Qué verifica la prueba automática

- Integridad de las 44 colecciones de lemas por curso, modalidad y unidad, a partir de conteos y huellas reproducibles.
- Integridad del vocabulario alfabético de Griego general (330 lemas distintos).
- Correspondencia exacta entre los grupos asignados en Griego general y los grupos documentados en Griego examen.
- Conservación de las cinco adscripciones recuperadas, con respuestas no vacías.
- Detección de grupos imprevistos y cambios no autorizados de la lista oficial.

**Limitación deliberada:** el contraste normaliza mayúsculas, signos vocálicos y ligaduras para reconocer el lema. La equivalencia de lema no prueba por sí sola la corrección de una flexión, un enunciado ni una traducción, que deben revisarse aparte. Las huellas se actualizan únicamente después de cotejar modificaciones con documentos nuevos o con una decisión expresa del profesor.

No se han introducido formas nuevas basadas en recursos externos, ni se han redefinido las unidades originales.
