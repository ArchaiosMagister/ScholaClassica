# Sincronización selectiva de Vocabula — 16 de noviembre de 2026

## Origen y revisión
`0e16505b7631298a0448c4160a5d258f82732bfe` → `a7be2161a2401816ede78a96981daaac6850b8d2` en `ArchaiosMagister/VocabulaLatinaGraecaque` (dos commits).

**No se modifica ni se reconstruye el banco original:** `data.js` conserva el blob Git `2193655783907cf2c972e934f0fc2e4ca429d3e4`, los 2.055 registros y sus identificadores. Tampoco cambian `app.js`, `choice.js`, `config.js`, `scope.js`, `style.css`, `theme.js` ni `gramatica-contenidos.js` respecto de la revisión anterior.

## Cambios funcionalmente importados
- El origen nuevo entrega un `teacher.js` público sin sesión, credenciales ni operaciones de administración. ScholaClassica lo comprueba mediante contrato, **sin volver a recortar el archivo por posiciones**.
- El HTML de origen ya no contiene botones o diálogos de profesor. ScholaClassica conserva su área docente independiente.
- Se mantiene el enlace al módulo de gramática, los tres corpus General/Examen/Todo, las unidades complementarias bajo activación, el aviso de errores, la recuperación offline, el reenvío de avisos y el progreso por los IDs históricos.
- El cliente integrado sigue aplicando sus correcciones editoriales documentadas **únicamente en dist**.
- Se actualiza la revisión inmovilizada y ambos workflows, incluida la auditoría independiente LEMLAT3, para mantener compilaciones reproducibles.

Los cambios de `backend/index.ts` del repositorio Vocabula **no se copian ni se despliegan** con ScholaClassica. Este trabajo no aplica cambios de base de datos, autenticación, Supabase ni servicios remotos. Es exclusivamente una integración pública de solo lectura / envío de avisos por la API existente.

## Criterios de cierre
1. La fuente original de 2.055 fichas y su blob Git siguen intactos.
2. La copia integrada carece de código de login/gestión heredada del alumnado y permite avisos.
3. Pruebas estáticas, 3 corpus, progreso, navegador Chromium, offline, seguridad y AAL2 correctas.
4. Auditoría LEMLAT3 independiente sin regresiones.
5. No se fusiona si una batería falla; toda publicación exige primero validar `main`.
