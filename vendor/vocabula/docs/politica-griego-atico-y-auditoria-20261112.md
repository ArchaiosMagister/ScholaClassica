# Política filológica: griego ático clásico

**Fecha:** 12 de noviembre de 2026. **Decisión docente:** Griego I se enseña en **ático clásico**, especialmente la lengua de la prosa ática de los siglos V–IV a. C. No se deben incluir automáticamente formas de **koiné, jónico, dórico, eólico, épico ni otros dialectos** como alternativas válidas de un ejercicio.

Esta política afecta al vocabulario de General y Examen, a los enunciados griegos y a las formas admitidas por la autocorrección. Los documentos originales de clase siguen siendo la referencia para determinar **qué lemas y unidades** son exigibles, pero pueden contener erratas o variantes de tradición no ática: `originals` se conserva literalmente y los campos operativos se corrigen, dejando registro individual de la decisión.

## Cuarta tanda: 27 fichas corregidas

Las 27 decisiones concretas constan en `tests/fixtures/attic-reviewed-batch4.json`, con identificador, antes/después, unidad, texto original y autoridad de contraste.

| Revisión | Ejemplos | Criterio |
| --- | --- | --- |
| Genitivos contraídos de temas en sigma | **γένος, γένους**; **πέλαγος, πελάγους** | En ático no se enseñan como genitivos habituales las formas no contraídas en `-εος` |
| Morfología y enunciados | **Σωκράτης, Σωκράτους**; **λιμήν, λιμένος**; **πένης, -ητος** | Genitivos atestiguados en la lengua clásica |
| Acentuación y grafía | **θεός**, **κεφαλή**, **σοφιστής**, **ἀλήθεια**, **πρᾶγμα**, **νῆσος**, **γῆ**, **οὐρανός**, **ἱερόν** | Se distinguen acentos lexicográficos de variantes de contexto; `ἱερὸν` con grave es contextual, no la forma citada aisladamente |
| Lemas con errata | **κίνδυνος**, **νεκρός**, **Πρωταγόρας**, **Λακεδαιμόνιος** | Se corrigen letras o colocación del acento; `νεκρóς` mezclaba la ó latina con caracteres griegos |
| Flexión y traducción | **Πέρσαι, –ῶν**, «persas»; **αἰτέω** «pedir, solicitar»; **ἀκρόαμα** «audición, actuación musical» | Diferenciar plural del singular y categoría del sustantivo, y no confundir **αἰτέω** con **ζητέω** («buscar») |
| Preposición ática | **ἀμφί + genitivo / acusativo** | Smyth §1675 restringe el dativo de ἀμφί al uso poético y herodoteo; no se ofrece en el banco ático de clase |

**Importante:** `ἀκρόαμα` **sí** está documentado en Jenofonte y, por tanto, no se excluye meramente por su expansión posterior en koiné. La revisión filológica exige testimonios **áticos positivos**, no eliminar cualquier voz utilizada más tarde.

## Protección contra contaminaciones morfológicas de UniMorph

El índice UniMorph de griego antiguo **no contiene una etiqueta de dialecto para cada forma**. Hasta ahora se comparaban lemas sin acentos ni espíritus. Eso permitiría mezclar indebidamente lemas diferentes que, al eliminar las marcas, parecen idénticos:

| Lema ático docente | Homógrafo que debe quedar excluido |
| --- | --- |
| **νόμος**, «ley» | **νομός**, «pastizal / distrito» |
| **δῆμος**, «pueblo» | **δημός**, con acentuación distinta |
| **βίος**, «vida» | **βιός**, «arco» |
| **παῖς**, «niño/a» | **πάϊς**, variante con distinta grafía/diéresis |

Se han añadido dos protecciones complementarias:

1. **En la importación** (`scripts/import_unimorph.mjs`), solo se conservan filas cuya cabecera de lema coincida con la del vocabulario docente **incluyendo acento y espíritu**, con tolerancia únicamente para las marcas editoriales de cantidad (breve/macrón) y para la sustitución regular de grave por agudo.
2. **En la presentación** (`gramatica-importada.js`), se vuelve a comprobar esa identidad antes de convertir una forma importada en pregunta. Un error futuro en los índices no puede saltarse esta barrera.

