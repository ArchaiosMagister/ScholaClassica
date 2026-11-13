# Evolutio valenciano — conciliación académica inicial (13/11/2026)

## Alcance y estado

Se ha preparado la **matriz de los 522 étimos** del banco de Evolutio integrado en ScholaClassica, con el mismo SHA de origen establecido en `config/sources.lock.json`. No se ha cambiado el banco castellano, ni el motor, ni el servicio offline. **No se ha activado la práctica en valenciano.**

| Estado del resultado valenciano | Entradas | Acredita |
|---|---:|---|
| `documentat` | **26** | Correspondencia y etimología de la acepción en el DCVB (documentación léxica inicial) |
| `proposta` | **215** | Hipótesis de equivalencia pendiente de contraste individual; **no** cuenta como verificación |
| `pendent` | **281** | Sin resultado propuesto por ahora |
| Normas valencianas verificadas en fichas | **0** | Aún no se han localizado cambios y posiciones en cada étimo |
| Fichas valencianas autorizadas para práctica | **0** | No se publica contenido inacabado |

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
