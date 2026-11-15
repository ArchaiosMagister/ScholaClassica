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
