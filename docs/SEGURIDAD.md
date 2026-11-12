# Seguridad de la zona docente

Existe una **primera implementación no activada** de autenticación central con Supabase Auth y TOTP, más un endpoint de avisos de solo lectura. El portal público y la zona docente tienen artefactos **de construcción separados**: `dist/` y `dist-docente/`. El primero nunca puede activarse con las variables de identidad; el segundo exige un origen HTTPS independiente. Véase [DOCENTE_AUTENTICACION.md](DOCENTE_AUTENTICACION.md).

**No es una zona privada operativa en producción**: el artefacto público contiene `docente/auth-config.json` con `enabled:false`, y el artefacto docente también se genera desactivado por defecto; no hay identidad ni claves configuradas, y `schola-inbox` no está desplegada.

## Límites de la protección

- GitHub Pages publica HTML, CSS y JavaScript: son públicos por definición; nunca colocar allí datos o herramientas realmente secretos.
- La Edge Function `schola-inbox` rechaza peticiones que no correspondan a una cuenta previamente designada y a una sesión validada por Supabase Auth con TOTP (`aal2`). No depende de ocultar enlaces.
- Las claves privilegiadas de los orígenes viven exclusivamente en secretos de función. Se han probado rutas negativas con simulaciones; falta validar el extremo a extremo con Supabase Auth real.
- El GeneradorExamenes original mantiene su URL y alojamiento independientes; ScholaClassica no puede proteger una web publicada en otro dominio solo mediante un enlace o un login en este portal. No se incorpora a `dist/`.
- No se reutilizan los códigos de alumno de Palabra del día. La consulta de propuestas externas no realiza cambios ni guarda información personal del alumnado en ScholaClassica.

Pendientes imprescindibles: aprovisionamiento de cuenta e identidad central, secretos, configuración de CAPTCHA/rate limiting, recuperación y revocación, pruebas reales de TOTP con Contraseñas de Apple, auditoría en dispositivos y decisión final sobre un CDN frente a SDK vendorizado.
