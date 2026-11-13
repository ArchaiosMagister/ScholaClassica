# Evolutio valenciano — conciliación académica inicial (13/11/2026)

## Alcance y estado

Se ha preparado la **matriz de los 522 étimos** del banco de Evolutio integrado en ScholaClassica, con el mismo SHA de origen establecido en `config/sources.lock.json`. No se ha cambiado el banco castellano, ni el motor, ni el servicio offline. **No se ha activado la práctica en valenciano.**

| Estado del resultado valenciano | Entradas | Acredita |
|---|---:|---|
| `documentat` | **218** | 26 iniciales más **192 correspondencias** con relación etimológica cotejada en el DCVB; análisis fonético y DNV pendientes |
| `proposta` | **23** | Propuestas reservadas: 4 derivaciones directas descartadas, 19 con evidencia insuficiente o mediación histórica pendiente |
| `pendent` | **281** | Sin resultado propuesto por ahora |
| Análisis valencianos con clasificación editorial registrada | **26** | 25 con criterios aceptados o propuestas previas y **1 clasificación provisional** (`noctem`) |
| Discrepancias fonéticas sin decisión docente | **0** | Las cuatro cuestiones anteriores tienen una decisión de criterio registrada |
| Normas con validación completa para práctica | **0** | No están certificadas ni aprobadas para sorteo |
| Fichas valencianas autorizadas para práctica | **0** | No se publica contenido inacabado |

## Primera revisión filológica individual (13/11/2026)

Se han contrastado las etimologías de las **26 correspondencias documentadas**, consultando el artículo y la acepción adecuada del DCVB. Los tramos de norma se han revisado editorialmente para **26 étimos**, sin copiar el análisis castellano. Las cuatro discrepancias previas se han resuelto mediante **decisiones expresas del docente del 13/11/2026**: una clasificación provisional y tres criterios aceptados. La resolución de un criterio **no equivale** a la validación normativa del DNV ni a la aprobación final de una ficha para uso en ejercicios.

El archivo `shared/academic/evolutio-valenciano/revisio-26.json` contiene las 26 segmentaciones editoriales, cuatro decisiones docentes registradas, explicaciones y las reservas que proceden. El generador valida que **cada intervalo coincida exactamente con los caracteres Unicode del étimo**, y registra automáticamente la pérdida fija de `-m` cuando procede. `mel → mel` carece de normas seleccionables: es apta conceptualmente para consulta, pero no para una pregunta que exija identificar cambios.

### Decisiones docentes incorporadas el 13/11/2026

| Étimo → resultado | Decisión | Normas seleccionables registradas | Fenómeno explicado, no seleccionable |
| --- | --- | --- | --- |
| `noctem → nit` | Admitir **provisionalmente** la secuencia que incluye la etapa histórica *nuit* | `VOC` (segmento `c` de `-ct-`), `SIMPL` (**fase intermedia**, sin atribuir segmento literal a `noctem`), `APOC` (vocal final `e`) | Ninguno; la simplificación *nuit → nit* queda marcada como provisional |
| `matrem → mare` | Aceptar pérdida de `t` de `-tr-` | `SIMPL` (segmento `t`) | Ninguno |
| `fabam → fava` | Explicar el cambio de `-b-` intervocálica a `-v-` sin exigir una nueva norma | **Ninguna** norma seleccionable | `debilitament_intervocalic`, segmento `b` |
| `caballum → cavall` | Explicar igual debilitamiento y exigir únicamente las normas restantes acreditadas | `PALAT` (`ll`), `APOC` (`u` final) | `debilitament_intervocalic`, segmento `b` |

En las cuatro fichas que parten de acusativo terminado en `-m` se conserva `FIX_M` como **pérdida fija no seleccionable**. La aceptación de la clasificación se guarda en `criterioDocente` con fecha, alcance y nivel provisional o aceptado; el campo diferente `aprobadoDocente` permanece en `false` porque no se ha emitido aprobación final de uso docente. `dnvIndividualChecked=false` y `aptoParaPractica=false` en todos los casos.

Las fases no literales del étimo se registran mediante `historicalStage` y `anchor`, no mediante un tramo ficticio del étimo. El debilitamiento `-b- → -v-` se almacena en `fenomensNoSeleccionables` y queda fuera del motor de corrección por leyes. El validador rechaza que se etiquete erróneamente como `SONOR` en estas dos palabras.

**Límites de esta revisión:** el DNV de la AVL no ha podido consultarse entrada por entrada por la vía automatizada utilizada. Se ha contrastado directamente la etimología en el DCVB, pero no se certifica la comprobación normativa individual del DNV. El estado `analisi_editorial_revisada` **no equivale a `normasVerificadas`**, ni a aceptación docente, ni habilita el ejercicio: los tres indicadores permanecen en cero cuando así corresponde.

La revisión de `clauem → clau` distingue la **clau femenina** procedente de `clāve` de la **clau masculina** procedente de `clavu`. En otras palabras, como `coll`, se conserva la acepción etimológica precisa. Las normas que describen cambios fonéticos sin cambio de letra (p. ej., `-ll-` latina geminada → `ll` palatal) llevan nota explícita.

