# Zona docente — seguridad y bandeja unificada (fase inicial)

## Estado verificable

- Pantalla de usuario `MagisterArchaios`, contraseña y TOTP con QR y clave manual.
- Se usa el SDK oficial de Supabase Auth, fijado a versión `2.119.0`, con registro público deshabilitado por diseño de la interfaz.
- **El acceso a datos no depende de la interfaz**: la función `schola-inbox` comprueba la sesión contra Supabase Auth mediante `getUser(token)`, verifica `aal2`, `auth.uid` y una UUID docente permitida desde variables de entorno.
- La API consulta en solo lectura los registros pendientes de `vocab_reports` y `word_proposals` en dos proyectos diferentes. No devuelve identificadores de alumnos ni permite aprobar, editar o borrar.
- Los datos se presentan con `textContent` (no mediante `innerHTML`) y los enlaces de origen están fijados en el cliente.
- El artefacto de CI **no contiene credenciales ni activa la zona privada**. Para acceder efectivamente, falta aprovisionar cuenta, MFA y función de servidor.
- No se toca Palabra del día, Vocabula ni GeneradorExamenes. No se ha desplegado la web pública ni la función.

## Decisión de infraestructura

La identidad docente tendrá un **proyecto de Supabase Auth designado como central**. Puede aprovechar uno de los proyectos existentes o crearse otro, previa valoración de costes. El código no queda acoplado a una elección: `SUPABASE_URL` de la Edge Function y `SCHOLA_AUTH_URL` en la construcción deben señalar al **mismo proyecto**.

No creamos ni migramos cuentas automáticamente. Supabase Auth utiliza email/contraseña; para mostrar solo un usuario en la pantalla se requiere crear una cuenta con un **alias de email dedicado al acceso docente**. El alias se configura como `SCHOLA_AUTH_LOGIN_EMAIL` durante la construcción, no dentro del repositorio. Ese email aparecerá en el artefacto estático, por lo que debe ser un alias, no una dirección privada.

## Configuración antes de activar (todavía pendiente)

1. Designar el proyecto de identidad; crear **manualmente** una cuenta de correo verificado mediante Supabase Auth, bloquear el registro público y establecer contraseña robusta. Anotar la UUID de la cuenta, sin introducirla en HTML.
2. Configurar el segundo factor TOTP en Supabase Auth. La pantalla de acceso permite al primer inicio registrar el QR/clave en Contraseñas de Apple. Verificarlo con seis cifras para alcanzar `aal2`.
3. Publicar la función `supabase/functions/schola-inbox/index.ts` en el proyecto de Auth (sin hacerlo desde este PR). Ajustar `SCHOLA_TEACHER_USER_ID` al UUID exacto del docente y `VOCABULA_SUPABASE_URL`, `VOCABULA_SERVICE_ROLE_KEY`, `PALABRA_SUPABASE_URL`, `PALABRA_SERVICE_ROLE_KEY` como secretos de Edge Function. Esas claves privilegiadas **nunca** van al portal.
4. Definir el secreto de función `SCHOLA_ALLOWED_ORIGIN` con el origen HTTPS exacto de una **web docente separada**. No usar el origen compartido `https://archaiosmagister.github.io` donde se ejecutan las aplicaciones de alumnos.
5. Construir con `SCHOLA_AUTH_URL`, `SCHOLA_AUTH_PUBLISHABLE_KEY`, `SCHOLA_AUTH_LOGIN_EMAIL`. Solo esas variables públicas generan `dist/docente/auth-config.json` habilitado; si falta alguna, permanece `{"enabled":false}`.
6. Probar contra cuenta real: acceso normal, alta de TOTP, cierre de sesión, denegación en `aal1`, usuario distinto, caducidad y avisos de ambos proyectos. No activar ni publicar hasta superar pruebas manuales y automatizadas.
7. Preparar recuperación de segundo factor por un canal independiente y políticas de revocación de sesiones. **No guardar clave TOTP de recuperación en GitHub.**

### Precauciones

- Supabase Auth exige una dirección de correo real; el usuario visible no es, por sí solo, una credencial reconocida por Supabase.
- HTML/JS del área son públicos en GitHub Pages. Lo protegido son sus datos/operaciones en servidor, no el código fuente.
- **Aislamiento por origen obligatorio antes de la puesta en marcha**: en GitHub Pages, las webs bajo `archaiosmagister.github.io` comparten un origen aunque estén en rutas diferentes. Un fallo XSS de otra aplicación puede comprometer la sesión docente si se usa el mismo origen. La versión inicial de la interfaz usa sesiones **solo en memoria** (`persistSession:false`), sin conservar tokens en localStorage, por lo que será preciso iniciar sesión al recargar la página. Antes de activarla, alojar la zona docente bajo **otro hostname**, establecer CSP restrictiva y distribuir el SDK con integridad comprobada.
- Configurar rate limiting y MFA obligatoria a nivel de servidor; se deniegan sesiones `aal1`.
- El SDK web procede de un CDN con versión fijada: antes de producción, conviene distribuir una copia de versión inmutable con integridad comprobada y una Content Security Policy adecuada.
- Con `scope: 'global'` el cierre de sesión revoca sesiones en Supabase Auth; verificarlo en el entorno real. Para máxima seguridad se exige TLS.
- Las URLs de Palabra del día apuntan provisionalmente al portal original; revisar enlaces exactos según curso antes de dar por terminada la bandeja.
- La función devuelve como máximo 100 avisos por origen por petición; la paginación y los avisos resueltos se tratarán en otra fase.

Referencias:
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/reference/javascript/installing
