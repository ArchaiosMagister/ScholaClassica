# Lematización offline de griego: presente de indicativo (fase 2)

**Revisión:** 10 de noviembre de 2026. Fuente canónica: **data/grc-present-indicative-offline.json**, esquema 2. Consulta autónoma mediante **scripts/grc_present_lookup.mjs**, sin peticiones a Internet. Todavía no se conecta a GeneradorExamenes ni a la autocorrección.

## Cobertura

| Elemento | Total |
| --- | ---: |
| Lemas | 81 (80 del vocabulario de Griego I y el paradigma gramatical de εἰμί) |
| Paradigmas de seis personas | 135 |
| Celdas flexivas del presente | 810 |
| Paradigmas medio-pasivos nuevos | 19 |
| Deponentes estrictos | 7 |
| Medios léxicos NO deponentes estrictos | 1 (ὁρμάομαι) |
| Paradigmas con cotejo directo de seis personas | 8 |
| Paradigmas con apoyo léxico y regla flexiva | 17 |
| Paradigmas nuevos solo candidatos | 2 |
| Paradigmas sustentados por regla, pendientes de cotejo individual | 108 |

Las 810 celdas **no** son 810 grafías distintas ni 810 formas individualmente atestiguadas. Una misma forma puede admitir varios análisis: λύει es tercera singular activa o segunda singular media-pasiva en su variante en -ει. También se permite la variante sin ν móvil y con ν móvil.

## Control filológico y seguridad

Cada paradigma tiene un registro de revisión con los campos **review.tier**, **review.source_urls** y **review.per_person** (un estado para cada una de las seis personas).

- **direct_paradigm / reference_checked:** paradigma de seis personas cotejado con una tabla publicada. No supone exhaustividad dialectal ni de variantes.
- **pattern_and_lexeme / rule_checked:** fuente léxica que confirma la voz y patrón regular que genera las seis personas, sin cotejo independiente de cada una.
- **pattern_only / rule_checked:** reglas gramaticales revisadas, pero formas individuales o restricciones léxicas aún sin cotejar.
- **candidate_only / candidate:** forma morfológicamente generable pero sin suficiente contraste léxico. **No usar como respuesta definitiva en exámenes.**

No se asume que toda voz media-pasiva tenga valor medio en cada contexto, ni que un paradigma generado equivalga a un testimonio textual.

## Ampliación del presente

Se incorporan 19 paradigmas medio-pasivos para: ἀναγιγνώσκω, ἁρπάζω, διαφέρω, διαφθείρω, εἰσβάλλω, εὑρίσκω, εὐφραίνω, θύω, ἱδρύω, κατέχω, κομίζω, νικάω, παρέχω, προσβάλλω, στρατεύω, τέμνω, τήκω, φονεύω y φύω. Tras el contraste de fuentes léxicas, únicamente los medios de **ἀναγιγνώσκω** y **εἰσβάλλω** permanecen como candidatos sin respaldo léxico suficiente. Las restantes nuevas voces están respaldadas al menos por una referencia léxica; sus seis personas siguen generadas por regla salvo los paradigmas cotejados íntegramente.

**ὁρμάομαι no es deponente estricto:** existe ὁρμάω activo, con un significado relacionado pero diferente. La entrada de vocabulario se mantiene como medio léxico. Los siete deponentes estrictos del corpus son βούλομαι, γίγνομαι, ἔρχομαι, μάχομαι, ἀφικνέομαι, ἡγέομαι y προσέρχομαι.

Se amplían las variantes de segunda singular medio-pasiva, por ejemplo λύῃ / λύει, ἡγῇ / ἡγεῖ y βούλῃ / βούλει. La iota suscrita se conserva en el índice de consulta; se puede buscar sin acentos, pero el análisis indica si la coincidencia gráfica es exacta o si se han omitido diacríticos (**accent_match: exact / folded**). Si faltan los acentos, no siempre es posible distinguir lemas diferentes, como εἰμί y εἶμι, este último fuera del vocabulario actual.

La traducción de vocabulario de **εὐφραίνω** se ha conservado sin modificar el material docente. Para la revisión léxica posterior se señala que el activo expresa normalmente 'alegrar' y el medio-pasivo **εὐφραίνομαι** puede expresar 'alegrarse'.

Permanecen fuera de esta etapa **δύναμαι**, por ser atemático, los impersonales **δεῖ** y **χρή**, así como los tiempos distintos del presente, el dual y los modos diferentes del indicativo. **εἰμί** constituye la excepción atemática expresamente solicitada.

## Fuentes contrastadas

