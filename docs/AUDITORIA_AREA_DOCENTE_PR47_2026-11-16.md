# Auditoría de la PR #47 frente al área docente vigente

**Fecha:** 16 de noviembre de 2026. **Repositorio:** `ArchaiosMagister/ScholaClassica`. **Base de código:** `main@9518a248df13242362b0f46d0b686670d973585a`. **Rama antigua:** PR #47, `88dd8cfb0285ddf396cc4b0ace4c2fa4df769122`.

**Objeto:** identificar qué funciones de la PR #47 continúan pendientes y qué riesgos existen en el área de profesor, sin alterar autenticación, datos, identidades ni las aplicaciones de origen. Auditoría de lectura: GitHub + configuración y código de Edge Functions desplegadas + asesores de seguridad Supabase. No hubo escrituras de Supabase, migraciones, autenticaciones con credenciales docentes ni publicación.

## Resultado

**No se ha identificado ninguna función administrativa exclusiva de la PR #47 que justifique recuperar su implementación antigua.** La rama histórica afecta a 25 rutas y dejó obsoletas implementaciones que después fueron separadas, ampliadas o reforzadas. Es incompatible con el `main` actual; **no fusionarla**.

| Función examinada | PR #47 | `main` actual | Dictamen |
| --- | --- | --- | --- |
| Inicio de sesión sin correo visible en cliente | Proxy `schola-login` | Vigente, con TOTP y comprobaciones servidor | **Cubierto** |
| Autorización docente por UUID y AAL2 | Regla `getUser(token)` + comprobación de claims | Vigente; `schola-vocab-admin` comprueba también nivel MFA actual con Auth | **Cubierto/reforzado** |
| Compilación y carga segura del SDK | Empaquetado local y SHA-256 | Ambos archivos de empaquetado idénticos en Git, compilación posterior | **Cubierto** |
| Bandeja Vocabula + Palabra del día | Consulta de ambas bases desde un solo endpoint | Dos Edge Functions independientes y filtrado de origen, sin compartir credenciales administrativas | **Cubierto con mayor aislamiento** |
| Avisos sin identificadores de alumnos | Tarjetas resumidas | Conservado; el cliente utiliza `textContent`, no HTML del alumnado | **Cubierto** |
| Listar, añadir y editar vocabulario | Solo tabla de aportaciones docentes | Catálogo original + aportaciones + búsqueda por asignatura, texto y paginación | **Ampliado** |
| Retirar vocabulario | Cambio `active=false` | Desactivación reversible de aportaciones docentes; no eliminación de fuentes ni IDs | **Cubierto** |
| Revisar incidencias de Vocabula | `reports.list`, `reports.review` | Mismas operaciones con filtros de estado y área, notas y comprobación de sesión | **Ampliado** |
| Latín II sin UD | Anterior interfaz generalista | Categorías escolares diferenciadas; el editor oculta el campo de unidad | **Cubierto** |
| Revisión de gramática | No se incluía | Módulo independiente `gramatica-auditoria.mjs` y avisos `grammar:%` | **Función adicional** |
| Gestión completa de propuestas de Palabra del día *desde ScholaClassica* | No existía: bandeja solo de lectura | Tampoco: se visualizan avisos y se remite a la aplicación original | **No es una regresión de #47** |

Los controles actuales se reparten entre `public/docente/app.mjs`, `admin-vocabula.mjs`, `vocabula-catalog.mjs`, `gramatica-auditoria.mjs` y las Edge Functions `schola-login`, `schola-inbox`, `schola-palabra-inbox`, `schola-vocab-admin`. Reintroducir `public/docente/app.mjs` u `schola-inbox/index.ts` de #47 eliminaría separación de fuentes y mejoras recientes.

## Hallazgo funcional prioritario: agrupación semántica en el catálogo docente

**Severidad: media-alta para exactitud filológica. No implica modificación ni corrupción del banco original.**

`public/docente/vocabula-catalog.mjs` define la clave de agregación como `subject + '|' + form.normalize('NFC').toLocaleLowerCase()`. `mergeCatalog()` almacena el `meaning` de la primera ficha, **fusiona** todas las `answers` y `units` posteriores y marca `in_exam` cuando alguna procede de Examen, sin preservar separadamente el significado ni el ID de cada entrada de origen.

