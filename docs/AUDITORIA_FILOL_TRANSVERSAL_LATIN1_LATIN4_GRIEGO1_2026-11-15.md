# Auditoría filológica transversal · primer bloque verificable

**Fecha:** 15 de noviembre de 2026.  
**Alcance:** Latín I, Latín de 4.º ESO y Griego I; gramática de consulta en castellano y valenciano, práctica de morfología y vocabulario General/Examen integrado.  
**Ámbito de cambios:** únicamente la rama de ScholaClassica. No se escriben repositorios originales ni se cambian las fichas de Vocabula, sus ID, acepciones, respuestas, unidades o progreso. No hay publicaciones automáticas desde esta rama.

## 1. Evidencias reproducibles

Fuentes bloqueadas: Appendix `4c89f9b032e356f033f507eafbb66b49d6bb6761`; Vocabula `0e16505b7631298a0448c4160a5d258f82732bfe`. El programa `scripts/audit-filologia-transversal.mjs` coteja los currículos derivados, el banco morfológico realmente compilado y las **2.055 fichas originales** con las integradas. La comprobación de conservación admite exclusivamente dos enmiendas latinas documentadas de enunciado y las 17 reasignaciones a UD8 de Latín 4.º previamente conciliadas. Cualquier cambio adicional en ID, unidad, glosa, respuestas o enunciado hace fallar la auditoría.

| Materia | Unidades gramática ES/VAL | Apartados teóricos ES/VAL | Modelos morfológicos | Fichas General | Fichas Examen |
|---|---:|---:|---:|---:|---:|
| Latín I | 10 / 10 | 30 / 30 | 89 | 741 | 115 |
| Latín de 4.º | 8 / 8 | 15 / 15 | 76 | 379 | 127 |
| Griego I | 14 / 14 | 28 / 28 | 92 | 332 | 171 |

Las listas de apartados y el número de tablas por apartado coinciden **estructuralmente** entre castellano y valenciano. Esto **no** acredita que cada explicación traducida tenga el mismo matiz filológico. No se presume que cada entrada léxica deba tener un paradigma individual de práctica: muchos son invariables, tienen modelos de terminación compartidos o carecen de flexión documentada de forma individual. Los emparejamientos automáticos de lema solo ayudan a localizar candidaturas y no autorizan fusiones ni adelantamientos curriculares.

## 2. Discrepancia demostrada y enmienda limitada

**Griego I, UD8, tercera declinación: vocativo de `ἐλπίς, ἐλπίδος`.**

- La tabla de Appendix incluye la casilla `ἐλπί*` para remitir a una **nota explicativa**: los temas en `-ιδ` pierden la dental en vocativo singular. El asterisco es signo editorial, no parte de la palabra.
- La importación morfológica incorporaba literalmente `ἐλπί*` como forma aceptada en ejercicios y rechazaba `ἐλπί`, que sí es el vocativo.
- **Enmienda aplicada solo al compilador de ScholaClassica:** la casilla de la tabla 113 se transpone de `ἐλπί*` a `ἐλπί`, con verificación exacta de la lectura fuente. Si cambia la tabla, el compilador **falla** en vez de realizar una sustitución silenciosa. Se añade evidencia en la ficha y pruebas de que la forma correcta se acepta y la grafía con asterisco se rechaza.
- Las otras nueve casillas del paradigma se conservan. No se cambia la fuente de Appendix; no se crean ni renumeran IDs morfológicos; el historial sigue asociado a su ficha anterior.

**Contrastes filológicos:** *Cambridge Grammar of Classical Greek* (2019), §4.40 (el vocativo de los temas dentales), y Philip S. Peek, *Ancient Greek I*, módulo 13 (vocativo `ἐλπί`). La gramática de Appendix (ES y VAL) ya explicaba la excepción correctamente.

