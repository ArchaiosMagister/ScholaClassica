# Etymologicon 1.0.0 — Griego I

**Primera versión estable del módulo Etymologicon**, integrado en **ScholaClassica**. Esta publicación fija el estado validado el **13 de noviembre de 2026**, en el commit `263ddfff35680de9a5ff1b667aade9982ee339ad`.

> **Alcance de esta Release:** únicamente Etymologicon / Griego I. La etiqueta identifica un commit del repositorio conjunto `ScholaClassica`; **no** declara estables ni publica por sí misma los demás módulos de la plataforma.

## Qué incluye

- Portada con accesos diferenciados a **Practicar** y **Estudio del léxico**.
- **111 étimos griegos** organizados por unidades de Griego I; **108 aptos para ejercicios** y tres reservados para consulta.
- **487 derivados castellanos** distintos en el banco cerrado y el glosario, con definiciones didácticas, etimología de sus componentes y tratamiento de voces con más de una raíz.
- Ejercicios de escritura de dos derivados, tarjetas, correspondencias, respuesta múltiple, identificación inversa de étimos y descomposición de palabras castellanas.
- Corrección automática determinista: **1 punto** por derivado correcto, **0,5** cuando se reconoce un derivado con faltas ortográficas y **0** para respuestas no admitidas.
- Teclado griego virtual y escritura por transliteración latina; adaptación táctil para evitar el solapamiento con el teclado del móvil.
- Repaso general inteligente, selección de unidades y repetición de errores, con **estadísticas locales** y posibilidad de exportar/importar el progreso.
- Interfaz en castellano, adaptable a ordenador, iPad y teléfono, con modos claro, oscuro y OLED.
- Instalación PWA y uso sin conexión tras la descarga inicial de los recursos; caché propia aislada de otras aplicaciones.

## Revisión académica y limitaciones conocidas

- El inventario de 487 voces dispone de definición didáctica y de análisis explícito de componentes o de familia léxica.
- La concordancia con los **tres PDF docentes** localizó **475** voces por coincidencia textual; **12** requieren documentación alternativa. La mención en un PDF **no implica validación individual en el DLE**.
- Se mantienen los estados de evidencia independientes: **36** fichas con contraste individual marcado en el DLE, además de comprobaciones especializadas y notas editoriales; **451** fichas siguen sin ese cotejo artículo por artículo. Los tecnicismos documentados fuera del DLE no se consideran automáticamente incorrectos.
- Los **16 ejercicios de descomposición** constituyen una modalidad cerrada y distinta del repertorio informativo de composiciones del glosario.
- No hay cuentas de alumnado ni sincronización de progreso con servidor: el progreso se guarda localmente en el dispositivo. Antes de borrar datos de la PWA, conviene exportarlo.
- **Griego II no forma parte de esta versión.** Se incorporará en una versión futura cuando se publique el temario oficial; no se anticipa ni inventa su inventario exigible.

## Validación y uso

- Validación automática del catálogo, corrección, navegación y funcionalidades offline, incluyendo pruebas en Chromium y verificación del despliegue en GitHub Pages.
- Comprobación satisfactoria de funcionamiento en dispositivo real efectuada por el docente antes de cerrar esta versión.
- Webapp: https://archaiosmagister.github.io/ScholaClassica/apps/etymologicon/
- Carpeta fuente del módulo: `apps/etymologicon/`.
- Informe de contraste: `docs/ETIMOLOGICON_CONTRASTE_LEXICOGRAFICO_20261113.md`.

**Esta etiqueta es un punto estable de recuperación.** Las correcciones posteriores podrán incorporarse sin modificar retrospectivamente la versión 1.0.0.
