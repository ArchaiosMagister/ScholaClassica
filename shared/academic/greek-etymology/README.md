> **Interfaz en pruebas:** el ejercicio de dos derivados ya se puede abrir desde el artefacto de ScholaClassica; su motor es el mismo corrector académico y las fuentes originales permanecen intactas. Véase [la interfaz funcional](../../../docs/ETIMOLOGICON_INTERFAZ.md).

> **Nuevo:** corrector determinista de dos derivados implementado como módulo independiente. Véase [especificación y pruebas](../../../docs/ETIMOLOGICON_CORRECTOR.md). Aún no existe interfaz de alumno ni PWA propia de Etymologicon.

> **Revisión posterior de significados:** se han cotejado también las 51 glosas inicialmente solo docentes. Consulta [la auditoría individual](../../../docs/ETIMOLOGICON_REVISION_51_GLOSAS.md). Se mantienen las decisiones de inclusión/exclusión del Excel.

# Banco académico de etimología griega · Etymologicon

Módulo de datos para ScholaClassica. **No es todavía un banco de respuestas autorizado.**

- Fuente: instantánea del banco de Griego I del repositorio GeneradorExamenes, referenciada a un commit fijo.
- Candidatos: 111 étimos, 196 formas castellanas y 212 relaciones (ninguna declarada verificada).
- Auditoría docente informada: 111 étimos, 108 elegibles y 201 derivados. **Conciliación individual pendiente de recuperar el inventario completo.**
- Griego II: únicamente un espacio de programación vacío; no se generan respuestas de este curso.
- Significados, definiciones y variantes ortográficas: no se rellenan sin prueba individual ni referencias acreditadas.

El esquema oficial está en `model-v1.schema.json`. Los candidatos se mantienen aislados de las decisiones docentes de `editorial/decisions.json` para evitar que una nueva importación revierta decisiones filológicas.

Consulta `docs/CONCILIACION_ETIMOLOGICON.md` y ejecuta `npm run etymology:audit` desde la raíz.


## Conciliación docente completada

Se ha incorporado el inventario auditado individual de Griego I como fuente editorial inmutable: **111 étimos, 108 elegibles, 201 derivados admitidos y 217 relaciones**. Lee [el informe](../../../docs/ETIMOLOGICON_BANCO_CONCILIADO.md), o ejecuta `npm run etymology:compile`. Las candidatas originales siguen pendientes por separado y no se sobrescriben. La fuente DLE citada en el Excel aún no se ha vuelto a verificar de forma independiente, no hay significados griegos completos y el módulo no se ha publicado.