**Control de regresión:** también se verifica el vocativo masculino singular `acer` en Latín I y Latín de 4.º y la conservación de las cinco formas plurales de `οὐρανός` en el banco, aunque estén excluidas del sorteo por decisión docente. La auditoría registra asteriscos u otros signos de llamada de nota que pudieran contaminar respuestas futuras.

## 2 bis. Segunda tanda: siete paradigmas griegos de riesgo (110 casillas)

La verificación selectiva se extiende a **siete paradigmas** de Griego I, mediante una matriz `scripts/audit-greek-high-risk.mjs` con **110 posiciones caso/género/número y 116 lecturas válidas** (incluidas las alternativas con `-ν` efelcística del dativo plural y la variante del vocativo de `μέγας`). Se contrasta cada casilla con tablas gramaticales independientes; no son 116 testimonios individualizados en textos clásicos.

| Paradigma | UD | Casillas cotejadas | Lecturas admitidas | Dictamen |
|---|---:|---:|---:|---|
| `ἐλπίς` | 8 | 10 | 11 | `ἐλπί` sin asterisco; corrección anterior |
| `ἡγεμών` | 8 | 10 | 11 | `ἡγεμών` es nominativo **y vocativo singular**, no `ἡγεμόν` |
| `ῥήτωρ` | 8 | 10 | 11 | `ῥῆτορ` vocativo; se conserva según Smyth §259 |
| `πατήρ` | 8 | 10 | 11 | **`πατήρ` nominativo** (no `πάτηρ`), `πάτερ` vocativo; alternancia fuerte/media/débil |
| `ἀνήρ` | 8 | 10 | 11 | `ἄνερ` vocativo; tema sincopado en oblicuos |
| `πολύς, πολλή, πολύ` | 5 | 30 | 30 | Paradigma escolar completo comprobado; no se inventa forma aislada |
| `μέγας, μεγάλη, μέγα` | 5 | 30 | 31 | `μεγάλε` vocativo masculino habitual; `μέγας` variante atestiguada |

### Enmiendas en este bloque

1. **`ἡγεμών` (UD8).** En la tabla original de Appendix la casilla vocativa figura `ἡγεμόν`. La gramática de Smyth (§259, columna `ἡγεμών`) registra como vocativo el mismo `ἡγεμών`, manteniendo la forma oxítona. Se ha corregido una **única casilla** en la práctica y la tabla de consulta de ScholaClassica, tanto en castellano como en valenciano, sin tocar los originales. La importación exige la lectura fuente original y falla ante cambios no revisados.
2. **`μέγας` (UD5).** El modelo de Appendix presentaba el nominativo `μέγας` como única forma de vocativo masculino singular. Smyth (§311 y nota a) y *Cambridge Grammar of Classical Greek* (§5.13) documentan como forma habitual **`μεγάλε`**, y Smyth señala que también se encuentra `μέγας`. En la gramática bilingüe se muestra `μεγάλε` en la tabla y se explica la variante. En morfología se **admiten las dos lecturas**, con `μεγάλε` prioritaria. La ficha mantiene su identificador y el corrector agrupa ambas soluciones para no penalizar una forma documentada.
3. **`πατήρ` (UD8).** La matriz ha detectado una tercera discrepancia: el Appendix bloqueado lleva `πάτηρ` tanto en el enunciado como en el nominativo singular. En ático, la forma correcta es **`πατήρ`** (Smyth §262; LSJ), mientras que el vocativo conserva el acento recesivo **`πάτερ`**. Se enmiendan solo las dos apariciones del enunciado y la casilla nominativa de la copia gramatical en castellano y valenciano; en el motor se corrigen el enunciado y el nominativo, conservando el vocativo, las restantes casillas y el ID del paradigma.
4. Se fijan pruebas negativas para las lecturas incorrectas `ἡγεμόν`, `ἐλπί*`, `πάτηρ`, y para una falsa sustitución de `ῥῆτορ`. Se comprueba también que el vocativo de `πολύς` no se rehaga por analogía y que las variantes `-σι(ν)` figuren como dos respuestas válidas.

