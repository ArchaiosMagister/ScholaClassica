# Etymologicon · Corrector determinista de dos derivados (Griego I)

**Fase:** motor independiente, probado en Node.js, sin interfaz pública ni publicación de ScholaClassica.

## Banco autorizado y alcance

El corrector consume **únicamente** `compileTeacherAudit()`, el catálogo editorial de Griego I: 111 étimos (108 aptos, 3 de consulta), 201 derivados españoles admitidos y 217 relaciones verificadas editorialmente. Nunca consulta datos provisionales del generador, no propone nuevos derivados ni modifica los repositorios originales. No opera sobre Griego II hasta que su banco se audite.

Código reutilizable: `shared/academic/greek-etymology/corrector/write-two.mjs`.

```js
import {compileTeacherAudit} from './scripts/compile-etymologicon-gr1.mjs';
import {createWriteTwoCorrector} from './shared/academic/greek-etymology/corrector/write-two.mjs';

const engine = createWriteTwoCorrector(compileTeacherAudit());
const result = engine.grade('grc:προσ', ['proselito', 'prosodia']);
// result.total === 1.5; result.maximum === 2
// result.answers[0].correctForm === 'prosélito'
```

## Reglas ya aplicadas

| Resultado | Puntos | Condiciones |
|---|---:|---|
| Exacta / variante oficialmente admitida | **1** | Coincide con derivado autorizado para el étimo; Unicode NFC, diferencias de mayúsculas y espacios accidentales no se penalizan |
| Error ortográfico inequívoco | **0,5** | Solo se reconoce el **mismo** derivado del banco; existe un único candidato global y el error obedece a patrones ortográficos conservadores |
| No catalogada, errónea o ambigua | **0** | No se adivinan relaciones etimológicas por parecido ni se aprueban respuestas del banco candidato |

La regla de 0,5 es la decisión docente **posterior** a la auditoría Excel; prevalece sobre el antiguo criterio de 0 por falta de ortografía.

La detección de errores ortográficos contempla acentos, inversión adyacente de letras, duplicaciones, confusiones gráficas frecuentes y determinadas omisiones internas. El umbral máximo depende de la longitud, admite varias erratas solo en palabras largas y se **rechaza la inferencia** si existe otra forma del banco a la misma distancia, aunque el primer candidato parezca posible. Se rechazan asimismo algunos cambios de singular/plural y género para no confundir flexión o derivación con errores gráficos. Se privilegia **no inventar una respuesta** frente a puntuar incorrectamente una palabra no incluida.

> **Límite inevitable de la autocorrección cerrada:** sin un diccionario externo completo no se puede demostrar que toda respuesta no catalogada sea una palabra incorrecta. El motor no emite esa afirmación: utiliza el estado `unlisted` y señala que la ausencia del repertorio no implica falsedad filológica. La asignación de 0,5 se limita a erratas reconocibles con alta confianza; las dudosas reciben 0 y una explicación, nunca un 1 por semejanza.

## Dos casillas y duplicados

Cada pregunta solicita **dos derivados distintos**. No puntúan dos grafías de un mismo lema (por ejemplo, `icono` / `ícono`): una se considera duplicada aunque ambas sean correctas. Si aparece la misma palabra escrita con una errata y luego correctamente, se conserva el punto de la forma exacta y la otra casilla recibe 0, con independencia del orden.

El motor distingue `exact`, `orthographic_error`, `duplicate`, `other_etymon`, `excluded`, `unlisted`, `ambiguous`, `blank` y `not_eligible`. Cada respuesta incluye `points`, `correctForm`, `message` y, para las erratas reconocidas, `highlight` con los segmentos de grafía errónea y correcta. La futura interfaz mostrará esas diferencias visualmente; todavía no existe la pantalla de alumno.

## Seguridad y comprobaciones

`npm run etymology:corrector:test` ejecuta las pruebas específicas y `npm test` la batería completa. Las comprobaciones abarcan:

- Los **108 étimos elegibles** y las **217 relaciones**: solo las formas autorizadas obtienen 1 punto.
- Todas las grafías alternativas del banco y la normalización de Unicode, mayúsculas y espacios.
- Acentos perdidos, varias erratas, transposiciones y grafía de corrección.
- Palabras conocidas de otros étimos, exclusiones, respuestas ajenas, plurales y ambigüedad.
- Duplicados incluyendo variantes y priorización de respuestas exactas.
- Rechazo de los étimos solo de consulta y de catálogos de Griego II o sin auditoría.
- Regresión sobre las 201 palabras y 217 relaciones, sin habilitar análisis inversos.

**La salida del motor no se incorpora al `dist/` público**: sigue siendo una capacidad académica preparada para el próximo módulo de interfaz. Los demás repositorios, sus PWAs y el despliegue actual no se modifican.
