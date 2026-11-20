# Decisión docente e integración del segundo lote de sintaxis (24 preguntas)

**Fecha:** 20 de noviembre de 2026.
**Aprobación:** el docente aprueba las 24 preguntas del segundo lote **con una precisión terminológica obligatoria** sobre los dativos que complementan a adjetivos.

## Clasificación escolar acordada

En sintagmas con `proximus` o `similis` (por ejemplo, *mons proximus urbi* y *pater filio similis est*), el dativo dependiente del adjetivo se clasifica prioritariamente como **dativo complemento adjetival**. La denominación **dativo de aproximación** también es aceptable. Las preguntas de elección múltiple mostrarán ambas denominaciones en la misma respuesta correcta, para no presentar como incorrecta una forma admitida.

Los ejercicios modificados respecto a la propuesta inicial son exclusivamente:

| ID | Pregunta definitiva | Respuesta correcta |
|---|---|---|
| `SIN2-LAT1-04-003` | En «mons proximus urbi» («el monte próximo a la ciudad»), ¿qué función sintáctica desempeña «urbi»? | **Dativo complemento adjetival (también dativo de aproximación)** |
| `SIN2-LAT1-04-004` | En «pater filio similis est» («el padre es parecido al hijo»), ¿qué función sintáctica desempeña «filio»? | **Dativo complemento adjetival (también dativo de aproximación)** |

Se mantienen el epígrafe histórico de Appendix **«Aposición y dativo de aproximación»**, su texto de referencia, la secuenciación y todos los identificadores anteriores. La precisión se incorpora a las respuestas y a sus justificaciones dentro de Repaso gramatical, sin alterar los repositorios independientes.

## Datos y fuentes

- Propuesta original conservada como histórico: `docs/candidatos-sintaxis-lote2-24-2026-11-20.json`, con sus 24 formulaciones antes de la aclaración docente.
- Fuente aprobada para compilar: `data/repaso-sintaxis-lote2-aprobadas.json`, con 24 preguntas. Solo las dos anteriores cambian `p`, `a` y `x`; las otras 22 coinciden exactamente con la propuesta.
- Primer lote aprobado: `data/repaso-sintaxis-aprobadas.json`; permanece intacto.
- Procedencia curricular: `vendor/appendix/assets/curriculum.json`, siempre en modo de solo lectura.

## Integridad y publicación

Se añaden las 24 preguntas **después** de las 84 históricas y 36 ya aprobadas. Los índices `concept-0`–`concept-119`, las categorías, el progreso `classics-grammar-v1` y el módulo independiente de Morfología no se modifican.

| Concepto | Antes | Tras integración autorizada |
|---|---:|---:|
| Preguntas totales de Repaso | 120 | 144 |
| Preguntas de sintaxis | 63 | 87 |
| Latín I · sintaxis | 20 | 32 |
| Griego I · sintaxis | 25 | 33 |
| Latín 4.º · sintaxis | 18 | 22 |

**Condición:** fusionar y publicar solo cuando la validación completa de GitHub Actions sea satisfactoria, incluidas las pruebas de navegador/PWA, compatibilidad táctil y seguridad. No borrar, archivar ni modificar repositorios autónomos.
