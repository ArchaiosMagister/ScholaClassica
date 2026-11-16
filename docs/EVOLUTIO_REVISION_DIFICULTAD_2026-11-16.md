# Evolutio integrado — revisión de dificultad y exclusión de nombres propios (16/11/2026)

## Alcance y criterio

**Solo se modifica el artefacto integrado en ScholaClassica.** El repositorio independiente `ArchaiosMagister/EvolucionFonetica`, el SHA de la fuente, las 522 fichas, las respuestas, las normas fonéticas y sus posiciones, los identificadores y la modalidad de consulta **no cambian**. La modalidad valenciana pendiente de verificación tampoco se activa.

La dificultad es **didáctica y provisional**, no una medición de la cantidad de leyes ni una valoración de la calidad filológica del registro. Se pregunta cuánto puede deducir el alumnado la **forma castellana** partiendo del étimo y aplicando las evoluciones que ha estudiado. Los cambios frecuentes y el reconocimiento del resultado tienen más peso que la distancia de escritura; los resultados que requieren pasos menos transparentes deben subir de nivel. La pérdida de `-m` final no penaliza.

El método reproducible `criterio-deducibilidad-v3` conserva una estimación básica (85 % distancia ortográfica aproximada, 15 % número de transformaciones), **subordinada a 106 ajustes editoriales por ID** tras revisar los casos en que esa estimación no refleja la posibilidad real de recuperar el resultado. Son propuestas del sistema, no decisiones individuales ratificadas por el docente. Las decisiones con origen `docente`, si las hubiera, prevalecen siempre.

| Étimo | Resultado | Nivel revisado | Motivo principal |
|---|---|---|---|
| `filum` | hilo | 1 · Fácil | Resultado reconocible con un cambio corriente `f > h` |
| `lupum` | lobo | 2 · Medio | Sonorización y vocalismo regulares |
| `focum` | fuego | 2 · Medio | Diptongación y sonorización reconocibles |
| `spatium` | espacio | 2 · Medio | Prótesis y evolución consonántica habitual |
| `ætatem` | edad | 2 · Medio | Resultado recuperable pese a la distancia gráfica |
| `sphæram` | esfera | 2 · Medio | Adaptación gráfica culta, no transformación patrimonial |
| `leguminem` | legumbre | 3 · Difícil | Reestructuración interna poco transparente |
| `parabolam` | palabra | 3 · Difícil | Metátesis y otras transformaciones encadenadas |
| `despectum` | despecho | 3 · Difícil | Resultado menos deducible de la forma latina |
| `tripedem` | trébede | 4 · Muy difícil | Resultado difícil de recuperar sin conocer el desarrollo histórico |
| `ocŭlum` | ojo | 4 · Muy difícil | Pérdidas internas y palatalización con resultado distante |

Se diferencia la **evolución patrimonial** de la **adaptación culta**: el parecido de `sphæram → esfera`, por ejemplo, ayuda a deducir la forma, pero no convierte la palabra en una evolución patrimonial regular. No se han añadido normas no documentadas.

## Nombres propios

De las 522 fichas de origen, **35 producen nombres propios castellanos** (por ejemplo, `Christum → Cristo`, `Cæsarem → César`, `ægyptum → Egipto`). Se excluyen del sorteo tanto en **Repaso general** como en **Una sola norma**; el conjunto inicial para práctica queda en **487** entradas, antes de aplicar los filtros académicos de normas y dificultad.

Las 35 fichas permanecen en `Estudiar` y en el banco original, incluidas sus explicaciones, dificultades y normas. La comprobación se hace sobre las **respuestas castellanas con inicial mayúscula**, no sobre las iniciales latinas. Se conservan en práctica los resultados comunes `Chimæram → quimera`, `Pharum → faro` y `Lycæum → liceo`. La capitalización actual del banco fijado se ha cotejado: exactamente 35 resultados propios.

## Garantías y pruebas

- La adaptación falla si cambia la cantidad de nombres propios, falta un ID incluido en la curaduría o cambia la interfaz original que debe parchearse.
- Se mantienen el sistema de clasificación en cuatro niveles, los selectores múltiples, la persistencia de la dificultad, la selección aleatoria de preguntas, los modos guiado y a ciegas, y el estudio sin excluir fichas.
- El filtro y la estimación están precargados sin conexión; se renueva solamente la caché `schola-evolutio-*`, no las cachés de otros módulos.
- Las pruebas específicas cubren las formas transparentes, intermedias y opacas, la cobertura de los 522 IDs, la ausencia de nombres en ambos tipos de práctica y su presencia en Estudiar. La ejecución definitiva de CI queda registrada en la PR.

Esta revisión no altera `EvolucionFonetica` independiente, no modifica `GeneradorExamenes`, no introduce exámenes nuevos y **no publica** ninguna versión hasta fusionar la PR.
