# Auditoría filológica — enunciados latinos y equivalencias de Griego I

**Fecha:** 12 de noviembre de 2026. **Tanda 2:** 24 fichas sobre 2.055 (11 de Latín I y 13 de Griego I).

## Criterio y materiales

Se han cotejado las entradas de los seis documentos originales con el banco estático `data.js`, las variantes de otras unidades y diccionarios cuando ha sido necesario. Cada intervención se registra en `tests/fixtures/lexical-reviewed-batch2.json` con identificador, unidad, forma operativa, respuestas, documento original preservado y justificación.

El documento del profesor sigue siendo la **fuente del vocabulario exigido**, pero la aplicación corrige errores manifiestos de morfología o grafía. La transcripción original se mantiene en `originals`; no se sustituye silenciosamente el Word.

## Latín I — 11 enunciados revisados

| Entrada (unidad) | Enunciado operativo corregido | Motivo |
| --- | --- | --- |
| *solis* (UD7) | *sol, solis (m.)* | La forma de origen era el genitivo; el mismo Word da el lema correcto en UD11–12 |
| *appropinquo* (UD2) | *appropinquo, appropinquavi, appropinquatum* | Errata en supino (*approprinquatum*); coherencia con UD6 |
| *adiuvo* (UD7) | *adiuvo, adiuvi, adiutum* | Perfecto y supino erróneos |
| *cognosco* (UD11–12) | *cognosco, cognovi, cognitum* | El Word daba `cognovit, cognotum` |
| *deligo* (UD4) | *deligo, delegi, delectum* | `delictum` corresponde a otro verbo; coincide con UD5 |
| *maneo* (UD5) | *maneo, mansi, mansum* | `manui` no es el perfecto |
| *moveo* (UD1) | *moveo, movi, motum* | `movitum` no es el supino |
| *occido* (UD9–10) | *occido, occidi, occisum* | `occissum` tiene una s sobrante |
| *peto* (UD8) | *peto, petivi, petitum* | `petitium` es una errata; `petivi` y `petii` son perfectos válidos |
| *fugio* (UD6 y UD9–10) | Clasificación `(mx.)` | Verbo de tercera conjugación en *-io*; se homogeneiza con la nomenclatura «mixta» del banco |

**Excepción de procedencia controlada:** el Word de UD7 transcribe «solis, –is» y se conserva literalmente en `originals`. La prueba de procedencia compara contra ese original mediante una **excepción expresa e individualizada**, pero exige que la ficha operativa se mantenga como «sol, solis (m.)». No se actualizan las huellas para hacer desaparecer la discrepancia.

Referencias: [*sol*, Logeion](https://logeion.org/sol), [*cognosco*, Lewis–Short](https://cld.bbaw.de/lemma/lat/cognosco), [*maneo*](https://cld.bbaw.de/lemma/lat/maneo), [*moveo*](https://cld.bbaw.de/lemma/lat/moveo), [*occido*](https://cld.bbaw.de/lemma/lat/occido), [*peto*](https://cld.bbaw.de/lemma/lat/peto), [*adiuvo*, conjugación](https://www.latindictionary.io/entry/adjuvo-adjuvare-adjuvi-adjutus).

## Griego I — seis correcciones de enunciados

| Entrada | Cambio | Procedencia |
| --- | --- | --- |
| ὑπέρ en el vocabulario alfabético | `ὐπέρ` → `ὑπέρ` | El upsilon inicial debe llevar espíritu áspero |
| ὑπό en General y Examen | `ὐπό` → `ὑπό` | Mismo error en ambos documentos |
| πατήρ en Examen | `πάτηρ` → `πατήρ` | Acento correcto en la última sílaba |
| Ἑλλάς en Examen | `Ἕλλας` → `Ἑλλάς` | Espíritu y acento verificados, coincide con General |
| ὕδωρ en General | `ὑδάτος` → `ὕδατος` | Genitivo correctamente acentuado en Examen |

Fuentes: [LSJ, *ὑπέρ*](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n107183/), [*πατήρ*, Logeion](https://logeion.uchicago.edu/%CF%80%CE%B1%CF%84%CE%AE%CF%81), [*Ἑλλάς*, Logeion](https://logeion.uchicago.edu/%E1%BC%99%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1), [*ὕδωρ*, LSJ](https://atlas.perseus.tufts.edu/nodes/urn%3Acts%3AgreekLit%3Atlg0012.tlg002.perseus-grc2%3A5.70/).

Los dos registros de ὑπέρ en General **no se fusionan**: aparecen con regímenes y acepciones distintos en el documento alfabético. Se mantiene «Sin unidad acreditada» para ambos.

## Griego I — siete ampliaciones de respuestas válidas

No se sustituyen las traducciones mostradas en los documentos ni las unidades. Solo se amplía el campo `answers` para evitar que la respuesta escrita marque como erróneo un sinónimo válido acreditado en la otra modalidad.

| Lema | Unidad | Respuestas admitidas tras cotejo |
| --- | --- | --- |
| ἀρχή | UD5 General | gobierno, origen |
| οἰκέω | UD5 General y Examen | vivir, habitar (en ambas modalidades) |
| ἄρχων | UD8 General y Examen | líder, arconte (en ambas modalidades) |
| ἡγεμών | UD8 General | soberano, líder |
| λαμβάνω | UD9 General | coger, tomar |

Por ejemplo, en la ficha de General de ἀρχή seguirá apareciendo «gobierno», pero también se considerará correcta «origen». En los tests de opción múltiple, las equivalencias compartidas no deben ofrecerse como distractores incorrectos: `choiceConflicts` las detecta.

## Conservado y pendiente

- Los 2.055 identificadores, las unidades y las transcripciones originales permanecen intactos.
- Se mantiene el carácter alfabético de Griego general, sin adjudicar arbitrariamente los 184 registros sin unidad acreditada.
- Las glosas condicionadas por régimen preposicional no se han simplificado: `μετά` con genitivo no equivale automáticamente a `μετά` con acusativo.
- Variantes de caso, género, acepciones contextuales y diferencias docentes no inequívocas siguen pendientes de revisión individual.
- La revisión del banco estático no verifica cambios que el profesor haya introducido después mediante el servicio de vocabulario en línea.

## Comprobaciones para publicar

`tests/check-lexical-batch2.cjs` verifica los 24 registros y su procedencia, prueba que no se reintroducen erratas en los enunciados y que los sinónimos griegos no sirven como distractores falsos. La prueba de navegador `tests/check-vocabulary-browser.cjs` verifica que las siete nuevas respuestas se aceptan y que no se aceptan traducciones inventadas. La CI vuelve a ejecutar las pruebas de procedencia, filtrado, gramática y publicación anteriores.