**Referencias principales:** Herbert Weir Smyth, *Greek Grammar*, §§259, 262 y 311, https://grammars.alpheios.net/smyth/xhtml/body.1_div1.2_div2.4.html ; `Cambridge Grammar of Classical Greek`, §§4.40, 4.55 y 5.13, https://www.cs.toronto.edu/~simon/Athens/Thucydides3/cgcg.pdf ; gramática docente independiente de la tercera declinación, https://correll.github.io/greek-classroom-rome/grammar-06-third-declension.html . Estas referencias se registran en la auditoría privada, no como mensajes de procedencia al alumnado.

**Límites:** la matriz no se extrapola automáticamente a los otros paradigmas del banco. El contraste de 110 casillas no sustituye un cotejo de acentos y excepciones en cada resto de la gramática, ni justifica cambios en Vocabula o los bancos de GeneradorExamenes.

## 2 ter. Contraste latino paralelo: cinco adjetivos en dos cursos

Se añade una segunda matriz docente, `scripts/audit-latin-adjectives.mjs`, para cotejar de manera reproducible **360 casillas**: cinco paradigmas × 36 combinaciones de caso/género/número × dos asignaturas. Es un cotejo **flexivo y curricular** de modelos escolares, no la verificación de 360 testimonios en textos latinos. Se aplica a Latín I (UD2 para `bonus`, UD5 para el resto) y a Latín de 4.º (UD3 y UD7, respectivamente), preservando los identificadores y la progresión de cada curso.

| Paradigma | Rasgo filológico decisivo |
|---|---|
| `bonus, bona, bonum` | `bone` vocativo masc. singular; `bonā` ablativo femenino singular (cantidad no exigida por el corrector) |
| `brevis, breve` | `-i` ablativo singular, `brevia` neutro plural, `brevium` genitivo plural |
| `acer, acris, acre` | `acer` nominativo **y vocativo** masculino singular, no `acre`; `acri`, `acria`, `acrium` |
| `audax, audacis` | `audaci` ablativo singular, `audacia` neutro plural, `audacium` genitivo plural |
| `vetus, veteris` | Tema consonántico: **`vetere`** ablativo singular, **`veterum`** genitivo plural, `vetera` neutro plural |

La doble matriz **no ha exigido nuevas enmiendas** en estos diez modelos: las casillas de la copia integrada son coherentes con la distinción entre temas en *-i* y consonánticos. Se añaden pruebas negativas que simulan lecturas erróneas, por ejemplo `acre` por `acer`, `veteri` por `vetere` o `audacum` por `audacium`. Las unidades no se igualan entre 4.º y Bachillerato, porque son secuenciaciones docentes distintas.

