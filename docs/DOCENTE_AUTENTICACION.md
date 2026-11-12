# Zona docente — aprovisionamiento y seguridad (fase II, sin desplegar)

## Decisión provisional documentada

Se han inspeccionado en solo lectura los dos proyectos de Supabase:

| Proyecto | Autenticación actual | Función en el diseño |
| --- | --- | --- |
| `Vocabulario_clasico` | Sin usuarios en `auth.users`; el login propio utiliza otras tablas | **Candidato preferente para la identidad de ScholaClassica** |
| `Palabra_del_dia` | Contiene usuarios anónimos asociados a sus aplicaciones | Origen de propuestas y estadísticas, sin compartir login ni modificar su Auth |

No se ha alterado ninguna configuración de los proyectos ni creado cuentas. Usar el primero evita un tercer proyecto y mantiene separadas las identidades de alumnos de Palabra del día; **es una elección reversible antes de activarse**.

## Aislamiento por origen — condición indispensable

GitHub Pages utiliza el **mismo origen** `https://archaiosmagister.github.io` para todos los repositorios bajo ese usuario. Un directorio `/ScholaClassica/docente/` **no es un aislamiento de seguridad**. Por ello:

- `npm run build` genera `dist/` público y siempre coloca `dist/docente/auth-config.json` en `{"enabled":false}`. Si se le pasan variables `SCHOLA_AUTH_*`, aborta expresamente.
- `npm run build:docente` genera **otro artefacto** `dist-docente/`, con HTML, CSS y JS mínimos. No incluye ninguna aplicación de alumnos ni banco privado.
- La activación exige `SCHOLA_DOCENTE_ORIGIN` con un origen **HTTPS diferente** del origen compartido de alumnado, por ejemplo un subdominio del que se tenga el control o un hostname propio de alojamiento separado. La compilación rechaza la activación en `https://archaiosmagister.github.io`, en HTTP y en localhost.
- La Edge Function de lectura también rechaza un origen compartido/HTTP, aunque no debe tratarse el encabezado `Origin` como prueba de identidad: autentica el JWT con Supabase Auth y exige `aal2` más la UUID docente exacta.

Ninguna de las dos compilaciones ejecuta despliegue. GitHub Actions archiva únicamente el artefacto **público y bloqueado**, no el preparado para el servidor docente.

## Creación y protección de la cuenta

Una vez elegido el correo de acceso y el hostname aislado:

1. Designar Vocabula como proveedor de identidad mediante la URL actual del proyecto. Preferir una clave pública `sb_publishable_...`; **nunca** usar `service_role` o `sb_secret_` en el navegador.
2. Configurar Supabase Auth para **no aceptar nuevos registros públicos** y habilitar el factor `TOTP`. Esta medida se aplicará de forma controlada para no alterar ninguna función vigente de Vocabula. Antes de hacerlo, verificar la configuración de Auth en el panel del proyecto.
3. Crear la cuenta individual del docente mediante el panel seguro de Supabase Auth, con un **alias de correo dedicado** y verificado. Su usuario visible seguirá siendo `MagisterArchaios`. No compartir ni guardar la contraseña en ChatGPT o GitHub.
4. Registrar el TOTP en Contraseñas de Apple mediante QR o clave de configuración; verificar un código de seis cifras y confirmar que la sesión alcanza `aal2`. Establecer un método de recuperación independiente, no guardado en este repositorio.
5. Registrar exclusivamente la UUID de esa cuenta como `SCHOLA_TEACHER_USER_ID` en los secretos del proyecto de identidad; nunca introducir esa variable en el frontend.
6. Establecer también `SCHOLA_ALLOWED_ORIGIN` como el nuevo origen HTTPS privado, comprobar límites de intentos, configuración de sesiones y recuperación de segundo factor.

**Para construir la web privada** (sin desplegarla), definir solamente variables públicas en el entorno de compilación:

```bash
SCHOLA_DOCENTE_ORIGIN=https://docente.ejemplo.test \
SCHOLA_AUTH_URL=https://PROJECT_REF.supabase.co \
SCHOLA_AUTH_PUBLISHABLE_KEY=sb_publishable_PUBLICA \
SCHOLA_TURNSTILE_SITE_KEY=0x4AAAAAAA_PUBLICA \
npm run build:docente
```

Los valores anteriores son **marcadores ficticios**. El resultado `dist-docente/auth-config.json` contiene solamente usuario visible, URL y clave *publicable* de Supabase, hostname y clave pública de Turnstile. **No contiene el email docente, la contraseña, los tokens ni el secreto TOTP.** El correo de acceso se configura exclusivamente como secreto de la función de servidor `schola-login` bajo `SCHOLA_AUTH_LOGIN_EMAIL` (nunca como variable de compilación). El artefacto no se publica automáticamente.

## Inicio de sesión privado — preparación, no despliegue

La función `supabase/functions/schola-login/index.ts` recibe usuario, contraseña y un token de Cloudflare Turnstile, pero **no contiene la dirección de correo ni el secreto de Turnstile en el código**.

