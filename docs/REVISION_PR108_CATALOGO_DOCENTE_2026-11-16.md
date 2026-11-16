# Revisión de la PR #108: catálogo docente y acepciones

**Fecha:** 16 de noviembre de 2026.

## Por qué no se fusiona literalmente #108

La PR #108 estaba validada en su momento, pero fue preparada sobre una
revisión anterior de `main`. Posteriormente se incorporó al catálogo
docente un control de integridad importante: cuando varias fichas
originales comparten forma pero difieren en significado o respuestas,
no se permite crear una sobreescritura global como si fueran una sola.

La propuesta antigua exponía las fichas por separado, pero al pulsar
«Crear versión docente» sobre una de ellas podía crear una
sobreescritura por `subject|form`, que sigue siendo la clave del motor
publicado para el alumnado. Esto afectaría **a todas** las procedencias
de esa forma y podría suprimir acepciones distintas. Por eso no
se reemplaza el código nuevo por el de #108.

## Solución sobre `main` actual

- Se conserva el **bloqueo** de edición para las formas con acepciones o
  respuestas divergentes, sin cambios en la API ni en Supabase.
- Se conserva una tarjeta por forma, pero se representa una **subficha
  individual por cada ID original**, con modo General/Examen, unidad,
  significado y respuestas propias. Las glosas compartidas siguen
  siendo visibles por procedencia.
- En caso de sustitución por una aportación docente, se muestran las
  fichas originales, con su ID, y se informa del alcance de la
  sobreescritura; cuando la aportación se desactiva, las originales
  vuelven a ser visibles según el contrato existente.
- La búsqueda indexa **todas** las respuestas, glosas, unidades e IDs,
  tanto del original visible como de los registros originales
  sustituidos por una aportación docente.
- Se rechaza intentar crear una segunda aportación para una misma
  forma y materia, y se exige confirmación para activar o editar
  una sobreescritura que alcance varias fichas originales.
- Se añade espaciado y contraste accesibles en claro, oscuro y OLED.

## Invariantes y pruebas

- Permanecen las **2055 fichas** del catálogo docente y sus IDs.
- Las **9 agrupaciones con glosas diferentes** y las **12 con respuestas
  diferentes** siguen separadas en los datos; el motor de práctica y
  la autenticación no cambian.
- Continúan las pruebas previas de bloqueo y trazabilidad, y se añaden
  pruebas sobre búsqueda por respuestas/IDs, originales ocultos por
  aportaciones activas, restauración de originales, HTML tratado como
  texto y la visualización en Chromium de dos fichas de `silva`.
- Ningún cambio en bancos originales, migraciones, unidades, progreso,
  Supabase, cuentas ni aplicaciones independientes.

Esta PR nueva **sustituye funcionalmente #108** y evita volver a una
versión anterior de los controles de seguridad semántica.
