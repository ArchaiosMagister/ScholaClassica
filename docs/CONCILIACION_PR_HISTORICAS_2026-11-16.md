# Conciliación de las nueve PR históricas abiertas — 16/11/2026

**Base examinada:** `main@e023e8bca8ea87a4994b61de35a713aaf00ca087`, tras las integraciones #93, #94 y #95. Este documento es **solo seguimiento docente y técnico**: no modifica bancos, ejercicios, rutas, PWA, Supabase ni acceso público. No se incorporan ramas antiguas mediante merges masivos.

## Método

1. Se comparan metadatos, 98 rutas afectadas (con repeticiones), parches e identificadores de archivo (blobs Git) de las nueve PR frente al árbol actual de `main`.
2. Cuando una PR histórica usaba fuentes antiguas, se cotejan las fuentes fijadas **actuales** de `config/sources.lock.json` y las pruebas vigentes. La diferencia de SHA de un archivo no equivale por sí sola a un cambio ausente.
3. Solo se recuperan correcciones con evidencia y precondiciones actuales; las reservas curriculares no se convierten en datos exigibles ni se confunden con progresos existentes.
4. El historial de GitHub y los comentarios de cada PR se conservan aun si la PR se cierra como superada; no se borran ramas en esta conciliación.

## Matriz de conciliación

