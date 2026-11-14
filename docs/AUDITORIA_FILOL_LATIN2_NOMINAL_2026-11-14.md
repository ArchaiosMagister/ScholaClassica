# Auditoría filológica de Latín II · morfología nominal (14-11-2026)

## Material revisado y delimitación

Fuente docente primaria: **Cuaderno de Latín II, curso 2026–2027,
páginas 64–70** del PDF de 78 páginas facilitado por el profesor.
No se altera ni redistribuye el PDF.

Fuentes contrastivas independientes: Allen y Greenough,
*New Latin Grammar* §§73–74, 88–91, 113–129, edición en
Dickinson College Commentaries; datos lexicográficos de Lewis, Georges
y las tablas de tercera declinación.

La auditoría sobre el banco real de ScholaClassica se automatiza en
`scripts/audit-morphology-latin2-nominal.mjs`, y su informe
reproducible se guarda en
`apps/morfologia/data/latin2-filologia-nominal.json`.
**No se identifican todas las formas generadas como verificadas individualmente.**

## Hallazgos y criterios

| Código | Entrada/fuente | Hallazgo y tratamiento |
| --- | --- | --- |
| NOM-01 | Cuaderno, p. 66: `brevis, breve` | La tabla resumida indica genitivo plural `-um` y ablativo singular `-e`, pero este paradigma es de tema en -i: **brevium** y **brevi**. La tabla original de Appendix ya estaba correctamente formulada. Añadida prueba para impedir regresiones |
| NOM-02 | Cuaderno, pp. 65–66: `acer, audax, vetus` | Distinguir `acer/acrium/acri` y `audax/audacium/audaci` de **`vetus/veterum/vetere/vetera`**. La aplicación ya reproduce esos paradigmas; comprobación expresa del género neutro |
| NOM-03 | `genu, genūs`, cuarta neutra | El generador daba **`genui`** en dativo singular por aplicar la casilla de cuarta masculina. Debe ser **`genu`**. Corregido en la fuente persistente; casos propios del neutro intactos |
| NOM-04 | `supplex, supplicis` | La auditoría inicial corrigió el genitivo plural a **`supplicum`** frente a `supplicium` (este último atestiguado en Livio), pero **invirtió la prioridad del ablativo**. Lewis & Short indica como ablativo adjetival habitual **`supplici`**; `supplice` se documenta especialmente en usos sustantivados o poéticos. La revisión final corrige la prioridad, conserva ambas y etiqueta la segunda como variante contextual |
| NOM-05 | `adulescens, adulescentis` | El genitivo plural **`adulescentium`** es el habitual. Se conserva `adulescentum` como variante documentada y menos frecuente; no se elimina una lectura válida |
| NOM-06 | Cuaderno, p. 70: `alter` | Acusativo femenino plural correcto **`alteras`**, no *alterae*. Se incorpora el paradigma documentado, sin vocativo ficticio |
| NOM-07 | Cuaderno, p. 70: `alius` | Acusativo femenino plural **`alias`**, no *aliae*. Genitivo singular habitual **`alterius`**; `alius` aparece como variante menos frecuente y se etiqueta |
| NOM-08 | Cuaderno, p. 70: `duo` | Nominativo femenino plural **`duae`**, no *dua*. El banco previo ya tenía la forma correcta; queda protegida por prueba |
| NOM-09 | `unus, una, unum` | Se añade el paradigma singular explicitado en la tabla. No se fabrican automáticamente plurales de usos restringidos |
| NOM-10 | Cuaderno, p. 67 | Comparativos y superlativos de grado irregular: `melior/melius`, `peior/peius`, `maior/maius`, `minor/minus`, `plures/plura`, `optimus`, `pessimus`, `maximus`, `minimus`, `plurimus`, `veterrimus`, `proximus`. Se añaden los paradigmas ausentes sin duplicar los ya presentes |
| NOM-11 | Cuaderno, p. 67, `vetus: veterior` | Allen y Greenough §125 indica **`vetustior`** como comparativo clásico habitual. Lewis & Short documenta **`veterior`**, que aparece en Catón (*Origines* 1, fr. 25, transmitido por Prisciano), como forma **arcaica real**. Criterio cerrado: se mantiene `vetustior` en el sorteo y se archiva `veterior` como testimonio histórico, sin generar un paradigma completo ficticiamente verificado |
| NOM-12 | Nombres con variación de género o defectividad | Los registros de sustantivos conservan el género léxico declarado. Quedan pendientes del siguiente contraste las ambivalencias contextuales, las variantes poéticas y los locativos, que no se certifican por analogía |

## Pruebas de regresión

La validación comprueba el **caso, género, número y enunciado**, no
solamente que aparezca una cadena entre las 301 grafías de PAU o las
223 del cuaderno.

- Control positivo de declinación en -i: `brevium`, `acrium`,
  `audacium`, `marium`, `finium`, `civium`.
- Control consonántico: `veterum`, `vetere`, `vetera`,
  `supplicum`, `supplici`, y las variantes documentadas `supplicium`/`supplice`, etiquetadas por uso.
- Control de cuarta neutra: `genu` (dativo), `genua`, `genuum`,
  `cornu`, `cornua`. Prohibido el dativo *genui*.
- Pronominales: `alteras`, `alias`, `alterius`, `alius`
  etiquetado como genitivo raro, `unius`, `uni`, `duae`.
- Grados: terminaciones completas de comparativos y superlativos
  **sin inventar un singular de `plures`**.
- Prueba negativa que introduce un falso *genui* en el banco y exige
  que el compilador lo rechace como error bloqueante.

Cualquier fallo de esos controles detiene el `build`. Se mantiene
la auditoría verbal previa en el mismo flujo de validación.

## Bibliografía de contraste

- DCC §§114–119 (adjetivos de 3.ª declinación):
  https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-classification-and-paradigms
- DCC §121 (temas consonánticos y `supplex`):
  https://dcc.dickinson.edu/tr/grammar/latin/3rd-declension-adjectives-case-forms-consonant-stems
- DCC §§88–91 (cuarta declinación):
  https://dcc.dickinson.edu/el/grammar/latin/4th-declension-stem-paradigm-and-gender
- DCC §113 (adjetivos pronominales):
  https://dcc.dickinson.edu/tr/grammar/latin/1st-and-2nd-declension-adjectives-genitive-%C4%ABus-dative-%C4%AB
- DCC §§125–129 (comparación):
  https://dcc.dickinson.edu/grammar/latin/comparison-adjectives
  https://dcc.dickinson.edu/es/grammar/latin/irregular-and-defective-comparison-adjectives
- `adulescens`, variantes de genitivo plural (Georges):
  https://www.lateinlex.de/?call=ShowArticle&id=1066&latein=adulescens
- `supplex` con variantes poco comunes (Georges):
  https://www.lateinlex.de/?call=ShowArticle&id=1939&latein=supplex

**Estado:** bloque de morfología nominal cotejado con pruebas
automáticas de invariantes; **no se declara concluida la auditoría
filológica individual de todos los paradigmas y todas las casillas**.
