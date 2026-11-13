# Etymologicon · Glosario de estudio de Griego I

## Alcance

La zona **Estudio del léxico**, accesible en `/apps/etymologicon/estudio.html`, consulta el mismo inventario de los ejercicios, sin calificarlos y sin modificar el progreso. Contiene **111 étimos** (108 con ejercicios, tres solo de consulta) y **487 derivados españoles** distintos. Cada palabra presenta una definición didáctica, las unidades en que se estudia el étimo, la relación semántica griega y sus componentes cuando se han documentado.

Un derivado puede figurar bajo varios étimos. La duplicación **no crea fichas castellanas nuevas** ni permite respuestas adicionales: el corrector de escritura sigue dependiendo del banco de relaciones expresamente aprobado. Las 16 descomposiciones evaluables conservan su propio inventario cerrado.

## Definiciones y contraste lexicográfico

- **201 definiciones** proceden de la auditoría editorial original del Excel de Griego I. Su redacción, estado y correspondencias se conservan, sin copiar el texto del DLE.
- **286 nuevas voces** tienen glosas didácticas originales integradas a partir de las 302 voces distintas registradas en el fichero de ampliación. Las otras 16 estaban ya presentes en la auditoría.
- Cada ficha incorpora un enlace de consulta al **Diccionario de la lengua española** de la RAE y ASALE, sin reproducir su contenido.
- **El enlace no acredita verificación individual:** la interfaz solo muestra «DLE contrastado individualmente» para las entradas consultadas realmente una a una. Las demás muestran «Glosa didáctica documentada». El informe del catálogo ofrece el número de comprobaciones pendientes. No debe presentarse todo el banco como contrastado individualmente con el DLE hasta completar esta tarea.
- Los tecnicismos, términos poco usados y otras voces cuya consulta del DLE quede pendiente conservan su condición de fuente docente; no se sustituyen por etimologías inventadas ni se declaran académicamente verificados.

Las fuentes docentes iniciales son los tres PDF aportados: *Etimologías griegas* (Gálvez Marín, 414 pp.), *Breve diccionario de helenismos de griego clásico* (6 pp.) y *Etimologías griegas. PAU Griego II 2008-09* (31 pp.). Se emplean para revisar relaciones, **no** para copiar definiciones extensas ni inferir automáticamente todos sus vocablos.

## Compuestos griegos y no griegos

Además de las correspondencias dobles del catálogo, se ha incorporado un inventario explícito de composiciones frecuentes: por ejemplo:

- **filología** = φίλος «amante, amigo» + λόγος «palabra, discurso»
- **filosofía** = φίλος «amante» + σοφία «sabiduría»
- **misoginia** = μισέω «odiar» + γυνή «mujer»
- **misantropía** = μισέω «odiar» + ἄνθρωπος «ser humano»
- **antropocentrismo** = ἄνθρωπος «ser humano» + κέντρον «centro»
- **otorrinolaringología** = οὖς «oído» + ῥίς «nariz» + λάρυγξ «laringe» + λόγος «estudio»

Los segundos elementos ajenos al programa se presentan como **complementarios**, no como étimos examinables nuevos. Se distinguen también formaciones mixtas como *microchip* (micro- griego, *chip* inglés).

La relación etimológica no siempre es una composición literal directa. Por ejemplo, *policía* se relaciona históricamente con πόλις mediante etapas intermedias. *Ecología* y *economía* remiten a οἶκος, de la familia de οἰκία.

## Accesibilidad y funcionamiento

Hay búsqueda por étimo, derivado y definición; selección por unidad o todas las unidades; orden curricular o alfabético; desplegables accesibles; botones para expandir/contraer; adaptación móvil y visualización automática, clara, oscura y OLED.

Los recursos nuevos se precargan en el **service worker exclusivo** de Etymologicon y se incorporan a su hash de versión. La lectura es local y no modifica datos, progreso o el almacenamiento de otras webapps.

## Validación

- Compilación de todas las 487 fichas, definiciones no vacías y correspondencias con el banco base.
- Pruebas especiales de filología, filosofía, los falsos negativos corregidos, compuestos triples y cuádruples, elementos complementarios y estatus DLE.
- Pruebas de interfaz en Chromium, filtros, búsqueda y navegación; pruebas PWA de recursos y caché.
- La publicación automática solo tiene lugar cuando pasan las pruebas de GitHub Actions en `main`; en ramas y PR no se publica.