Cotejo de solo lectura con el `data.js` original fijado de `VocabulaLatinaGraecaque@a7be2161a2401816ede78a96981daaac6850b8d2`:

- **2055** fichas históricas y **1684** claves `subject|form` diferentes.
- **368** grupos contienen más de una ficha histórica.
- En **9** grupos hay al menos dos glosas `meaning` distintas; en **12** grupos difieren las matrices `answers`.
- Ejemplos observados: `silva, –æ` ofrece «selva» (General) y «bosque» (Examen); `ἀρχή, –ῆς` ofrece «gobierno» y «gobierno, origen»; `οἰκέω` alterna «vivir» y «habitar»; `ἀκούω`, `ἄρχω` y `βασιλεύω` incorporan información de régimen de genitivo en una procedencia que no se conserva fielmente en la ficha agrupada.

La aplicación docente puede mostrar una glosa incompleta y mezclar respuestas o procedencias. La práctica independiente de Vocabula **no se ha alterado ni auditado exhaustivamente en esta intervención**: no extrapolar este hallazgo a sus sorteos o respuestas.

**Corrección propuesta en PR independiente, no aplicada:** conservar la identidad original por `id`, `mode`, `units`, `meaning` y `answers`; agrupar únicamente fichas semánticamente compatibles y presentar claramente General/Examen con sus acepciones. Antes de cambiar el editor, revisar cómo la sobreescritura docente `vocab_words` (`subject|form`) debe aplicarse a varias acepciones. Añadir pruebas específicas para los nueve casos y conservar todo el progreso, la fuente de 2055 fichas y el comportamiento offline.

## Verificación de Supabase desplegado (solo lectura)

Se comprobaron los dos proyectos Supabase existentes: el de identidad/Vocabula y el independiente de Palabra del día.

- Las **cuatro Edge Functions docentes** están **ACTIVE**. Sus archivos `index.ts` desplegados coinciden **literalmente** con los archivos de `main`: `schola-login`, `schola-inbox`, `schola-vocab-admin`, `schola-palabra-inbox`. También hay archivos auxiliares de autorización en sus paquetes.
- `schola-inbox` y `schola-vocab-admin` tienen `verify_jwt=true` y comprueban `getUser`, UUID exacta y AAL2. El segundo valida nuevamente la garantía MFA con el servicio Auth antes de ejecutar consultas o escrituras.
- `schola-login` no exige JWT **antes de iniciar sesión**; después usa autenticación Supabase. `schola-palabra-inbox` permite verificar manualmente tokens de **otro proyecto** mediante `getUser`, huella de identidad y AAL2: `verify_jwt=false` en este caso **no equivale a acceso anónimo**.
- Las cinco tablas de Vocabula tienen RLS habilitado y **ninguna política de acceso directo**; la denegación por defecto es coherente con la mediación de Edge Functions que utilizan la clave privilegiada solo después de autorizar al docente. No quitar RLS ni introducir una política permisiva para «resolver» sus avisos.
- Los asesores actuales detectan **protección frente a contraseñas filtradas deshabilitada en ambos proyectos**. Recomendar comprobar su activación en Auth, si el plan lo permite, sin tocar claves ni forzar cambios de pago. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- En Palabra del día hay advertencias por funciones `SECURITY DEFINER` expuestas y políticas de roles compatibles con usuarios anónimos autenticados. Se inspeccionaron las funciones `manage_student`, `manage_teacher_word` y `review_word_proposal`: **comienzan comprobando `auth.uid()` contra `teacher_admins` antes de operaciones**. Eso reduce el riesgo; el aviso del asesor **no demuestra una explotación**. La función pública `record_site_visit` modifica únicamente contadores de visitas para cursos permitidos, aunque conviene revisar límites contra incrementos abusivos. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- Verificación recomendada posterior: revisar cada política RLS y sus privilegios de ejecución en el contexto de sesiones anónimas y docentes, sin desactivar las funciones legítimas de alumnado y votaciones. Referencia: https://supabase.com/docs/guides/security/product-security

