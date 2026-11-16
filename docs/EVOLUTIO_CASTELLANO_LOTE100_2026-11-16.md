# Evolutio castellano · incorporación didáctica de 100 étimos (16-11-2026)

## Origen y límites
- Excel del docente recuperado de la biblioteca: `banco_evolucion_fonetica_PAU_2026_actualizado.xlsx`, hoja **Banco** (1.055 registros; 594 marcados `PATRIMONIAL`).
- Huella SHA-256: `c9ce2716b1eb68183f20c4bb28615841a6ae9300317ebd6c57d046f0e0cb28be`.
- Selección de **100 filas patrimoniales** no presentes, ni con grafía diacrítica distinta, en las **522 fichas inmovilizadas** de Evolutio. Cruce por IDs y por lemas normalizados (u/v, æ/ae, œ/oe y diacríticos), incluyendo las 240 entradas procedentes de GeneradorExamenes.
- Prioridad al reconocimiento del resultado castellano: 90 filas del Excel tenían una o dos categorías principales; diez requieren más. La facilidad de deducir la palabra patrimonial prevalece sobre el recuento de normas. Ningún nombre propio se ha añadido.
- Se han mantenido fuera las entradas reservadas `inde` y `pirum`, los duplicados, las voces no patrimoniales, las que no tenían ninguna norma documentada y varios casos de resultado difícil de deducir o con cadena histórica poco clara.
- Esta selección es **editorial y didáctica** a partir del Excel del docente; no constituye auditoría lexicográfica externa completa. Las anotaciones quedan trazadas por fila para futuras correcciones docentes.

## Adaptación
- Los 100 registros y sus fragmentos están en `scripts/evolutio-castellano-lote100.mjs`; cada uno tiene forma latina, resultado español, ley, posición, salida y explicación.
- Se conserva la grafía latina escolar **u** para la consonante `v`, además de las marcas breves que ayuden a identificar diptongaciones.
- La caída de **-m** final se añade como `FIX_M` no seleccionable. La terminación **-um > -o** conserva la abertura de la **u** como fenómeno independiente.
- La compilación copia primero el banco original inmutable y **añade el lote únicamente a `dist/apps/evolucion-fonetica/data/pilot.json`**, sin escribir en el repositorio EvolucionFonetica.
- Tras añadir el lote, se recalcula `data/difficulty.json` según el criterio de **deducibilidad v3** vigente; las decisiones docentes originales mantienen origen y nivel.
- Las 622 fichas permanecen accesibles en *Estudiar*; 587 son elegibles para las prácticas después de excluir los 35 nombres propios originales. Siguen funcionando la práctica general, la práctica por norma, los niveles de dificultad y el modo sin conexión.
- El SW utiliza una nueva versión de caché `lote100-v6` para evitar que la app conserve el banco anterior.
- La conciliación **valenciana** y el **Evolutio independiente** permanecen intactos.

## Ejemplos de las nuevas incorporaciones
| Etimo | Resultado | Cambios evaluables del Excel |
|---|---|---|
| `capram` | cabra | sonorización |
| `lacrimam` | lágrima | sonorización |
| `lactem` | leche | palatalización |
| `patrem` | padre | sonorización |
| `petram` | piedra | diptongación y sonorización |
| `pineam` | piña | palatalización |
| `sŏlet` | suele | diptongación |
| `vinum` | vino | abertura final y pérdida fija de -m |
| `cabannam` | cabaña | palatalización |
| `tabulam` | tabla | síncopa |

## Invariantes comprobables
- Origen original: **522** fichas, y **522** asignaciones originales, sin ningún cambio de los objetos de origen.
- Extensión: **100** nuevas con IDs estables `xl-<fila del Banco>`, **622** fichas integradas sin colisiones, sin nombres propios nuevos y sin ninguna ley fuera del repertorio oficial.
- Práctica: **587** elegibles (35 nombres propios excluidos), con `FIX_M` no seleccionable.
- Comprobar `validationErrors` en el banco ampliado y la integridad de filtros, dificultad, cachés y progreso mediante CI antes de fusionar o publicar.
