# Banco académico de etimología griega · Etymologicon

Módulo de datos para ScholaClassica. **No es todavía un banco de respuestas autorizado.**

- Fuente: instantánea del banco de Griego I del repositorio GeneradorExamenes, referenciada a un commit fijo.
- Candidatos: 111 étimos, 196 formas castellanas y 212 relaciones (ninguna declarada verificada).
- Auditoría docente informada: 111 étimos, 108 elegibles y 201 derivados. **Conciliación individual pendiente de recuperar el inventario completo.**
- Griego II: únicamente un espacio de programación vacío; no se generan respuestas de este curso.
- Significados, definiciones y variantes ortográficas: no se rellenan sin prueba individual ni referencias acreditadas.

El esquema oficial está en `model-v1.schema.json`. Los candidatos se mantienen aislados de las decisiones docentes de `editorial/decisions.json` para evitar que una nueva importación revierta decisiones filológicas.

Consulta `docs/CONCILIACION_ETIMOLOGICON.md` y ejecuta `npm run etymology:audit` desde la raíz.