La coincidencia exacta **es una condición necesaria, no suficiente, para certificar el dialecto**. La ausencia de metadatos dialectales en UniMorph obliga a **no etiquetar automáticamente todas sus flexiones como «ático verificado»**. Para completar esa certificación se requiere contraste de las formas de superficie con paradigmas áticos independientes. **No se han marcado como verificadas las formas no auditadas.**

### Convenciones legítimas que se conservan

- Los verbos contractos pueden citarse lexicográficamente mediante su forma no contraída en `-έω` o `-άω` para mostrar el tema. Eso **no autoriza** a preguntar sus formas no contraídas como presente de indicativo ático.
- El griego antiguo distingue agudo y grave según posición; la alternancia final de grave por agudo en la forma de cita no constituye un dialecto diferente.
- Los bloques combinados de unidades y las **184 fichas de Griego general sin unidad acreditada** siguen sin inferencias ni reasignaciones.
- Una acepción contextual de ático, como «ya» para **ἔτι** en un pasaje concreto de Platón, no debe descartarse como supuesta koiné sin analizar el contexto.

## Contrastes utilizados

- [Smyth, *Greek Grammar*, §§263–265: contracción y genitivos en -ους](https://ccel.org/s/smyth/grammar/html/smyth_2f_uni.htm).
- [Smyth, §1675: casos de las preposiciones en prosa ática](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.4_div2.19.html).
- [Smyth, §§149–165: reglas del acento](https://grammars.alpheios.net/smyth/xhtml/body.1_div1.1_div2.7.html).
- [Smyth, Σωκράτης/Σωκράτους](https://www.ccel.org/s/smyth/grammar/html/smyth_2f_uni.htm).
- [LSJ/CLD, αἰτέω](https://cld.bbaw.de/lemma/grc/%CE%B1%E1%BC%B0%CF%84%CE%AD%CF%89); [Πρωταγόρας](https://cld.bbaw.de/lemma/grc/%CE%A0%CF%81%CF%89%CF%84%CE%B1%CE%B3%CF%8C%CF%81%CE%B1%CF%82); [πέλαγος](https://cld.bbaw.de/lemma/grc/%CF%80%CE%AD%CE%BB%CE%B1%CE%B3%CE%BF%CF%82).
- [Portal de la Lengua Griega, κίνδυνος](https://www.greek-language.gr/greekLang/ancient_greek/tools/lexicon/lemma.html?id=130).
- [Atticism.eu, ἄκουσμα / ἀκρόαμα](https://atticism.eu/corpus/item/view?id=dd0c1758-f5f3-4c07-8631-ee895cbfcee8), con testimonios áticos de Jenofonte.

## Garantías de no regresión

- Siguen existiendo **2.055 fichas**, con los mismos IDs, unidades y `originals`.
- Las 44 listas de unidades y los 330 lemas originales distintos de Griego general se cotejan con **huellas históricas**. Hay tres excepciones adicionales de lema, explícitas e individuales, para `κυνδύνος`, `νεκρóς` y `Προταγόρας`.
- `tests/check-attic-greek.cjs` comprueba las 27 fichas, los enunciados áticos, las equivalencias y la separación de homógrafos.
- `tests/check-unimorph-import.mjs` comprueba, tras regenerar el índice, que ninguna cabecera griega importada contradiga los lemas autorizados por la grafía.
- `tests/check-vocabulary-browser.cjs` verifica que se acepte **pedir** para `αἰτέω` y se rechace **buscar**, y que `ἀμφί` no enseñe dativo.
- Las pruebas anteriores de filtrado por unidades, opciones múltiples, gramática, lematización offline, importación y navegador siguen obligatorias.

**Próxima auditoría:** contraste individual de los paradigmas griegos importados con modelos áticos y revisión de vocablos que conservan glosas ambiguas, sin asumir que una forma común a varias épocas pertenece automáticamente a la koiné.
