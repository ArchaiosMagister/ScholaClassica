# Zona docente en Cloudflare Pages — preparación sin despliegue

**Elección docente:** Cloudflare Pages. **Estado:** no existe despliegue ni proyecto Pages creado por esta integración; no se ha modificado Supabase ni ninguna web original.

## Publicación manual, sin integración automática

Se recomienda un proyecto **Direct Upload**, con publicación únicamente cuando exista autorización expresa. Cloudflare Pages puede desplegar automáticamente cada push y PR al conectar GitHub: por eso no conectaremos el repositorio ni crearemos el proyecto durante esta fase.

**Consecuencia:** Cloudflare no permite convertir después un proyecto Direct Upload en otro integrado con Git. Cambiar de estrategia requeriría crear un proyecto nuevo. Esto es deliberado para mantener aprobación manual de cada versión del área docente.

Cuando se active, el proyecto tendrá un hostname HTTPS separado, por ejemplo `https://NOMBRE_REAL.pages.dev`, asignado por Cloudflare. Este texto es solo ilustrativo; **no hay un hostname elegido ni publicado**. El origen debe coincidir exactamente con `SCHOLA_DOCENTE_ORIGIN` y `SCHOLA_ALLOWED_ORIGIN`. No se usa `archaiosmagister.github.io`, cuyo origen comparte recursos con las aplicaciones del alumnado.

## Artefacto independiente y pruebas

`npm run build:docente` genera `dist-docente/` sin desplegar. Sin variables genera `auth-config.json` con `enabled:false`. Los únicos archivos esperados son el HTML/CSS/JS docente, configuración pública, `_headers`, `robots.txt` y `404.html`. No incorpora los bancos, apps ni GeneradorExamenes.

Cloudflare Pages aplica las cabeceras de `_headers` en recursos **estáticos**, no en Pages Functions. Se incluyen CSP, `frame-ancestors 'none'`, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, noindex y no-store. `robots.txt` y `noindex` **no protegen datos**: únicamente el servidor, con Auth, segundo factor y permisos, puede hacerlo.

Por seguridad, una compilación habilitada exige seis variables públicas: `SCHOLA_DOCENTE_ORIGIN`, `SCHOLA_AUTH_URL`, `SCHOLA_AUTH_PUBLISHABLE_KEY`, `SCHOLA_TURNSTILE_SITE_KEY`, `SCHOLA_SUPABASE_SDK_FILE` y `SCHOLA_SUPABASE_SDK_SHA256`. Las dos últimas fijan una copia local revisada del SDK oficial Supabase; el build comprueba la huella SHA-256 y la copia a `vendor/supabase.js`. El navegador no cargará Supabase desde CDN. Este archivo real todavía **no se ha incorporado**.

`npm run audit:docente:cloudflare` comprueba el paquete generado desactivado y sin secretos. Este control también se ejecuta en GitHub Actions; no contiene comandos de despliegue.

La auditoría de un artefacto activable se ejecuta con `npm run check:docente:readiness` después de proporcionar `SCHOLA_SUPABASE_SDK_SHA256`. La comprobación es **local**: no sustituye pruebas reales de la cuenta, CAPTCHA ni TOTP.

Se ha preparado una secuencia concreta de operaciones de los paneles de Cloudflare y Supabase en [ACTIVACION_GUIADA_DOCENTE.md](ACTIVACION_GUIADA_DOCENTE.md).

## Pasos de activación que quedan pendientes

1. Con autorización específica, crear la cuenta Cloudflare y un proyecto Pages **Direct Upload** con hostname HTTPS real. No conectar GitHub.
2. Crear el widget Turnstile limitado al hostname real; activar y probar CAPTCHA en **Supabase Auth**, también por el endpoint directo, antes de declarar `SCHOLA_AUTH_CAPTCHA_ENFORCED=confirmed`.
3. Crear en Supabase Auth la cuenta docente con su correo suministrado por un canal privado y una contraseña que no se comparta aquí. Registrar el código TOTP en Contraseñas de Apple, verificar `aal2` y disponer de recuperación.
4. Configurar los secretos de `schola-login` y `schola-inbox` exclusivamente en Supabase: correo, UUID autorizada, origen exacto y credenciales de lectura de los otros dos servicios. Mantener siempre `service_role` fuera de GitHub y Cloudflare.
5. Obtener una copia oficial, versionada y auditada del SDK Supabase, registrar su SHA-256 comprobado y construir el artefacto habilitado en un entorno protegido. Verificar contenido, CSP, cabeceras, cookies, ausencia de credenciales y cierre de sesiones.
6. **Solo con autorización expresa de publicación**, subir manualmente los archivos con Direct Upload, probar el acceso real en iPhone/Mac y comprobar negativas de autorización.

## Referencias oficiales

- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/turnstile/reference/content-security-policy/
- https://supabase.com/docs/guides/auth/auth-captcha

**No hay despliegue, usuario docente, conexión Cloudflare–GitHub ni alteración de bases de datos en esta fase.**
