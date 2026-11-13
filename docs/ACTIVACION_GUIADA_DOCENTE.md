# Activación guiada — Cloudflare Pages + Supabase Auth

**Estado:** código preparado, no activado. Este documento no es una orden de publicación. El correo docente no aparece aquí ni en ficheros web.

## Configuraciones elegidas, sin más decisiones pendientes

| Componente | Decisión |
|---|---|
| Hosting docente | Cloudflare Pages, proyecto **Direct Upload** sin integración Git |
| Nombre propuesto | `scholaclassica-docente` (comprobar disponibilidad al crear; aún no es un dominio real) |
| Identidad | Supabase Auth del proyecto **Vocabulario_clasico** (`wpwlguufpkfnzlbyproe`) |
| Usuario visible | `MagisterArchaios` |
| Contraseña | Crear directamente en Supabase, no introducir en ChatGPT/GitHub |
| MFA | TOTP en Contraseñas de Apple. Acceso a avisos solo con `aal2` |
| CAPTCHA | Cloudflare Turnstile **configurado en Supabase Auth**, no solo en el formulario |
| Avisos | Solo lectura desde Vocabula y Palabra del día. Sin aprobación integrada |
| Publicación | Prohibida hasta consentimiento posterior; sin despliegues de prueba |

## Acciones que requieren acceso personal a los servicios

**Cloudflare** (acceso al dashboard por el titular):
1. Acceder a https://dash.cloudflare.com/ y confirmar que la cuenta tiene habilitado Pages.
2. Se puede crear un proyecto **vacío** con Direct Upload, sin subir archivos todavía. Cloudflare explica la creación manual desde `wrangler pages project create` (la orden `wrangler pages deploy` sí publicaría y no debe ejecutarse). Escribir el hostname realmente asignado en la configuración futura, no inventarlo.
3. Crear el widget Turnstile en https://dash.cloudflare.com/turnstile con allowlist del hostname real de Pages. Guardar la **Site Key** como configuración pública y la **Secret Key** solo en Supabase Auth.

**Supabase Auth**, proyecto de Vocabula (el profesor debe introducir la contraseña personalmente):
1. https://supabase.com/dashboard/project/wpwlguufpkfnzlbyproe/auth/users — añadir la cuenta individual con el correo facilitado por el titular, marcarla verificada según el procedimiento del panel, y establecer contraseña robusta con Contraseñas de Apple. No utilizar SQL directo sobre `auth.users` ni subir la contraseña a GitHub.
2. https://supabase.com/dashboard/project/wpwlguufpkfnzlbyproe/auth/providers — revisar/impedir registros abiertos no deseados, sin alterar las funciones existentes de Vocabula.
3. https://supabase.com/dashboard/project/wpwlguufpkfnzlbyproe/auth/protection — activar Cloudflare Turnstile para Auth con la clave secreta del widget. Antes de dar por activado `SCHOLA_AUTH_CAPTCHA_ENFORCED`, comprobar que el endpoint directo de login sin CAPTCHA falla.
4. https://supabase.com/dashboard/project/wpwlguufpkfnzlbyproe/auth/mfa — activar el factor TOTP. Registrar el QR desde el teléfono en Contraseñas de Apple y comprobar una sesión `aal2` antes de servir datos.
5. Registrar `SCHOLA_AUTH_LOGIN_EMAIL`, `SCHOLA_TEACHER_USER_ID` y `SCHOLA_ALLOWED_ORIGIN` como secretos de Edge Functions; mantener las claves de lectura de ambas aplicaciones **exclusivamente** en el servidor. La función de login **no funciona** sin `SCHOLA_AUTH_CAPTCHA_ENFORCED=confirmed`; esta bandera no sustituye la prueba real.
6. Desplegar `schola-login` y `schola-inbox` solo después de comprobar requisitos y mínimos privilegios; realizar las pruebas de acceso indebido y sesión revocada antes de exposición pública.

## Compilación y auditoría (sin publicar)

- `npm run build:docente` produce `dist-docente/`. Sin variables de identidad, la configuración permanece `enabled:false`.
- Con el hostname real, Site Key y clave pública de Supabase, una construcción habilitada también requiere un SDK revisado y su SHA-256. No emplear datos ficticios.
- `npm run check:docente:readiness` comprueba localmente la integridad estática del paquete activo. No llama a servicios remotos, no guarda contraseñas y **no despliega**.
- `npm run audit:docente:cloudflare` comprueba exclusivamente el paquete desactivado que genera CI.

**Pruebas pendientes obligatorias:** inicio de sesión con cuenta real, CAPTCHA validado por Supabase Auth, TOTP en Contraseñas de Apple, rechazo de sesión `aal1`, revocación efectiva, CSP/cabeceras HTTPS, bandeja read-only con RLS/credenciales mínimas y apertura de las aplicaciones originales.

La publicación de `dist-docente/` queda completamente aplazada. Nunca conectar GitHub a Cloudflare Pages sin revisar antes los despliegues automáticos.

## Límites de herramientas de esta conversación

GitHub y Supabase permiten realizar revisiones del repositorio y bases de datos. No hay conexión de administración de Cloudflare ni una operación segura disponible para crear/confirmar usuarios de Supabase Auth; esas acciones requieren acceder al dashboard con la cuenta del titular. No simular que se han realizado.