- [Helma Dik, tests de λύω (greek-inflexion)](https://github.com/jtauber/greek-inflexion/blob/master/test_data/dik_test.yaml).
- [Keller y Russell, tablas de νικάω y εἰμί (greek-inflexion)](https://github.com/jtauber/greek-inflexion/blob/master/test_data/ltrg_test.yaml).
- [Contracciones áticas en el presente medio-pasivo, ParsedClassics](https://www.parsedclassics.com/site/drills/attic-greek/w-verbs-contract-ind-mid-pass.html).
- [βούλομαι, conjugación ática, Wikcionario](https://en.wiktionary.org/wiki/%CE%B2%CE%BF%CF%8D%CE%BB%CE%BF%CE%BC%CE%B1%CE%B9).
- [εὐφραίνω, paradigmas activos y medio-pasivos, GreekDoc](https://greekdoc.com/lexicon/euf.html).
- [κομίζω, LSJ del Centro de la Lengua Griega](https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%CE%BA%CE%BF%CE%BC%CE%AF%CE%B6%CF%89).
- [στρατεύω, LSJ vía Logeion](https://logeion.org/%CF%83%CF%84%CF%81%CE%B1%CF%84%CE%B5%CF%8D%CF%89).
- [φύω, LSJ vía Logeion](https://logeion.org/%CF%86%CF%8D%CF%89).
- [ὁρμάω, Cunliffe a través de Scaife ATLAS](https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Acunliffe_lex-n7064/).

## Evidencia léxica ampliada en esta revisión

Se han contrastado referencias de formas y usos de voz media-pasiva para otros doce verbos que antes eran únicamente candidatos:

- [ἁρπάζω, LSJ a través de Scaife ATLAS](https://atlas.perseus.tufts.edu/dictionaries/entry/urn:cite2:scaife-viewer:dictionaries.v1:lsj-n15399/)
- [διαφέρω, diccionario de griego antiguo](https://www.greek-language.gr/greekLang/ancient_greek/tools/lexicon/lemma.html?id=64)
- [διαφθείρω, diccionario de griego antiguo](https://www.greek-language.gr/greekLang/ancient_greek/tools/lexicon/lemma.html?id=65)
- [εὑρίσκομαι, Wikcionario griego](https://el.wiktionary.org/wiki/%CE%B5%E1%BD%91%CF%81%CE%AF%CF%83%CE%BA%CE%BF%CE%BC%CE%B1%CE%B9)
- [θύω, Wikcionario griego](https://el.wiktionary.org/wiki/%CE%B8%CF%8D%CF%89)
- [ἱδρύω, LSJ del Centro de la Lengua Griega](https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%E1%BC%B1%CE%B4%CF%81%CF%8D%CF%89)
- [κατέχω, Wikcionario griego](https://el.wiktionary.org/wiki/%CE%BA%CE%B1%CF%84%CE%AD%CF%87%CF%89)
- [παρέχω, LSJ vía Logeion](https://logeion.org/%CF%80%CE%B1%CF%81%CE%AD%CF%87%CF%89)
- [προσβάλλω, LSJ del Centro de la Lengua Griega](https://www.greek-language.gr/digitalResources/ancient_greek/tools/liddell-scott/search.html?lq=%CF%80%CF%81%CE%BF%CF%83%CE%B2%CE%AC%CE%BB%CE%BB%CF%89)
- [τέμνω, LSJ](https://classics.andrewgadsden.com/liddellandscott/entry/n103052)
- [τήκω, GreekDoc](https://greekdoc.github.io/lexicon/th.html)
- [φονεύομαι, Wikcionario](https://en.wiktionary.org/wiki/%CF%86%CE%BF%CE%BD%CE%B5%CF%8D%CE%BF%CE%BC%CE%B1%CE%B9)

Estos enlaces se conservan por paradigma en la base. El respaldo confirma la **existencia de voz o construcción media-pasiva**, no la verificación individual de las seis personas.

Los índices UniMorph existentes siguen separados y sometidos a su propia licencia. No se han mezclado corpus externos completos ni modificado el vocabulario original.

## Verificación reproducible

Desde la raíz del repositorio:

    node scripts/grc_present_lookup.mjs γίγνεται
    node scripts/grc_present_lookup.mjs λύει
    node scripts/grc_present_lookup.mjs εὐφραίνονται
    node tests/check-grc-present-offline.mjs

Las pruebas incluyen controles para todas las formas generadas, ambiguas, contractas, ν móvil, iota suscrita, deponentes, grados de revisión y procedencia de los lemas.

## Siguientes prioridades

1. Contrastación directa de formas de los paradigmas actualmente clasificados como patrón o candidato.
2. Auditoría adicional de homografías y variantes ortográficas.
3. Infinitivos, imperativos y participios de presente solo después de cerrar el indicativo de modo satisfactorio.
4. Una única base canónica en VocabulaLatinaGraecaque para que GeneradorExamenes importe versiones fijadas sin duplicar la edición de los datos.
