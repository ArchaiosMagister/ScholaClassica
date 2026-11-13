# Área docente de ScholaClassica — GitHub Pages + Supabase Auth

Estado: **preparación en la rama de desarrollo; NO activar ni publicar todavía**.
Esta propuesta reemplaza la arquitectura anterior de Cloudflare Pages/Turnstile. No requiere dominio propio ni Cloudflare.

## Alcance de la bandeja central

- **Vocabula Latina Græcaque:** avisos de `public.vocab_reports` con estado `pending` o `reviewing`.
- **Palabra del día** (ambos cursos, repositorio externo): propuestas de `public.word_proposals` en estado `pending`. Su interfaz de profesor **se conserva**.
- **Appendix, Evolutio, Etymologicon y GeneradorExamenes:** no se ha comprobado un buzón remoto de avisos equivalente en sus implementaciones actuales. No fabricar registros ni confundir mensajes locales de validación con avisos enviados al profesor.
- La bandeja es **solo lectura**. Las aprobaciones siguen en la aplicación original hasta diseñar una API autorizada de escritura.

Se excluyen de los resultados `student_id`, códigos de alumno, correos personales, identificadores internos innecesarios y claves. Los campos libres de mensaje/definición **pueden incluir datos identificativos introducidos por estudiantes**, por lo que nunca se publican en ficheros estáticos ni se guardan offline.

## Arquitectura y amenazas

El área docente reside en `https://archaiosmagister.github.io/ScholaClassica/docente/`.
El origen `https://archaiosmagister.github.io` es **compartido con otras GitHub Pages** de la misma cuenta. No es un perímetro privado: cualquier visitante puede leer HTML/JS y la clave **publicable**. La pantalla no concede permisos.

`schola-login` usa email secreto del servidor y contraseña de Supabase Auth, con límites nativos de intentos del proveedor. `schola-inbox` verifica **en servidor** el usuario real mediante `getUser(token)`, la UUID docente exacta y `aal2` (TOTP); después consulta solo fuentes autorizadas.

El control de `Origin` es una medida de reducción de superficie, **no** prueba de identidad ni sustituye JWT, MFA, políticas de Supabase y seguridad contra XSS. La sesión se conserva solo en memoria (`persistSession:false`); no guardar tokens en `localStorage` ni en cachés PWA. Mantener el contenido docente libre de HTML inyectado usando `textContent`.

GitHub Pages no procesa el archivo `_headers` de Cloudflare. El build público añade una CSP mediante `meta`, con restricciones parciales: no puede imponer `frame-ancestors` ni cabeceras `Cache-Control`. No subir archivos con datos reservados.

## Configuración todavía pendiente de intervención personal

1. En el proyecto Supabase **Vocabulario_clasico** (`wpwlguufpkfnzlbyproe`) revisar el registro público y desactivarlo si ninguna otra aplicación lo necesita. No cambiar el sistema propio de acceso de Vocabula.
2. Crear **una única cuenta individual** en Authentication > Users; establecer contraseña robusta en el panel seguro y verificar el correo. El usuario visible será `MagisterArchaios`. **Nunca** introducir aquí ni en GitHub contraseña, correo de acceso privado, códigos TOTP o claves privilegiadas.
3. Habilitar MFA TOTP para esa cuenta. Probar alta, segundo factor, recuperación y revocación de sesiones. Revisar los rate limits de Supabase Auth. No se requiere Turnstile.
4. Configurar exclusivamente en los secretos de las funciones Supabase:
   - `SCHOLA_AUTH_LOGIN_EMAIL` y `SCHOLA_TEACHER_USER_ID` (UUID real de Auth).
   - `SCHOLA_ALLOWED_ORIGIN=https://archaiosmagister.github.io`.
   - `SCHOLA_AUTH_LOGIN_READY=confirmed` **solo después de completar la comprobación**.
   - `VOCABULA_SUPABASE_URL`, `VOCABULA_SERVICE_ROLE_KEY`, `PALABRA_SUPABASE_URL`, `PALABRA_SERVICE_ROLE_KEY` cuando la auditoría de mínimo privilegio permita su uso.
5. Revisar/activar las funciones `schola-login` (`verify_jwt=false`, autentica desde cero) y `schola-inbox` (`verify_jwt=true` y verificación adicional AAL2/UUID). No desplegarlas con secretos sin probar el rechazo a usuarios no autorizados, AAL1 y JWT caducado.

## Compilación prevista

`npm run build` publica el artefacto docente **deshabilitado** por defecto y rechaza variables secretas `SCHOLA_AUTH_*`. Activarlo requiere conjuntamente:
- `SCHOLA_DOCENTE_ENABLE=confirmed`
- `SCHOLA_DOCENTE_SUPABASE_URL=https://wpwlguufpkfnzlbyproe.supabase.co`
- `SCHOLA_DOCENTE_PUBLISHABLE_KEY=sb_publishable_...` (solo clave publicable)
- `SCHOLA_DOCENTE_SDK_FILE`: SDK oficial auditado y empaquetado localmente
- `SCHOLA_DOCENTE_SDK_SHA256`: huella SHA-256 previamente comprobada

Esta activación **no se ha configurado** en GitHub Actions ni se ha desplegado. Antes de introducir estas variables en un workflow productivo será necesario adaptar las pruebas de la versión bloqueada y separar la validación de la etapa de publicación. Las claves de servicio y el email del profesor no aparecen en `dist/`.

## Retirada de paneles duplicados

No eliminar aún interfaces docentes de Vocabula ni de ninguna aplicación integrada. Primero completar extremo a extremo con datos de prueba, confirmar avisos, filtros y enlaces, comprobar móviles, y disponer de reversión. Después retirar únicamente accesos duplicados, sin eliminar la capacidad original de enviar avisos ni su base de datos. **Palabra del día conserva íntegramente su panel docente.**
