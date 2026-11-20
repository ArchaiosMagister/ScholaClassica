# Auditoría de sintaxis e interfaz iPad — ScholaClassica

**Fecha:** 20 de noviembre de 2026. **Alcance:** exclusivamente Repaso gramatical de ScholaClassica. No se incorporan preguntas, se modifican bancos ni se cambian repositorios originales.

## Inventario vigente contrastado

El repaso compilado utiliza las 84 preguntas históricas de Vocabula y las 36 nuevas aprobadas por el docente; de las 120, **63 corresponden a sintaxis**. Se conservan los identificadores de las primeras 84, así como las seis de UD0 que el motor excluye del sorteo.

| Curso | Preguntas sintácticas | Enunciados que comienzan «En «…»» | Unidades con una sola pregunta |
| --- | ---: | ---: | --- |
| Latín 4.º ESO | 18 | 15 | Ninguna: UD1–8 tienen al menos dos |
| Latín I | 20 | 12 | UD1, UD4, UD7 y UD9 |
| Griego I | 25 | 12 | UD3 |
| **Total** | **63** | **39** | **5** |

*Precisión metodológica:* «comienza con “En «”» es un indicador mecánico de preguntas contextualizadas, **no** una medición completa de calidad o dificultad filológica. Otras formulaciones también pueden emplear ejemplos. Para decidir ampliaciones deben revisarse individualmente las funciones y la variedad de construcciones, no únicamente los totales.

### Prioridad 1 — Latín I

- **UD1:** ampliar los contrastes entre funciones de casos ya estudiadas, sin adelantar construcciones posteriores.
- **UD4:** junto a la aposición ya incorporada, representar el **dativo de aproximación**, que aparece en el currículo de Appendix UD4 y todavía carece de pregunta propia.
- **UD7:** proponer más contextos de **dativo posesivo**, distinguiéndolo del dativo de destinatario.
- **UD9:** añadir diversidad en el **segundo término de la comparación** y sus construcciones realmente incluidas en Appendix, previa revisión filológica.

### Prioridad 2 — Griego I

- **UD3:** sólo hay un ejercicio de sintaxis acumulativa sobre sujeto y artículo; cualquier ampliación ha de respetar el carácter fundamentalmente morfológico de la unidad.
- **UD9:** convendría reconocer la función interna del relativo en más de un caso y no limitarse a la concordancia del antecedente.
- **UD10:** hay una pregunta de genitivo absoluto, pero predominan las nociones y el participio atributivo; convendría contrastar participios concertados, atributivos y absolutos en contextos completos.
- **UD11–14:** ausencia justificada de nuevas preguntas sintácticas: no se introduce un capítulo sintáctico nuevo en estas unidades. Mantener repaso acumulativo, si se considera necesario, sin reclasificar el programa.

### Prioridad 3 — Latín 4.º ESO

La cobertura mínima de **dos preguntas por unidad** ya es correcta. El crecimiento de esta sección debería ser cualitativo: diferentes ejemplos de sujetos, CD, CN, preposiciones y pasivas según la progresión real, no multiplicar series casi idénticas. Las UD9–10 siguen fuera del currículo habitual y no se proponen.

## Auditoría de iPad

Se han incorporado pruebas automatizadas para cinco resoluciones y orientaciones en **Chromium con emulación táctil**, además de tres pruebas en **WebKit para aproximarse al motor de Safari**. Se comprueba:

- Ausencia de desplazamiento horizontal no deseado en cabecera, panel y tarjetas de preguntas.
- Controles con superficies de interacción de al menos **44 px** en entorno táctil.
- Selección de asignatura y unidad, tema claro/oscuro, respuesta corregida y registro local.
- Separación del historial de gramática respecto a Vocabula.
- Recarga sin conexión de la PWA y conservación del progreso (en Chromium).

El CSS de adaptación iPad se añade **solo a la copia construida para ScholaClassica**; `vendor/vocabula/gramatica.css` permanece inalterado. Los resultados automáticos se consultan en las comprobaciones de la PR y en el artefacto de auditoría de GitHub Actions.

**Limitación:** WebKit en Linux y Chromium emulado no equivalen a una prueba física de Safari en iPadOS. No debe afirmarse que se ha probado en un dispositivo físico real; es aconsejable una comprobación táctil manual tras publicar.

## Próximas decisiones

Estas son **líneas de ampliación propuestas, no preguntas aprobadas**. El siguiente lote académico deberá presentarse con enunciado, solución, distractores, explicación, procedencia de Appendix y unidad, para decisión docente previa. No es necesario fusionar más vocabulario, ni mover la práctica de morfología fuera de su módulo.