## Límites y pruebas

El `main` de referencia terminó anteriormente su ejecución de CI con **446 de 446 pruebas correctas**: https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43861927444. Los tests de `docente-auth`, `docente-alertas`, `docente-vocab-admin`, `docente-browser`, `docente-aislamiento` y `docente-gramatica` cubren autorización simulada, AAL2, rechazo y UI. **Esos tests no sustituyen iniciar sesión y probar en producción la modificación de una ficha con datos reales.** No se han realizado operaciones autenticadas en este estudio.

La bandeja muestra como máximo **100 avisos por origen** en su consulta inicial y señala cuando hay más, sin paginación de historial. Esto es una mejora funcional posible, **no una capacidad perdida respecto a #47**.

## Dictamen y orden de actuación

1. **PR de integridad semántica del buscador docente**: resolver las nueve colisiones, conservar identificadores y acepciones de General/Examen, compatibilidad con sobreescrituras y progreso (prioridad alta).
2. **End-to-end guiado y sin datos de ejemplo en producción**: login docente y TOTP, búsqueda de una ficha existente, creación de un borrador docente de prueba solo con aprobación, revisión de avisos y cierre de sesión (prioridad media).
3. **Endurecimiento de Supabase**: comprobar la protección de contraseñas y documentar la revisión de privilegios/RLS de Palabra del día, manteniendo los derechos de docentes y alumnado (prioridad media).
4. **Opcional**: paginación histórica de avisos y moderación cruzada, siempre con permisos de cada proyecto y solo si hay necesidad real (prioridad baja).

**Decisión sobre PR #47:** su implementación de código está superada; lo prudente es **cerrarla como histórica sin fusionar**, preservando sus comentarios y dejando las tareas nuevas separadas. Esta PR de auditoría **no modifica** código, funciones, datos ni publicación.

## Cierre de auditoría tras PR #107 (16/11/2026)

Esta sección documenta la **situación posterior** a la auditoría de lectura anterior, sin reescribir las observaciones históricas ni pretender que fueran modificaciones realizadas entonces.

- **Hallazgo semántico corregido en ScholaClassica:** la [PR #107](https://github.com/ArchaiosMagister/ScholaClassica/pull/107) se fusionó en `main` mediante el commit `983e0eeec65a8305baafc9e3a722639795bbb50f` y su [flujo de validación y despliegue](https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43922765708) terminó correctamente. Conserva las glosas, respuestas, unidades, modos e IDs por fuente en la consulta docente. Bloquea nuevas sobreescrituras ambiguas porque el sistema vigente aún aplica las aportaciones por `subject|form`, no por ID. Esto no modifica el banco histórico ni el progreso.
- **Función nueva pendiente, no perteneciente a #47:** editar *individualmente* cada variante histórica por su ID requerirá diseño y pruebas independientes del motor de sobreescritura. La vista docente ya no mezcla las variantes; no confundir esa protección con disponer de edición por ID.
- **La PR #47 queda obsoleta:** el cotejo de sus 25 rutas y de los endpoints confirma que no hay ninguna función exclusiva pendiente que justifique fusionar su implementación. El área docente vigente mantiene identidad, MFA AAL2/TOTP, avisos separados, gestión reversible del vocabulario y revisión de incidencias. Conservar el historial y cerrar la PR sin fusionar.
- **Pendientes que no bloquean el cierre:** prueba manual con sesión docente real (sin crear datos de ejemplo), revisión de asesores de contraseñas/RLS y privilegios `SECURITY DEFINER` de Palabra del día, y la paginación de avisos como mejora opcional. Estos aspectos son trabajos separados, no razones para reintroducir código histórico de #47.
- **Alcance de esta PR #106:** exclusivamente el informe de auditoría, más el presente cierre documental. No incluye cambios de aplicación, migraciones, escritura sobre Supabase ni despliegues de Edge Functions.

Este cierre sustituye la recomendación pendiente del punto 1 de «Dictamen y orden de actuación» por el resultado ya materializado en #107; los restantes puntos siguen abiertos como trabajo futuro y no implican una vulnerabilidad confirmada.