| PR | Diagnóstico frente a `main` | Tratamiento seguro |
| --- | --- | --- |
| [#91](https://github.com/ArchaiosMagister/ScholaClassica/pull/91) Auditoría filológica transversal | **Parcialmente superada, con una corrección útil**. `main` ya dispone de auditoría transversal `scripts/audit-filologia-transversal.mjs` y su prueba. La rama #91 aún contiene el enunciado corregido de dos fichas de *polliceor*, pero tiene una versión desfasada de archivos y tests. | Corrección independiente [#96](https://github.com/ArchaiosMagister/ScholaClassica/pull/96), con fuente Lewis & Short, manteniendo dos ID, UD10 y `originals`. No fusionar el resto de #91. |
| [#87](https://github.com/ArchaiosMagister/ScholaClassica/pull/87) Vocativos *acer* y ἐλπί | **Cubierta por versiones y pruebas posteriores**. Appendix fijado en `6e9ae22` contiene ambos vocativos en ES/VAL. La nueva prueba `tests/gramatica-vocativos-appendix.test.mjs` y `tests/morphology-ud8-14.test.mjs` verifican su presencia y la excepción con asterisco. | Cerrar como superada, sin volver a fijar el SHA provisional de Appendix de #87. |
| [#80](https://github.com/ArchaiosMagister/ScholaClassica/pull/80) Informe Latín I/Griego I | **Documento histórico, no cambio de código**. Sus hallazgos se formularon antes de adaptaciones ES/VAL y tests posteriores. Algunos se trataron; los restantes no se pueden declarar resueltos sin repetir auditoría sobre la fuente actual. | Cerrar el informe histórico; consultar la PR para evidencia original y actualizar los pendientes mediante una auditoría nueva, no arrastrar diagnósticos obsoletos a `main`. |
| [#77](https://github.com/ArchaiosMagister/ScholaClassica/pull/77) Informe Latín 4.º | **Documento histórico, no cambio de código**. Ya se corrigieron los dos enunciados léxicos `spēs` y `tempus`, se regularizó el bloque Examen UD8 de 17 fichas y se ocultó la ampliación UD9/10 del itinerario ordinario. Las otras observaciones editoriales deben cotejarse de nuevo. | Cerrar el informe como instantánea histórica sin declarar resueltas todas sus advertencias. |
| [#57](https://github.com/ArchaiosMagister/ScholaClassica/pull/57) Continuidad portal/Evolutio | **Mejoras recuperables**, pero el código de la rama ha quedado atrás. La portada en `main` recuerda accesos desde «Mi itinerario», no todavía desde las tarjetas; Evolutio sigue usando 522 étimos castellanos. | Recuperación en PR autónoma [#97](https://github.com/ArchaiosMagister/ScholaClassica/pull/97): tarjetas, rótulo castellano y prueba de aislamiento de propuestas valencianas. |
| [#46](https://github.com/ArchaiosMagister/ScholaClassica/pull/46) 215 candidaturas valencianas | **Material académico en reserva, no publicable como práctica**. La rama documenta 195 candidatos y 20 reservas de una auditoría del 14/11; no contiene autorización suficiente para declarar el motor y cada ley valenciana verificadas. | Conservar la rama de investigación, los 522 ID de Evolutio y el corrector castellano publicado. No trasladar matrices a `dist`. Cerrar únicamente cuando se hayan conciliado individualmente todos los datos académicos útiles. |
| [#47](https://github.com/ArchaiosMagister/ScholaClassica/pull/47) Área docente | **Parcialmente superada por la identidad docente y AAL2 actuales**; la rama propone además funciones de bandeja y administración más antiguas y divergentes. Hay código actual con pruebas específicas `docente-*`. | Reconciliar políticas, avisos y administración por endpoints; no reintroducir un login antiguo ni sobrescribir controles TOTP. Mantener para extracción selectiva si aparecen funciones realmente ausentes. |
| [#45](https://github.com/ArchaiosMagister/ScholaClassica/pull/45) Cuatro evoluciones valencianas | **Decisiones docentes conservadas en rama no pública**. Incluye al menos una etapa provisional (*noctem → nit*) y afirma cero fichas valencianas jugables. | Conservar aislada para cotejo individual y coordinación con #46; nunca mezclar con el corrector castellano publicado ni inferir acreditación de todas las leyes. |
| [#35](https://github.com/ArchaiosMagister/ScholaClassica/pull/35) Seis decisiones nominales | **Parte de la política docente sigue siendo útil**, pero es una rama antigua y extensa (38 archivos, nuevos generadores nominales, fuentes y cachés) incompatible con la cobertura actual ampliada, los límites curriculares y el progreso. | Reauditar *ἄνθρωπος, παῖς, Ἀθῆναι, cantus, domus, liber* uno a uno contra el banco vigente y extraer solo piezas que falten, respetando las seis decisiones ya expresadas. No fusionar íntegra. |

## Evidencia de estado actual

- Auditoría transversal en `scripts/audit-filologia-transversal.mjs`; pruebas filológicas en `tests/filologia-transversal.test.mjs`.
- Vocativos incluidos en el Appendix fijado `6e9ae22d98c10f8752329d0fa65ad8dd882dcde9` y cubiertos por `tests/gramatica-vocativos-appendix.test.mjs` y `tests/morphology-ud8-14.test.mjs`.
- Fuente de Vocabula fijada `a7be2161a2401816ede78a96981daaac6850b8d2`: 2055 registros idénticos respecto al bloqueo previo; mantener sus ID y el progreso.
- 430/430 pruebas y auditoría LEMLAT3 correctas en la publicación #95, antes de las nuevas PR pendientes.
- La gramática se ofrece como **consulta**, las prácticas de morfología y léxico pertenecen a módulos separados; se mantienen las versiones castellana y valenciana.

## Orden de cierre y garantías

1. Archivar las PR **solo documentales** #77 y #80; cerrar #87 porque su contenido queda ya integrado y probado; conservar sus URL para auditoría.
2. Mantener #91 hasta que #96 quede validada, y #57 hasta que #97 quede validada; cerrarlas después como reemplazadas, **sin fusionar ramas antiguas**.
3. Mantener #35, #45, #46 y #47 pendientes de conciliación por el riesgo académico, lingüístico, de datos o de autenticación.
4. Las PR #96 y #97 son **independientes**, no se fusionan ni publican en esta conciliación documental. Sus propias baterías de pruebas deben ser correctas antes de solicitar integración. 
5. El próximo bloque con beneficio académico es la revisión nominal granular de #35 frente a la práctica actual, dejando fuera del sorteo todo lo no documentado.

**Limitación:** una auditoría de ramas y pruebas automáticas no sustituye un cotejo filológico línea por línea de un banco ni una revisión visual real desde Safari iPad. Este informe no declara completadas tales verificaciones.
