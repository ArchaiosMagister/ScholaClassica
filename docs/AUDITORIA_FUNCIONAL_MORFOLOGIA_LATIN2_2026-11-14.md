# Auditoría funcional de la práctica de morfología de Latín II
**Fecha:** 14 de noviembre de 2026
**Rama:** `audit/latin2-distractores-reservas-y-repaso`
**Estado:** revisión previa a integración; no publicar esta rama.

## Alcance y método

Se ha examinado el banco realmente construido para la PWA de ScholaClassica
(artefacto de validación de GitHub Actions, no una muestra de documentación).
Comprende **500 fichas, 22.050 análisis registrados**:

| Categoría | Fichas | Análisis |
| --- | ---: | ---: |
| Sustantivos | 98 | 1.177 |
| Adjetivos | 89 | 3.142 |
| Pronombres | 14 | 374 |
| Verbos | 156 | 14.974 |
| Participios | 44 | 1.890 |
| Infinitivos | 99 | 493 |
| **Total** | **500** | **22.050** |

Los cómputos cuentan lecturas de formas, no grafías distintas ni
atestiguaciones independientes. La evaluación filológica individual es una
línea de trabajo distinta.

Se han revisado los motores `engine.mjs`, `written.mjs`, `review.mjs`,
la interfaz `app.mjs` y el comportamiento de las opciones múltiples,
la práctica escrita y las tablas. Se han realizado ensayos reproducibles
con semillas aleatorias, incluida la selección de tandas mixtas y el
cotejo de las lecturas sincréticas.

## Incidencias confirmadas y correcciones propuestas

### A. Crítica: pasiva personal excepcional de *noceo* sin cotejo

**Hallazgo:** 120 análisis de pasiva personal reconstruidos por modelo
estaban ya marcados en la fuente como
`verification: pendiente-de-cotejo-individual` y
`usage: ... excluir del sorteo`.
La selección de escritura no respetaba esa reserva; podían aparecer
como preguntas y respuestas. La selección de análisis agrupaba además
una lectura reservada con otra impersonal legítima cuando compartían forma.

**Corrección:** nueva función de elegibilidad compartida por las modalidades
de análisis, elección de forma, escritura y tablas. Se excluyen las
lecturas reservadas de la práctica **sin suprimir ninguna de las 120
casillas de la fuente**. Siguen admitidas las formas impersonales
documentadas de *noceo*. La exclusión del ejercicio no es una afirmación
de inexistencia filológica.

### B. Alta: distractores parcialmente verdaderos

**Hallazgo:** la comparación inicial de distractores solo rechazaba una
opción completamente igual a una solución, sin descomponer los análisis
sincréticos separados por ` /`. En la exploración del banco se
identificaron **22 situaciones** en las que otro grupo compartía
al menos una lectura correcta con la forma planteada. Ejemplos de
parejas que requieren ese cuidado: `ii/ei` (*is*),
`nave/navi` (*navis*), `civitates/civitatis` (*civitas*).
El número 22 corresponde a situaciones de solapamiento detectadas,
no a un total de preguntas falsas vistas por usuarios.

**Corrección:** se descarta toda opción que contenga **cualquier**
lectura válida para la forma objetivo. Para Latín II se eliminan
los cambios arbitrarios de categoría gramatical usados como distracción;
se favorecen análisis próximos dentro de una misma categoría y lema,
preferentemente diferentes en pocos rasgos morfológicos.
La puntuación permanece basada en la cadena original validada.

### C. Media: incoherencia entre respuesta admitida y resaltado

**Hallazgo:** el motor podía aceptar más de una respuesta en sus datos,
mientras que la interfaz resaltaba como correcta solamente
`q.correct`. El caso es preventivo para opciones alternativas, que
la selección ordinaria presenta normalmente como una sola respuesta
elegida y conserva las otras como variantes admitidas.

**Corrección:** se marca como correcta cualquier opción contenida
en el conjunto de soluciones admitidas, sin modificar la evaluación.

### D. Menor: retroalimentación con afirmación innecesaria de procedencia

Se sustituye una frase genérica sobre la procedencia de la forma por
una indicación pedagógica sobre los rasgos que hay que comprobar. No
se expone al alumnado el estado de verificación del banco.

## Validación funcional

Las pruebas añadidas en
`tests/morphology-latin2-functional-audit.test.mjs`
recorren todas las fichas de Latín II para examinar preguntas reales
seleccionadas, ausencia de lecturas correctas entre los distractores,
variedad de las seis categorías, soluciones reconocidas y corrección
de preguntas escritas y tablas. También verifican expresamente las
120 reservas de *noceo* y las cinco modalidades de repaso: libre,
inteligente, errores, pendientes y nuevas.

Las pruebas existentes de navegación Chromium, PWA sin conexión,
vocabulario, docente y auditoría académica deben permanecer verdes.
**No se dará por concluida la revisión hasta comprobar la CI sobre el
último commit de esta rama.**

## Cuestiones pendientes que no se modifican sin criterio docente

1. **«Volver a los errores»:** el sistema incluye toda pregunta con
   `wrong > 0`, incluso después de aciertos posteriores. Hay que
   decidir si debe mostrar errores históricos o solo los todavía no
   subsanados. No se cambia unilateralmente el significado del filtro.
2. **Persistencia del repaso:** algunos identificadores terminan en
   índices ordinales de casillas. Si se reconstruye un paradigma
   insertando formas antes de las existentes, podría asociarse progreso
   antiguo a otra pregunta. Conviene prever identificadores estables
   y migración controlada de `schola-morphology-review-v1`; no
   se altera la memoria local del alumnado sin una migración segura.
3. **Grado de dificultad:** priorizar alternativas parecidas mejora
   la discriminación, pero podría convenir una futura opción docente
   con niveles (básico, intermedio y avanzado), sin introducir
   probabilidades opacas.
4. **Cotejo lexicográfico:** la compatibilidad estructural y el
   análisis de lecturas no certifican testimonios textuales ni sustituyen
   las decisiones filológicas ya registradas.

## Política de integración

No se toca el banco fuente, los repositorios independientes ni el
contenido de las reservas. No fusionar ni publicar antes de la decisión
del docente y de las comprobaciones automáticas.