**Contrastes principales:** Allen y Greenough, *New Latin Grammar*, §§110 y 114–119, editado en [Dickinson College Commentaries](https://dcc.dickinson.edu/grammar/latin/3rd-declension-adjectives-classification-and-paradigms); [DCC, Latin Core Vocabulary](https://dcc.dickinson.edu/latin-core-list1). No se añaden variantes hipotéticas por analogía ni se altera Appendix.

## 3. Decisiones docentes aplicadas y reservas curriculares

### A. `lavor, lavatus sum`: uso medio-pasivo/reflexivo de `lavo`

El vocabulario de **Examen UD10**, fuera de las ocho unidades habituales, contiene seis formas de aspecto pasivo, entre ellas `lavor, lavatus sum`, glosada «lavarse» (ID `f17ac10e4e2d3b55`). Los otros ejemplos de este grupo corresponden a deponentes habituales (`admiror`, `conor`, `persequor`, `polliceor`, `utor`). Pero `lavor` también es forma **medio-pasiva** de `lavo`, verbo que tiene paradigma activo. Logeion (Lewis & Short, bajo `lavo`) documenta el empleo medio de `lavor`; Allen y Greenough distinguen los verbos deponentes de los verbos activos con valor medio-pasivo. **No hay base para redefinirlo unilateralmente como deponente puro**.

**Decisión docente aprobada (15 de noviembre de 2026, opción A):** identificar expresamente `lavor, lavatus sum` como **uso medio-pasivo/reflexivo de `lavo`, no como verbo deponente puro**. La copia integrada presenta una nota interpretativa en las fichas General (`e9f4ac2d73fdd5c0`) y Examen (`f17ac10e4e2d3b55`), en el diccionario y después de las respuestas. No altera el enunciado, la glosa «lavarse», la unidad UD10, los IDs, el historial, las respuestas aceptadas ni la fuente Vocabula independiente. En «Todo el vocabulario» se conserva la nota al combinar fichas idénticas.

Fuentes de consulta: https://logeion.org/lavo ; https://romanreader.lyceum.institute/grammar/allen-greenough/verbs

### B. Límites curriculares

- **Latín de 4.º:** gramática y práctica terminan en UD8 por diseño aprobado. Vocabula General mantiene 44 fichas etiquetadas UD9 y 42 UD10, mientras que Examen conserva seis fichas UD10. No se trasladan a UD8 ni se añaden como morfología disponible. El hecho de que aparezcan en el material complementario no obliga a exigirlas.
- **Latín I:** la lista de Examen termina en UD7; no hay listas acreditadas UD8–UD10.
- **Griego I:** Examen termina en UD10; no hay listas acreditadas UD11–UD14. El repertorio alfabético no asignado sigue siendo complementario.

**Decisión docente aprobada (15 de noviembre de 2026, opción A):** en Vocabula de Latín de 4.º, **ocultar las UD9 y UD10 del selector habitual**. El alumnado puede recuperar esas unidades mediante la casilla «Mostrar ampliación · UD9 y UD10 (opcional)», inicialmente desmarcada. El botón «Todas» solo marca los bloques visibles; al desactivar la ampliación se cierran las sesiones anteriores y desaparecen las casillas complementarias, sin borrar fichas ni progreso. Al cambiar de asignatura, la ampliación se desactiva por seguridad curricular. El acceso explícito funciona en General, Examen y Todo; las unidades sin fichas de un determinado corpus no se inventan. Las fichas y su clasificación académica permanecen intactas en los dos bancos. Las listas de Latín I UD8–UD10 y Griego I UD11–UD14 siguen en reserva, sin promoción automática.

### C. Límites del cotejo

No se han acreditado **discrepancias explícitas de género** entre los sustantivos cuyos lemas y géneros pudieron cruzarse sin ambigüedad. `φύλαξ` se documenta en Vocabula como común a masculino y femenino: es una variedad legítima de transcripción (`ὁ, ἡ` frente a `ὁ o ἡ`), **no** un error de género. Los paradigmas de tercera declinación derivados de modelos no deben adquirir género único por deducción automática.

Este bloque no equivale a verificar individualmente todos los lemas ni todas las traducciones ES/VAL; tampoco certifica que 2.055 fichas hayan recibido revisión lexicográfica palabra por palabra. Sus pruebas comprueban la integridad de datos, los cruces posibles, la enmienda de Griego I y las dos decisiones docentes de presentación; no certifican de forma individual la totalidad del léxico.

## 4. Ruta de ejecución y siguiente bloque

```bash
npm run build
npm run audit:filologia:transversal
npm test
```

El informe JSON queda **solo como artefacto privado de GitHub Actions** en `build/academic-audits/transversal/filologia-transversal-v1.json`; no se entrega a la PWA del alumnado. El siguiente bloque recomendado es una inspección individual de los modelos nominales y los verbos con clasificación potencialmente equívoca, seguida de lectura contrastiva ES/VAL de los pasajes de mayor riesgo. No fusionar ni publicar estas modificaciones de manera implícita.
