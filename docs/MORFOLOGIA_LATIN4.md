# Latín de 4.º ESO — práctica de morfología por unidades

## Ámbito y temario

La asignatura «Latín · 4.º de ESO» incorpora UD1–UD8 siguiendo el temario docente
fijado en `gramatica-contenidos.js` de Vocabula. Su progresión es independiente de
la de Latín I: no se habilitan paradigmas por la unidad de Bachillerato de la
que proceden, sino por la unidad de introducción en 4.º.

| Unidad | Contenido morfológico | Fichas nuevas |
| --- | --- | ---: |
| UD1 | Primera declinación | 2 |
| UD2 | Segunda declinación, presente de indicativo activo | 11 |
| UD3 | Adjetivos de primera clase, concordancia y sintagmas | 2 |
| UD4 | Imperfecto de indicativo activo | 17 |
| UD5 | Tercera declinación | 6 |
| UD6 | Perfecto activo y voz pasiva | 19 |
| UD7 | Adjetivos de tercera, pluscuamperfecto activo | 12 |
| UD8 | Cuarta y quinta declinación, pronombres personales | 7 |
| **Total** | | **76** |

El banco global pasa de 144 a 220 registros. Las 144 fichas anteriores de
Latín I y Griego I conservan sus identificadores, formas, orden y umbrales
curriculares. Las 76 fichas de 4.º usan prefijo `latin4-` y no se intercambian
con los ejercicios de Bachillerato.

## Procedencia filológica

Se utilizan **solo dos fuentes académicas fijadas por SHA**:

- Las 16 fichas de `gramatica-paradigmas.js` y las diez fichas de
  `gramatica-latin-imperfectos.js` del Vocabula original, siempre que
  `units.lat4` determine una unidad de 4.º.
- Un conjunto cerrado de 49 paradigmas ya documentados en Appendix grammaticae,
  reasignados expresamente a la unidad de 4.º que introduce ese contenido.
- La tabla completa de `bonus, bona, bonum` de
  `adjetivos.html` de Appendix, introducida en 4.º UD3.

No se generan nuevas flexiones a partir de un lema ni se acepta toda la
colección UniMorph como verificada. El modelo docente de `bonus` tiene
solo algunas casillas: se conserva íntegro y **no se rellena por conjetura**.
La tabla completa de `bonus` utilizada para declinaciones y sintagmas
proviene del Appendix. Los dos genitivos plurales de `ego`
(`nostri` y `nostrum`) se importan como variantes independientes.

En los modelos completos se puede practicar la declinación por casos y número;
los modelos parciales ofrecen únicamente las formas efectivamente acreditadas.
En sintagmas se combinan solo sustantivos con género declarado y adjetivos
con todas las formas exigidas para dicho género. No se añade el
vocativo a `ego`, ni se crean géneros alternativos por analogía.

## Conservación y límites

La selección de unidades es acumulativa. El usuario puede practicar
reconocimiento, análisis, escritura, tablas, sintagmas y repetición inteligente,
con el mismo corrector y el mismo almacenamiento local de progreso de las otras
materias. Las respuestas latinas admiten la equivalencia `æ/ae` y omitir
la cantidad vocálica sin alterar las desinencias. La caché propia del módulo
incluye el nuevo banco y cambia de versión en cada compilación.

**UD9 y UD10 del vocabulario de 4.º no son unidades del temario de gramática
de referencia** (`gramatica-contenidos.js` solo acredita UD1–UD8).
No se añaden por inferencia; su eventual integración exige un temario
morfológico específico.

## Comprobaciones

`tests/morphology-latin4.test.mjs` vuelve a compilar desde la revisión
fijada de Vocabula y Appendix, verifica los 76 registros, la distribución
de unidades, las alternativas, los sintagmas, la escritura y la
incompatibilidad con fuentes alteradas. La prueba Chromium del módulo
también recorre 4.º y su caché sin conexión. Los tres repositorios originales
permanecen sin modificaciones.
