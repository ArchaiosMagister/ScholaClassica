# Evolutio valenciano — conciliación académica (actualización 16/11/2026)

## Estado vigente y protección de la versión publicada

Este trabajo **sigue siendo privado y no jugable**. La matriz valenciana conserva **522** étimos identificados por ID del origen fijado (Evolutio independiente); la ampliación de **100 fichas castellanas** recientemente publicada en ScholaClassica **no se traduce automáticamente ni se incorpora** a esta matriz. Por tanto, las 100 nuevas palabras siguen solo en castellano.

| Estado (16/11/2026) | Entradas | Significado |
|---|---:|---|
| Correspondencia léxica `documentat` | **32** | Etimología y acepción corroboradas en el DCVB; no equivale a validación normativa del DNV |
| `proposta` | **206** | Propuesta no contrastada individualmente |
| `pendent` | **284** | Sin solución habilitada; incluye tres reservas solo castellanas |
| Análisis fonéticos editoriales | **32** | Segmentos revisados; cuatro decisiones docentes recuperadas, seis análisis nuevos |
| Casos reservados solo castellano | **3** | `octo`, `dictum`, `sigĭllum`: ninguna respuesta valenciana entregable |
| Normas certificadas para evaluación | **0** | Sigue faltando contraste normativo individual y aprobación integral |
| Fichas habilitadas para test valenciano | **0** | No publicar hasta cerrar la verificación |

### Decisiones docentes consolidadas

- `noctem → nit`: **VOCALITZACIÓ y SIMPLIFICACIÓ**, provisionalmente, con etapa *nuit* explícita; no se certifica el encadenamiento histórico.
- `matrem → mare`: **SIMPLIFICACIÓ** de `-tr-` por pérdida de *t*.
- `fabam → fava` y `caballum → cavall`: debilitamiento intervocálico `-b- → -v-` **explicado sin ley seleccionable**. En `caballum`, revisar **PALATALITZACIÓ** de `-ll-` y **APÒCOPE** de `-u`; `fabam` conserva únicamente pérdida fija de `-m` y no sirve para un test de leyes.
- `cælum → cel`: **MONOFTONGACIÓ** y **PALATALITZACIÓ** según decisión docente. La pérdida de la vocal final no se certifica como norma adicional.
- `fĕrrum → ferro`: **OBERTURA** de `-u` a `-o`; se mantiene sin añadir falsa diptongación.
- `ocŭlum → ull`: **SÍNCOPE** de `ŭ` postónica, seguida de **PALATALITZACIÓ** del grupo `-cl-`, con base vulgar `ŏclu` documentada por DCVB.

Las decisiones sobre el análisis de una palabra **no significan** que se hayan verificado todas sus reglas con DNV ni que la ficha quede aprobada para evaluación. Los indicadores `dnvIndividualChecked`, `teacherApproved` y `playable` permanecen en `false`.

### Seis correspondencias documentadas de nuevo

