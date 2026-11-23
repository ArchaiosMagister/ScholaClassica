# ScholaClassica 1.0.0

La portada reúne las herramientas de latín y griego en un catálogo y ofrece un itinerario para cinco cursos. Recuerda la asignatura y la última herramienta en el navegador. La ayuda incluye la instalación, el traslado de progreso y los accesos históricos. La nueva ilustración se sirve desde el propio sitio y se incluye en la caché offline de la portada.

## Auditoría de la versión

| Componente | Alcance comprobado |
| --- | --- |
| Portada | Rutas relativas bajo `/ScholaClassica/`, funcionamiento sin conexión, cuatro temas, navegación por teclado, persistencia y pantallas de 320 a 1280 px. |
| Appendix | Integridad de 111 archivos de origen, estructura en castellano y valenciano, 32 unidades en castellano, rutas directas, sintaxis y consulta sin conexión. |
| Vocabula | Integridad de 130 archivos de origen, combinaciones de asignatura, corpus y actividad, conservación de identificadores, importación y exportación entre instalaciones simuladas y sincronización, avisos y reenvío con servicio simulado, incluso después de practicar offline. |
| Evolutio | Integridad de 53 archivos de origen, banco castellano integrado de 622 fichas, filtros, práctica y corrección. La modalidad valenciana sigue en conciliación académica. |
| Etymologicon | Glosario de 111 étimos, seis modalidades, corrección, repaso y progreso local sin conexión. La práctica disponible corresponde a Griego I. |
| Morfología | 764 fichas, 206 combinaciones de curso, unidad y modalidad recorridas en Chromium, escritura, teclado griego y revisión curricular y léxica. |
| Repaso gramatical | Cobertura de las 87 preguntas de sintaxis, conceptos, progreso, traslado bidireccional con datos de prueba, PWA independiente e iPad emulado en Chromium y WebKit. |
| Profesorado | Compilación predeterminada bloqueada, paquete separado de Cloudflare, SDK local y flujos simulados de registro TOTP y autorización AAL2. La compilación explícitamente activa de Pages pasa ahora también la auditoría general antes de subir el directorio. |

Se revisaron los destinos y anclas internos de las 99 páginas HTML del artefacto. La auditoría funcional utiliza las copias integradas y servicios simulados. El alcance funcional abarca las herramientas que se construyen desde este repositorio. Se usaron copias y simulaciones locales para comprobar la compatibilidad con las aplicaciones históricas y los servicios remotos. La revisión técnica y el contraste con los corpus fijados conservan las reservas filológicas registradas en los informes académicos.

La instalación física en iPad y el inicio de sesión con una cuenta docente real están fuera de la verificación local. El portal actual de Pages aloja el área docente en el mismo origen que el alumnado. El paquete para un dominio aislado se sigue construyendo por separado.

## Publicación

El flujo [Integración](../../.github/workflows/integracion.yml) valida el cambio en el pull request. Al integrarlo en `main`, el mismo flujo valida y publica el directorio en GitHub Pages. Tras un despliegue satisfactorio del commit y su comprobación en la URL pública, la etiqueta de la suite es `v1.0.0`. Etymologicon conserva su propio historial de versiones.

Si hace falta revertir el lanzamiento, revierte el cambio en `main` y deja que el mismo flujo publique la versión anterior. Los archivos JSON de progreso siguen siendo transferibles entre las versiones compatibles.
