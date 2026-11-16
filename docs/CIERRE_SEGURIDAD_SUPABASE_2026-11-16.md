# Endurecimiento de Supabase — 16/11/2026

## Alcance y autorizaciones

Dos proyectos: `Palabra_del_dia` (`rzjemisvaaqpnvvgfntl`) y
`Vocabulario_clasico` (`wpwlguufpkfnzlbyproe`).
A partir de la auditoría previa, se han aplicado únicamente **permisos SQL**.
No se han alterado registros, contraseñas, cuentas, códigos, Edge Functions,
bancos académicos, progreso ni la aplicación del alumnado.

La PR #109 conserva la transcripción reproducible de las migraciones:
- [SQL de Palabra del día](sql/seguridad_palabra_dia_2026_11_16.sql)
- [SQL de Vocabulario](sql/seguridad_vocabulario_2026_11_16.sql)

Se ejecutaron directamente como migraciones de Supabase, con su
historial remoto y transacción controlada por el servicio.

| Proyecto | Versión de migración en Supabase | Identificador |
| --- | --- | --- |
| Palabra del día | `20261116182438` | `harden_public_permissions_rankings_students_20261116` |
| Vocabulario | `20261116182535` | `harden_future_public_grants_20261116` |

## Medidas aplicadas

### Palabra del día

- `public.public_rankings_bach2`: se retiraron **todos** los privilegios de
  `anon` y `authenticated`, restituyendo exclusivamente `SELECT`.
  Especialmente se eliminó `TRUNCATE`, que no queda sujeto a RLS.
  `service_role` y `postgres` mantienen los permisos de mantenimiento.
- `public.students`: la primera migración concedió SELECT para
  `authenticated`, necesario para activar las políticas RLS de «mi fila»
  y «docente autorizado». **La segunda migración restringe este permiso
  a las seis columnas de identidad y presentación utilizadas por la app**:
  `id`, `course_id`, `auth_user_id`, `created_at`, `display_name` y
  `student_group`. El campo `invite_code_hash` no es legible por los
  clientes. `anon` continúa sin SELECT.
- Permisos predeterminados para objetos nuevos creados por `postgres`
  en `public`: se retiraron concesiones generales a `anon` y
  `authenticated` para tablas, secuencias y funciones. Se revocó
  globalmente el EXECUTE implícito de PUBLIC sobre **nuevas** funciones
  de `postgres`: un REVOKE limitado a `IN SCHEMA public` no anula
  la concesión global de PostgreSQL. Los grants existentes de
  `service_role` no se modificaron.

### Vocabulario clásico

- Se aplicó el mismo endurecimiento de futuros objetos creados por
  `postgres`, sin modificar permisos ni RLS de las cinco tablas actuales.
  `public.vocab_take_limit` continúa disponible únicamente para el
  servidor; no se habilita acceso directo a las tablas.

## Pruebas después de cada migración

Comprobaciones directas de `pg_catalog`, `has_table_privilege`,
`has_function_privilege`, `pg_default_acl`, historial de migraciones y
consultas en transacciones de solo lectura con `SET LOCAL ROLE`.

| Prueba | Resultado |
| --- | --- |
| Rankings Bachillerato, `anon` y `authenticated`: SELECT | Permitido |
| Rankings, `anon` y `authenticated`: TRUNCATE/INSERT | Denegado |
| Rankings, `service_role`: mantenimiento | Conservado |
| Rankings públicos antes/después | **29 / 29 filas** |
| Tabla de alumnos antes/después | **43 / 43 filas** |
| `students`: SELECT para `anon` | Denegado |
| `students`: SELECT para `authenticated` | Solo seis columnas, sujeto a RLS |
| `students.invite_code_hash`: SELECT para `authenticated` | **Denegado** |
| Identidad ficticia sin alumno/docente asociado, bajo RLS | **0 filas visibles** |
| Identidad docente existente, simulada en lectura aislada | **43 filas visibles** |
| Identidad de alumno existente, consulta de sus votos | **15 votos visibles** |
| Rankings consultados como rol anónimo | **29 filas públicas visibles** |
| `vocab_words`: acceso directo de `anon`/`authenticated` | Denegado |
| `vocab_words`: acceso por `service_role` | Conservado |
| `vocab_take_limit`: EXECUTE por `anon`/`authenticated` | Denegado |
| `vocab_take_limit`: EXECUTE por `service_role` | Conservado |
| Predeterminados de `postgres` para `public` | Solo `postgres` y `service_role` |
| Predeterminado global EXECUTE de funciones de `postgres` | Solo `postgres` |

