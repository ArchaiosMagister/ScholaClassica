# PWA del portal ScholaClassica — publicación de prueba

## Arquitectura y política de caché

El portal **ScholaClassica** se instala como PWA independiente mediante `manifest.webmanifest`, un icono de Σ en azul oscuro y `sw.js`. La portada está disponible offline tras la primera instalación satisfactoria.

La prioridad es **no interferir con Evolutio ni Etymologicon**:

| Componente | Prefijo de caché | Recursos interceptados | Actualización |
| --- | --- | --- | --- |
| Portada | `schola-portal-` | Solo la portada, su CSS/JS, manifiesto e iconos | Botón «Actualizar»; confirmación antes de activar |
| Evolutio | `schola-evolutio-` | Solo el módulo `/apps/evolucion-fonetica/` | Su propio botón «Actualizar», conservado del original |
| Etymologicon | `schola-etymologicon-` | Solo `/apps/etymologicon/` | Su sistema de actualización propio |

El service worker del portal tiene alcance raíz, pero **no llama a `respondWith` para rutas de `apps/*`**. Las herramientas sin SW propio (p. ej. algunas páginas de gramática y vocabulario) no reciben promesas falsas de funcionamiento offline completo.

El SW del portal no llama a `skipWaiting` en instalaciones de actualización sin permiso. Solo activa la actualización mediante el mensaje `SCHOLA_ACTIVATE_PORTAL_UPDATE`, después de confirmar con el usuario. El estado offline se comunica como texto. Las cachés no se comparten ni se eliminan entre aplicaciones.

**No** se borran registros de progreso local, respuestas de alumnos ni almacenes `localStorage` en procesos de actualización.

## Evolutio: actualización revisada

Se actualizó el SHA fijado a `901dacb125ee7894ea9d11faf7b0d0afa7e713b5`, que incorpora 11 commits posteriores a la integración anterior. Entre sus novedades:

- 522 fichas practicables y nuevo fichero de dificultad.
- Repaso general y repaso focalizado de una sola norma; niveles de dificultad multiselección.
- Máximo de tres intentos por fase, opción de consultar solución y avance sin bloqueos.
- Botón propio de actualización de la PWA.
- Grafía latina `u` de valor consonántico, con búsqueda equivalente a `v` para los lemas latinos.

Las 240 fichas importadas desde GeneradorExamenes fueron clasificadas por criterios técnicos; **no se afirma que estén certificadas individualmente**. El código original de ambos repositorios no se modifica. El archivo de dificultades y todos los nuevos módulos están precargados por el SW de Evolutio para funcionar offline.

## Instalación en dispositivos

- **iPhone/iPad:** abrir la portada en Safari, Compartir, «Añadir a pantalla de inicio», «Abrir como app».
- **Android:** en Chrome, menú «Instalar aplicación» o «Añadir a pantalla de inicio».
- **Ordenador:** los navegadores compatibles permiten instalar la PWA desde sus controles de aplicación.

Hay iconos PNG de 180, 192 y 512 píxeles, variante `maskable` y SVG. Se generan de manera reproducible con Node durante la construcción, sin copiar iconos de otros proyectos.

## Pruebas y límites

Las comprobaciones automáticas verifican iconos PNG, manifiesto, huella de versión, aislamiento de cachés, el banco de 522 fichas, recursos añadidos y navegación real sin conexión en Chromium. Se incluye una prueba en la que la activación del SW de Evolutio no debe borrar las cachés de la portada ni de Etymologicon.

Las pruebas de Chromium no sustituyen una comprobación en iPhone/iPad real. La portada pública ya está alojada mediante GitHub Pages y los cambios se publican únicamente después de las validaciones de CI. GitHub Actions solo crea un artefacto de pruebas, no ejecuta un despliegue.

Fuente oficial de recomendaciones: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers y https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/


## Publicación de prueba mediante GitHub Pages

La publicación del **portal público** ha sido autorizada. El workflow `integracion.yml` ejecuta antes del despliegue las pruebas académicas de todas las fuentes, la auditoría `npm run audit:publicacion`, las pruebas de funcionamiento offline y la nueva prueba `npm run test:browser:pages` con la ruta real `/ScholaClassica/`. Solo después utiliza `upload-pages-artifact` y `deploy-pages`, en la rama `main`. Ninguna PR puede publicar.

GitHub Pages debe tener configurada una única vez la opción **Source: GitHub Actions** en `Settings → Pages`. Si está desactivado, el trabajo de publicación avisará del problema; **no debe interpretarse el éxito de la compilación como una publicación real**. El portal privado de Cloudflare y las credenciales docentes quedan fuera de esta publicación.


## Tema visual de la portada

`public/theme.js` se ejecuta en el encabezado, antes de cargar `style.css`, para evitar cambios bruscos de aspecto. Permite Automático, Claro, Oscuro y OLED. El sistema solo se consulta cuando está elegido Automático; las preferencias explícitas prevalecen en iOS/Android incluso si el dispositivo tiene otro tema. El meta `theme-color` se ajusta también en cada cambio.

El modo OLED utiliza `#000000` para el fondo principal y superficies casi negras, sin sacrificar el contraste de textos, botones ni formularios. Se almacena únicamente una clave local de preferencia; el dato no se envía a ninguna base de datos ni se utiliza en otros módulos. El script figura entre los recursos versionados y precargados por `schola-portal-`, de manera que los temas siguen disponibles sin red.

**Importante:** elegir un tema en ScholaClassica no fuerza el tema de Appendix, Evolutio, Etymologicon ni Palabra del día, que mantienen sus propios controles y sesiones.