El servidor verifica el origen HTTPS independiente, valida el formato de la solicitud y resuelve `MagisterArchaios` al correo privado guardado en el secreto `SCHOLA_AUTH_LOGIN_EMAIL`. A continuación solicita a **Supabase Auth** la comprobación conjunta de contraseña y token Turnstile mediante `signInWithPassword({options:{captchaToken}})`.

Esta arquitectura protege también el endpoint **directo** `/auth/v1/token`: es imprescindible habilitar **Authentication > Bot and Abuse Protection > CAPTCHA > Cloudflare Turnstile** en el proyecto de identidad. La clave secreta de Turnstile se configura allí, no como secreto de la función. Si esa protección no está habilitada, la función podría ser esquivada llamando directamente a Supabase Auth.

Por precaución, `schola-login` devuelve **503** si no se configura el indicador operativo `SCHOLA_AUTH_CAPTCHA_ENFORCED=confirmed`. Este indicador **no demuestra técnicamente que CAPTCHA esté activo**: solo debe establecerse después de probar desde una cuenta de prueba que un inicio de sesión directo sin token o con token inválido es rechazado por Supabase Auth.

La función requiere además `SCHOLA_AUTH_LOGIN_EMAIL`, `SCHOLA_TEACHER_USER_ID` y `SCHOLA_ALLOWED_ORIGIN` como secretos, y las variables gestionadas `SUPABASE_URL` y `SUPABASE_ANON_KEY`. Devuelve una sesión **AAL1** exclusivamente si Supabase Auth autentica a la UUID docente exacta. Esta sesión **no da acceso a los avisos** sin completar TOTP y alcanzar **AAL2**.

`supabase/config.toml` establece `verify_jwt=false` solo para `schola-login`, ya que todavía no existe una sesión de usuario. En `schola-inbox` se conserva `verify_jwt=true` y las comprobaciones adicionales de identidad y AAL2.

**Antes de activar esta función** habrá que crear el widget de Turnstile en Cloudflare, registrar el hostname docente real, activar el proveedor Turnstile con su secreto en Supabase Auth, realizar pruebas de rechazo de CAPTCHA por la vía directa y, solo entonces, habilitar la función. No se ha activado ninguno de esos servicios.

## Endpoint de avisos — preparación, no despliegue

La función `supabase/functions/schola-inbox/index.ts` valida `getUser(token)`, usuario exacto y `aal2`. Tras autorizar, consulta de forma limitada y en solo lectura:

- `Vocabula: public.vocab_reports`: solo `pending` y `reviewing`.
- `Palabra del día: public.word_proposals`: solo `pending`.

Se requieren secretos **solo en el servidor**: `SCHOLA_TEACHER_USER_ID`, `SCHOLA_ALLOWED_ORIGIN`, `VOCABULA_SUPABASE_URL`, `VOCABULA_SERVICE_ROLE_KEY`, `PALABRA_SUPABASE_URL`, `PALABRA_SERVICE_ROLE_KEY`. El uso de claves privilegiadas para consultar ambos orígenes está sujeto a una auditoría de mínimo privilegio antes de la activación. **No introducir estas claves en la configuración de la web**.

La función no puede actualizar ni aprobar sugerencias. Los enlaces llevan a las webs originales y se generan exclusivamente con URLs fijas conocidas, no con texto del alumnado.

## Pruebas y bloqueos de producción

GitHub Actions comprueba copia y navegación de las aplicaciones, construcción docente desactivada, origen aislado, rechazo de claves privadas/HTTP, usuario no autorizado, sesión `aal1`, TOTP y visualización segura de contenido de un aviso. Las pruebas de login y bandeja utilizan respuestas simuladas: **no acreditan una autenticación real con Apple ni con las bases de datos de producción**.

Antes del primer despliegue será imprescindible:
- Disponer del correo de acceso y del origen HTTPS independiente, y crear manualmente la cuenta en el panel seguro de Supabase.
- Revisar seguridad real de Supabase Auth y limitar los registros públicos. Configurar Cloudflare Turnstile **dentro de Supabase Auth** y comprobar que su endpoint directo rechaza contraseñas sin CAPTCHA.
- Desplegar `dist-docente/` únicamente en un alojamiento HTTPS aislado que respete el archivo `_headers` generado, incluyendo CSP, `frame-ancestors 'none'`, `Referrer-Policy`, `X-Content-Type-Options` y `Cache-Control: no-store`; confirmar las cabeceras con una prueba HTTP real.
- Sustituir la carga desde CDN del SDK por un recurso con integridad verificada y probar inicio de sesión en iPhone, iPad y Mac.
- Probar recuperación, caducidad y revocación de sesiones, así como la lectura y los enlaces de avisos de ambos orígenes.
- Revisar los avisos de seguridad que muestran los proyectos originales sin modificar sus políticas de forma imprevista.

## Estado

**Sin publicación y sin credenciales reales.** No se ha modificado ningún repositorio original ni la base de datos de las dos aplicaciones. El generador de exámenes y la práctica morfológica permanecen aplazados.