Los registros de vocabulario en Supabase no son los 2055 registros del
banco estático de Vocabula; sus funciones y datos académicos se mantienen.

### Limitaciones de estas pruebas

La simulación de sesión utiliza el contexto JWT dentro de una transacción
SQL **de solo lectura**: sirve para comprobar los predicados RLS, pero no
equivale a iniciar sesión de manera real en el navegador ni prueba todas
las secuencias de escritura. No se han emitido contraseñas, tokens,
correos, UUID personales ni otros datos identificativos en el informe.

## Hallazgos deliberadamente NO alterados

1. **Treinta autorizaciones históricas de `teacher_admins` en Palabra
   del día.** Corresponden a cuentas anónimas autenticadas que acreditaron
   el código docente. La revocación masiva podría bloquear sesiones
   legítimas. Exige conciliación de dispositivos, identidad del profesor,
   política de caducidad y mecanismo de recuperación antes de retirar
   permisos. No suponer que sean treinta docentes distintos.
2. **Funciones `SECURITY DEFINER` del proyecto de Palabra del día.**
   `manage_student`, `manage_teacher_word` y `review_word_proposal`
   validan `auth.uid()` frente a `teacher_admins` y limitan acciones.
   `record_site_visit` es deliberadamente ejecutable en público para
   contabilizar visitas, pero podría sufrir incrementos artificiales:
   valorar una protección de frecuencia independiente sin falsear
   los contadores reales. Los avisos del asesor no prueban explotación.
3. **Permisos predeterminados de `supabase_admin`.** Permanecen en la
   configuración heredada. El rol conectado `postgres` no es miembro
   de `supabase_admin` y no puede cambiarlos mediante esta conexión.
   Conviene revisar con los mecanismos administrativos de Supabase; la
   mitigación actual cubre los objetos que cree `postgres`.
4. **Protección de contraseñas filtradas.** Continúa deshabilitada en
   ambos proyectos. Supabase la ofrece en Pro y superior; no se contrata
   ningún servicio de pago. El acceso docente de ScholaClassica ya usa
   segundo factor TOTP/AAL2.
5. **Avisos «RLS enabled no policy».** Son deliberados en tablas de acceso
   exclusivamente servidor: no crear políticas permisivas por eliminar
   un mensaje informativo.
6. **Políticas RLS marcadas por uso de `authenticated`.** En Palabra del
   día los estudiantes utilizan autenticación anónima de Supabase. Las
   políticas concretas requieren identidad/curso o pertenencia a
   `teacher_admins`, no la mera condición de estar autenticado.

## Verificación y publicación

El SQL se aplicó a ambas bases y se comprobó con consultas directas.
La PR #109 solo documenta esos cambios y añade pruebas estáticas de
las cláusulas SQL; su integración en GitHub no requiere redeplegar
Edge Functions ni cambiar PWA.

Documentación Supabase:
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/password-security

No reintroducir privilegios `TRUNCATE` públicos como «rollback».
Cualquier reversión futura debe justificar los privilegios uno por uno
y comprobar la semántica de RLS de nuevo.

## Corrección complementaria de permisos por columna (16/11/2026)

Al inspeccionar los privilegios de la migración inicial se comprobó que
`GRANT SELECT ON public.students` permitía también consultar
`invite_code_hash`, aunque siempre bajo RLS. El navegador nunca
necesita el hash. Por tanto, se aplicó la migración
`limit_students_select_columns_hide_access_hash_20261116` en el proyecto
Palabra_del_dia, reproducida en
[`docs/sql/seguridad_palabra_dia_columnas_alumnos_2026_11_16.sql`](sql/seguridad_palabra_dia_columnas_alumnos_2026_11_16.sql).

Se revocó el SELECT de tabla entera y se concedió solamente SELECT por
columna de `id, course_id, auth_user_id, created_at, display_name,
student_group`. Confirmación con PostgreSQL:
`has_table_privilege('authenticated', 'public.students', 'SELECT') = false`;
`has_column_privilege('authenticated', 'public.students',
'invite_code_hash', 'SELECT') = false`; los campos utilizados por la
aplicación sí son consultables, `service_role` mantiene sus derechos
y la RLS continúa activa. No se modificaron filas (43 registros).

Pruebas de solo lectura: identidad ajena a alumnos/docentes, 0 filas;
identidad docente, 43 fichas visibles; una identidad de alumno pudo
seguir consultando sus votos (15 en el caso ensayado). Esta corrección
cierra un alcance de lectura innecesario detectado en la auditoría,
sin atribuirle explotación ni afirmar que se hayan extraído hashes.
