# Etymologicon · progreso privado y repetición inteligente

**Estado:** desarrollo de Griego I integrado en ScholaClassica y probado como PWA offline. Sin publicación pública.

## Estadísticas que se guardan

Se almacena **solo en el dispositivo**, bajo la clave versionada
\`scholaclassica-etymologicon-progress-v1\`, un registro agregado por étimo:

- Número de ejercicios de **dos respuestas** realizados y puntos acumulados.
- Respuestas exactas (1 punto), erratas inequívocas (0,5 puntos) y respuestas sin puntuar.
- Última nota sobre 2, fecha, racha de ejercicios perfectos y necesidad de repaso.
- Número de étimos practicados, pendientes de refuerzo y desglose por unidad.

La estadística por unidad cuenta un mismo ejercicio en todas las unidades a las que pertenezca el étimo, y la interfaz explica ese posible solapamiento. Los totales generales no se duplican. **No se almacenan las respuestas escritas**, ni nombres, cuentas, identificadores personales ni historiales detallados.

La estructura JSON incluye secciones separadas \`gr1\` y \`gr2\`, pero Griego II permanece inactivo y vacío hasta disponer de un banco aprobado. Las preferencias de color usan otra clave independiente.

## Modos de repaso

1. **Repaso general · inteligente:** los 108 étimos admitidos; las dificultades recientes tienen mayor probabilidad de volver a salir, pero los ya dominados no se eliminan.
2. **Repasar mis errores:** únicamente étimos pendientes de refuerzo. Un fallo (0 puntos) tiene más peso que una errata (0,5), y hacen falta **dos ejercicios perfectos consecutivos** para considerar reparado un fallo y cerrar la marca de repaso. Si no queda ninguno pendiente, la interfaz lo indica sin inventar ejercicios.
3. **Practicar una unidad:** únicamente étimos admitidos para esa unidad, con priorización adaptativa. Conserva la elección manual de un étimo y la posibilidad de obtener otro al azar.

Un étimo no se elige dos veces consecutivas de manera automática mientras haya alternativas. La fórmula de ponderación está documentada y probada en \`apps/etymologicon/progress.mjs\`. No se utiliza IA ni consulta remota.

## Exportación, importación y borrado

**Exportar** produce un archivo JSON con versión de esquema, fecha y agregados. El alumnado puede conservarlo o trasladarlo a otro dispositivo.

**Importar** comprueba el JSON y presenta una vista previa con número de ejercicios y étimos pendientes antes de pedir confirmación. La importación **reemplaza** el progreso actual, nunca fusiona en silencio registros que podrían estar duplicados. Se rechazan:

- Archivos dañados, excesivamente grandes (>250 KB), con campos no esperados, valores negativos o puntuaciones incoherentes.
- Identificadores de étimos ajenos al banco aprobado, registros de Griego II (desactivado), datos que no correspondan a dos respuestas por ejercicio y versiones de esquema desconocidas.
- Fechas no válidas y estados de repaso contradictorios.

El progreso actual **no cambia** si la validación falla o el alumno cancela. El borrado es exclusivamente voluntario mediante confirmación del navegador, y elimina solo la clave de estadísticas de Etymologicon: no toca temas, caché PWA ni otros proyectos.

Si el navegador bloquea \`localStorage\` o carece de cuota, el ejercicio sigue funcionando en memoria, avisa del problema y permite exportar el progreso; no promete una persistencia que no pueda garantizar.

## Consistencia del corrector y comportamiento offline

El controlador registra **un intento por pulsación confirmada de «Corregir respuestas»**. No puede contabilizar dos veces la misma pulsación sin editar las respuestas o comenzar otro ejercicio. Los dos campos siguen dependiendo exclusivamente del corrector determinista original (1 / 0,5 / 0). Mostrar las estadísticas no altera las relaciones docentes del banco.

El módulo \`progress.mjs\` se incluye en la precarga atómica del service worker exclusivo de Etymologicon y en su huella de caché versionada. Se comprueba la lectura, registro y continuidad del progreso sin internet; la actualización de la PWA no borra los datos del alumnado, que están fuera de CacheStorage.

## Pruebas

- Pruebas Node de agregación y puntuación, tres modos, probabilidades adaptativas deterministas, importación/exportación, errores, puntuaciones manipuladas, ids no autorizados, bloqueo de almacenamiento y compatibilidad futura con Griego II.
- Pruebas Chromium de repetición de errores hasta su recuperación, persistencia tras recargar, exportación real, importación inválida y válida, borrado confirmado, filtro por unidades, compatibilidad móvil/OLED, y corrección offline con estadísticas.
- Regresiones de ScholaClassica, Appendix y Evolutio; los repositorios originales se obtienen en modo de solo lectura en los commits fijados.

**No se ha activado ningún despliegue.** Las pruebas de instalación en dispositivos físicos seguirán siendo necesarias antes de la publicación general.