| Forma latina | Resultado valenciano | DCVB | Análisis editorial no certificado |
|---|---|---|---|
| `cælum` | cel | [cel](https://dcvb.iec.cat/results.asp?word=cel) | MONOFTONGACIÓ + PALATALITZACIÓ |
| `ocŭlum` | ull | [ull](https://dcvb.iec.cat/results.asp?word=ull) | SÍNCOPE + PALATALITZACIÓ |
| `scholam` | escola | [escola](https://dcvb.iec.cat/results.asp?word=escola) | PRÒTESI + EVOLUCIÓ DE GRAFIES GREGUES |
| `fŏntem` | font | [font](https://dcvb.iec.cat/results.asp?word=font) | APÒCOPE |
| `salutem` | salut | [salut](https://dcvb.iec.cat/results.asp?word=salut) | APÒCOPE |
| `portum` | port (port marítimo) | [port](https://dcvb.iec.cat/results.asp?word=port) | APÒCOPE |

**Reserva histórica:** `octo → huit` y `dictum → dit` quedan apartadas hasta contrastar sus etapas históricas. `sigĭllum → segell` puede anotarse para estudio histórico interno, con aviso explícito de que el DCVB lo caracteriza como voz arcaica reintroducida en el uso culto; **no** autoriza una evolución patrimonial evaluable. La reserva se conserva como dato privado, mientras que las tres fichas aparecen **solo en castellano**.

**Próxima tanda:** `shared/academic/evolutio-valenciano/cola-revisio-24.json` selecciona 24 propuestas particularmente útiles y relativamente deducibles para auditoría individual de DCVB, DNV y secuencia fonética. No son candidaturas autorizadas para preguntas.

Archivos activos: `conciliacion-curada.json`, `revisio-32-2026-11-16.json`, `matriz-522.json`, `normas.json`, `cola-revisio-24.json`. El antiguo `revisio-26.json` se retiene como evidencia histórica. El generador sigue bloqueando la activación accidental de respuestas, la asignación de leyes ajenas al repertorio y la publicación de datos valencianos no revisados.

---

## Foto histórica del arranque (13/11/2026; sustituida por el estado de arriba)

Se ha preparado la **matriz de los 522 étimos** del banco de Evolutio integrado en ScholaClassica, con el mismo SHA de origen establecido en `config/sources.lock.json`. No se ha cambiado el banco castellano, ni el motor, ni el servicio offline. **No se ha activado la práctica en valenciano.**

| Estado del resultado valenciano | Entradas | Acredita |
|---|---:|---|
| `documentat` | **26** | Correspondencia y etimología de la acepción en el DCVB (documentación léxica inicial) |
| `proposta` | **215** | Hipótesis de equivalencia pendiente de contraste individual; **no** cuenta como verificación |
| `pendent` | **281** | Sin resultado propuesto por ahora |
| Análisis valencianos con propuesta editorial revisada | **22** | Se han localizado los cambios y posiciones; falta validación normativa individual y autorización docente |
| Discrepancias fonéticas individuales | **4** | Se reservan para decisión docente con justificación |
| Normas con validación completa para práctica | **0** | No están certificadas ni aprobadas para sorteo |
| Fichas valencianas autorizadas para práctica | **0** | No se publica contenido inacabado |

## Primera revisión filológica individual (13/11/2026)

Se han contrastado las etimologías de las **26 correspondencias documentadas**, consultando el artículo y la acepción adecuada del DCVB. Los tramos de norma se han revisado editorialmente **para 22 étimos**, sin copiar el análisis castellano. Quedan **4 discrepancias** documentadas: `noctem → nit`, `matrem → mare`, `fabam → fava` y `caballum → cavall`. En las dos últimas no debe equipararse la lenición de `-b-` a `-v-` con la sonorización de una oclusiva sorda.

El archivo `shared/academic/evolutio-valenciano/revisio-26.json` contiene las 22 segmentaciones revisadas, las explicaciones y los motivos de cada discrepancia. El generador valida que **cada intervalo coincida exactamente con los caracteres Unicode del étimo**, y registra automáticamente la pérdida fija de `-m` cuando procede. `mel → mel` carece de normas seleccionables: es apta conceptualmente para consulta, pero no para una pregunta que exija identificar cambios.

**Límites de esta revisión:** el DNV de la AVL no ha podido consultarse entrada por entrada por la vía automatizada utilizada. Se ha contrastado directamente la etimología en el DCVB, pero no se certifica la comprobación normativa individual del DNV. El estado `analisi_editorial_revisada` **no equivale a `normasVerificadas`**, ni a aceptación docente, ni habilita el ejercicio: los tres indicadores permanecen en cero cuando así corresponde.

La revisión de `clauem → clau` distingue la **clau femenina** procedente de `clāve` de la **clau masculina** procedente de `clavu`. En otras palabras, como `coll`, se conserva la acepción etimológica precisa. Las normas que describen cambios fonéticos sin cambio de letra (p. ej., `-ll-` latina geminada → `ll` palatal) llevan nota explícita.

Los recuentos se recalculan a partir de `matriz-522.json`; no deben darse por verificados todos los resultados solo por estar escritos. La opción `documentat` **no** significa aprobación docente ni comprobación completa de las leyes de evolución.

## Ficheros

- `shared/academic/evolutio-valenciano/normas.json`: **17 normas valencianas exactamente como las facilitó el docente**, más `FIX_M` no seleccionable. Las categorías castellanas `ASPIR`, `MIN_MBR` y `CUL` no se transfieren automáticamente.
- `shared/academic/evolutio-valenciano/conciliacion-curada.json`: 26 correspondencias con fuente y 215 propuestas de trabajo diferenciadas, con notas de revisión cuando corresponde.
- `shared/academic/evolutio-valenciano/matriz-522.json`: todas las fichas por **ID original**, forma latina, respuestas castellanas, procedencia y resultado valenciano documentado/propuesto/pendiente. Cada fila conserva campos separados para normas, explicación, dificultad, aprobación docente y disponibilidad en práctica; permanecen vacíos/bloqueados hasta revisarse.
- `scripts/reconcile-evolutio-valenciano.mjs`: generador determinista que comprueba el SHA del origen y rechaza duplicados, candidaturas ajenas al banco y documentación falsa.
- `tests/evolutio-valenciano-conciliacion.test.mjs`: asegura cobertura, reglas, integridad, reproducibilidad y ausencia del registro en la web publicada.

Para comprobar la conciliación sin modificar ficheros: `npm run evolutio:val:check`. Para reconstruir la matriz deliberadamente tras revisar `conciliacion-curada.json`: `npm run evolutio:val:build`. Ambos comandos requieren el repositorio `.sources/evolutio` en el **commit exacto** establecido en el bloqueo. La CI verifica de forma obligatoria que la matriz esté actualizada.

## Primeras correspondencias documentadas

El *Diccionari català-valencià-balear* (DCVB) proporciona, para estas acepciones, el lema valenciano/catalán y una etimología latina explícita. El *Diccionari normatiu valencià* (AVL) se utilizará para la **confirmación normativa de cada resultado** antes de pasarlo a la modalidad de práctica.

| Étimo | Castellano | Valenciano | Referencia |
|---|---|---|---|
| `focum` | fuego | **foc** | [DCVB: foc](https://dcvb.iec.cat/results.asp?word=foc) |
| `noctem` | noche | **nit** | [DCVB: nit](https://dcvb.iec.cat/results.asp?word=nit) |
| `clauem` | llave | **clau** (femenino) | [DCVB: clau](https://dcvb.iec.cat/results.asp?word=clau) |
| `lupum` | lobo | **llop** | [DCVB: llop](https://dcvb.iec.cat/results.asp?word=llop) |
| `filium` | hijo | **fill** | [DCVB: fill](https://dcvb.iec.cat/results.asp?word=fill) |
| `matrem` | madre | **mare** | [DCVB: mare](https://dcvb.iec.cat/results.asp?word=mare) |
| `uitam` | vida | **vida** | [DCVB: vida](https://dcvb.iec.cat/results.asp?word=vida) |
| `tĕrram` | tierra | **terra** | [DCVB: terra](https://dcvb.iec.cat/results.asp?word=terra) |
| `pŏrtam` | puerta | **porta** | [DCVB: porta](https://dcvb.iec.cat/results.asp?word=porta) |
| `fĕrrum` | hierro | **ferro** | [DCVB: ferro](https://dcvb.iec.cat/results.asp?word=ferro) |
| `pontem` | puente | **pont** | [DCVB: pont](https://dcvb.iec.cat/results.asp?word=pont) |
| `caballum` | caballo | **cavall** | [DCVB: cavall](https://dcvb.iec.cat/results.asp?word=cavall) |

También se han consignado los resultados documentados de `buccam → boca`, `chartam → carta`, `annum → any`, `farinam → farina`, `fabam → fava`, `catenam → cadena`, `gallinam → gallina`, `scalam → escala`, `cuppam → copa`, `caulem → col`, `collum → coll`, `flammam → flama`, `ollam → olla` y `mel → mel`. Cada referencia individual está guardada en el registro de curación.

La palabra `clau` presenta homonimia: la acepción **femenina** 'llave' corresponde a `clauem`, no el masculino 'clavo' procedente de `clavum`. Se conserva la distinción explícita. En `pluuiam → pluja`, el DCVB remite a una base vulgar `plŏia`; por ello se mantiene como **propuesta**, no como correspondencia histórica definitivamente verificada del étimo clásico escrito en el banco.

## Política de revisión de las normas

El inventario de **17** nombres valencianos está aprobado como **catálogo**, no como análisis de los 522 étimos. Está prohibido copiar automáticamente `changes`, `spans`, resultados parciales o explicaciones del castellano.

La revisión por ficha debe establecer: (1) resultado y acepción valencianos con comprobación normativa, (2) relación etimológica exacta y carácter patrimonial/culto, (3) todas las normas valencianas aplicables con fragmentos localizados en el étimo, (4) la caída fija de `-m` cuando proceda, (5) explicación didáctica, (6) revisión docente. Las fichas con discrepancias se apartan del sorteo; si no existe un resultado adecuado, se mantiene únicamente la modalidad castellana.

Para poder alternar de lengua **a mitad de una misma sesión**, el futuro motor exigirá pares completos verificables en las dos lenguas; guardará por lengua las respuestas, intentos y correcciones. Una coincidencia de grafía (p. ej. `uitam → vida` en las dos lenguas) **no implica** coincidencia automática de análisis ni aprobación.

## Próxima tanda de auditoría

Primero comprobar, con DNV/DCVB y fuentes históricas, la segmentación individual de las **26 correspondencias léxicas documentadas**; después contrastar las **215 propuestas** por lotes, dando prioridad a los étimos patrimoniales transparentes y a las normas menos representadas. Mantener las **281 restantes** sin resultado hasta reunir evidencia, en lugar de crear equivalencias por semejanza.

**Alcance de esta entrega:** registro, fuentes, propuestas, clasificación de evidencia y controles. Sin cambio de interfaz, sin datos de respuesta valencianos públicos y sin alteración de repositorios originales.
