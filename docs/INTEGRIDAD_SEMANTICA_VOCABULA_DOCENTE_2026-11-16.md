# Integridad semántica del catálogo docente de Vocabula

Fecha: 16 de noviembre de 2026. Continuación de la auditoría de la PR #106.
Alcance: solo ScholaClassica, exclusivamente la consulta/edición docente; ninguna
modificación del repositorio Vocabula original, de Supabase ni del motor del alumnado.

## Diagnóstico y decisión filológica

El banco histórico fijado contiene 2055 registros, 1684 formas por
`subject|form` y 368 claves con más de un registro. La agrupación anterior
retenía solo la primera glosa y reunía todas las respuestas y unidades sin
diferenciación. Hay 9 claves con glosas diferentes y 12 con respuestas
diferentes (18 claves distintas en la unión de ambos criterios).

| Forma | Diferencia que debe preservarse |
| --- | --- |
| `appropinquo` (Latín I) | Nota de régimen con dativo en UD 6 frente a UD 2 |
| `silva` (Latín I) | General «selva» / Examen «bosque», con sus respuestas y UDs |
| `gens` (Latín I) | «pueblo» / «pueblo, gente» en unidades diferentes |
| `ἀκούω` | Régimen de genitivo en Examen |
| `ἀρχή` | «gobierno» / «gobierno, origen» |
| `ἄρχω` | Régimen de genitivo en Examen |
| `βασιλεύω` | Régimen de genitivo en Examen |
| `λαμβάνω` | «coger» / «coger, tomar» |
| `οἰκέω` | «vivir» / «habitar»; respuestas admitidas en distinto orden |

Además, `bonus`, `capio`, `multus`, `venio`, `video`,
`vetus`, `impetus`, `dūco` e `īmpĕrātŏr` presentan diferencias
de respuestas, aun cuando la glosa sea idéntica. No son razones para
retocar automáticamente ninguna respuesta de examen.

## Comportamiento nuevo

- La tarjeta única por asignatura y forma muestra variantes por glosa y
  conjunto de respuestas; separa la procedencia General/Examen con sus unidades.
- Cada variante conserva la lista exacta de `id` históricos; el catálogo puede
  buscar por cualquiera de las glosas, no solo la primera.
- Una sobreescritura docente activa identifica las fichas originales a las que
  sustituye; una desactivada permite ver también el original.
- Como la API docente y el motor del alumno todavía sobreescriben por
  `subject|form` **y no por ID**, se bloquea la creación de una única
  sobreescritura para una forma con variantes semánticas o respuestas diferentes.
  Así no se destruyen accidentalmente las diferencias General/Examen.
- Para varias fichas realmente idénticas, se exige confirmación explícita
  antes de crear una sobreescritura que afectaría a todas ellas.
- Las aportaciones docentes ya existentes siguen pudiéndose editar y retirar;
  no se modifican registros, identificadores, unidades ni progreso.

## Pruebas y límites

`tests/docente-vocabula-semantica.test.mjs` incluye casos de variación
de glosa, respuestas, escritura griega NFC, procedencia, sobreescrituras
activas/inactivas y cotejo contra las 2055 entradas compiladas.

No se deben eliminar del original ni corregir automáticamente estas variantes.
Permitir en el futuro **edición individual por ID/procedencia** requeriría un
cambio deliberado de esquema y del motor de aplicación de sobreescrituras:
debe hacerse en otra PR, con migración, retrocompatibilidad y pruebas de
progreso/offline. Este cambio se limita a impedir la pérdida semántica en la
vista docente y las nuevas sobreescrituras ambiguas.

**Sin fusión ni publicación en esta PR.**