Los recuentos se recalculan a partir de `matriz-522.json`; no deben darse por verificados todos los resultados solo por estar escritos. La opción `documentat` **no** significa aprobación docente ni comprobación completa de las leyes de evolución.

## Auditoría de las 215 candidaturas iniciales — contraste filológico individual (13/11/2026)

Se ha recorrido el inventario completo de las **215 propuestas originales**. **192 correspondencias** disponen de documentación etimológica y de acepción en artículos del DCVB, con referencia individual conservada. **23 se mantienen en reserva** porque la consulta no ofrece evidencia suficiente de la filiación directa, se necesita una variante histórica intermedia o el étimo propuesto es incorrecto. Ninguna se ha declarado apta para práctica fonética: las comprobaciones de DNV, las 17 leyes y la aprobación docente son tareas posteriores e independientes. El archivo `auditoria-215.json` conserva los 215 IDs, el tipo de resultado, la referencia cuando existe y la justificación editorial de la reserva.

**Resoluciones claras:** `germanum → germà`, `mensem → mes`, `mĕliorem → millor`, `octo → huit` (forma valenciana que el DCVB recoge como variante de `vuit`), `pilum → pèl`, `fŏrtia → força`, `martium → març`, `sagitta → sageta`, `signa → senya`, `alium → all`, `damnum → dany`, `peccatum → pecat`, `bibere → beure` y `currere → córrer`. En `luxum → luxe`, `fibram → fibra`, `membrum → membre`, `temperare → temperar`, `uirtutem → virtut`, `uoluntatem → voluntat` y `nauigare → navegar`, el DCVB indica explícitamente préstamo o latinismo: el resultado léxico está documentado, pero su transmisión **no puede simplificarse como evolución patrimonial regular**.

**Etapas históricas y homónimos:** `uiduam → viuda` presenta una forma popular `viuva` y contaminación con la culta `vídua`; `ausare → gosar` presenta una consonante inicial añadida de explicación discutida; `tædam → tea` se documenta como variante de `teia` a través de las fases `teda/tesa`. `uitem → vit` está documentado solo para la acepción histórica de 'sarmiento', no `vit` masculino 'miembro viril', que procede de otro étimo. `bonum → bo`, `ferum → fer` y `portum → port` obligan a seleccionar la acepción precisa para evitar homónimos.

**Cuatro derivaciones directas descartadas**, que no deben entrar en ningún sorteo con los étimos actuales:

1. `sensum → seny`: el DCVB lo relaciona fundamentalmente con el germánico `sinn`, con posible cruce con `sensus`.
2. `catenatum → cadenat`: el DCVB registra **derivación de `cadena`**, no filiación directa desde `catenatum`.
3. `cæpullam → ceba`: `ceba` procede del latín `cēpa`, no del diminutivo ofrecido.
4. `serpĕntem → serp`: el DCVB remite a la base `serpe`, no al acusativo `serpĕntem`.

**Otros casos reservados:** `datum → dau` tiene etimología discutida; `pluuiam → pluja` requiere una base vulgar `*plŏia`; `totum → tot` exige la forma vulgar intensiva `tottu`; `ocŭlos → ulls` exige distinguir la evolución de `ull` (`*ŏclu`) de su plural; `iacere → jaure` ha de comprobarse por remisión a `jeure`. Se preservan también sin acreditación exhaustiva los restantes casos anotados en el fichero de auditoría, en lugar de inferir la relación por semejanza léxica.

**Estado final del lote:** 192 con correspondencia etimológica documentada, 23 reservadas (de ellas 4 derivaciones directas descartadas), cero fichas fonéticas nuevas verificadas y cero ejercicios habilitados.

## Ficheros

- `shared/academic/evolutio-valenciano/normas.json`: **17 normas valencianas exactamente como las facilitó el docente**, más `FIX_M` no seleccionable. Las categorías castellanas `ASPIR`, `MIN_MBR` y `CUL` no se transfieren automáticamente.
- `shared/academic/evolutio-valenciano/conciliacion-curada.json`: 218 correspondencias con referencia etimológica (26 iniciales y 192 del lote auditado) y 23 propuestas reservadas; ninguna ficha nueva incorpora leyes sin verificación.
- `shared/academic/evolutio-valenciano/auditoria-215.json`: registro exhaustivo de las 215 propuestas originales: **192** cotejos etimológicos documentados, **23** reservas, cuatro relaciones directas descartadas y referencias individuales solo cuando corresponde.
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

## Siguiente etapa

Realizar la auditoría **fonética por palabra** de las correspondencias documentadas, empezando por los resultados patrimoniales más claros, con tramos en el étimo, explicación en valenciano y registro separado de cambios no seleccionables. Para las 23 candidaturas reservadas, solo corregir el étimo o aprobar una cadena histórica cuando la fuente lo permita; las cuatro derivaciones directas descartadas nunca se habilitarán bajo su forma actual. Contrastar las grafías y variantes de uso valenciano en el DNV de la AVL antes del uso docente. Las **281 fichas sin propuesta** permanecen intactas.

**Alcance de esta entrega:** curación etimológica, evidencias, incidencias y controles. Sin cambiar el motor, sin cambiar la web pública y sin modificar los repositorios independientes.
