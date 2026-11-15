# Cierre de presentación curricular del vocabulario · Latín I y Griego I

**Fecha:** 14 de noviembre de 2026. **Ámbito:** exclusivamente el vocabulario integrado de ScholaClassica, sin modificar los proyectos originales.

## Decisión docente aplicada

El vocabulario etiquetado como ampliación o sin unidad en el banco académico se conserva con **sus valores internos, IDs, traducciones, unidades y procedencia**. La interfaz estudiantil muestra rótulos comprensibles sin asignar artificialmente palabras a unidades docentes ni convertir vocabulario de estudio en exigible.

| Curso | Valor persistente (no se modifica) | Etiqueta visible para el alumnado | Recuento acreditado |
| --- | --- | --- | --- |
| Latín I | `UD 11–12` | «Ampliación · fuera de las unidades habituales» | 140 fichas de General con la etiqueta; 82 solo tienen esa etiqueta y, de ellas, 73 no tienen otro registro del lema con unidad anterior |
| Griego I | `Sin unidad acreditada` | «Complementario · sin unidad asignada» | 184 fichas de General sin unidad curricular documentada |

**Importante:** las 140 fichas etiquetadas `UD 11–12` no son 140 fichas distintas del resto del temario: 58 también tienen alguna unidad anterior y otras 9 (entre las 82 exclusivas) coinciden por lema con una ficha distinta que tiene unidades anteriores. El grupo de ampliación **no debe presentarse como 140 palabras nuevas o exigibles**.

«General» significa repertorio de estudio: puede contener vocabulario que también figure en Examen, además de ampliaciones. «Examen» sigue siendo el subconjunto de la lista de examen por unidad, **sin añadir los 73 lemas latinos de ampliación ni las 184 fichas griegas no adscritas**. «Todo el vocabulario» conserva la suma de ambos repertorios, deduplicada solo para fichas idénticas y con la procedencia de cada modalidad.

## Garantías

1. Los `value` de los checkboxes, `units`, `mode`, `id`, `meaning`, `answers`, `originals` y los registros de progreso son idénticos antes y después. Se modifica solamente el texto visible del selector, las notas de alcance y la lectura de la procedencia.
2. La misma etiqueta amable aparece en los resultados de consulta, en las cabeceras de los ejercicios y al mostrar la procedencia de «Todo».
3. Las cinco divergencias ya aceptadas de Latín I (*ac, atque, flumen, Caesar, eques*) conservan unidades distintas en General y Examen; los grupos complementarios no adelantan ninguna forma a otra unidad.
4. Latín de 4.º y Latín II siguen sin cambios de clasificación; **«Núcleo frecuente» de Latín II no se denomina exigible**. El programa de morfología, la gramática y el área docente tampoco cambian.
5. Toda la adaptación se aplica en `dist/apps/vocabulario/`, después de generar la copia estudiantil. El origen `ArchaiosMagister/VocabulaLatinaGraecaque` permanece fijado en `config/sources.lock.json`, sin cambios.

## Validación

`tests/vocabula-complementary.test.mjs` comprueba los recuentos y etiquetas, la integridad de las 2.055 fichas y la invariabilidad de unidades e IDs. `tests/vocabula-browser.mjs` comprueba los modos General, Examen y Todo, incluyendo sus etiquetas, la consulta de fichas, el formulario de avisos y la visualización móvil. Deben superar también las demás baterías de ScholaClassica (incluidas PWA offline y seguridad).

**Publicación:** pendiente de autorización expresa. Esta intervención solo genera una PR para revisión.
