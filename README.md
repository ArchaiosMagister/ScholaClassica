# ScholaClassica

Plataforma modular de estudio de latín y griego en construcción **sin publicación para el alumnado**.

## Estado (fase 3 · interfaz etimológica en pruebas)

- **Appendix grammaticæ**: copia completa y sin alteraciones desde un commit fijado, en `dist/apps/gramatica/`.
- **Evolutio**: copia completa en `dist/apps/evolucion-fonetica/`; su banco y motor de corrección se mantienen idénticos. **Solo en la copia integrada** se adapta el service worker para aislar la caché y se recalibran las etiquetas de dificultad, dando prioridad al resultado castellano sobre el número de leyes. El original permanece intacto.
- **Etymologicon**: primera modalidad nativa de dos derivados castellanos, corrección determinista (1 / 0,5 / 0) e interfaz con filtros de Griego I. Preparada como **PWA independiente** para instalar y practicar sin conexión tras descargar los recursos, en `dist/apps/etymologicon/`. Su servicio offline no afecta a otras aplicaciones.
- **Vocabula Latina Græcaque**: léxico integrado desde un commit fijado. Se mantienen los ejercicios, el progreso local y el servicio Supabase; la morfología antigua no se incorpora, en espera de un módulo académico revisado.
- **GeneradorExamenes**: todavía no incluido en el resultado.
- **Zona docente**: usuario, contraseña y TOTP; función de inicio de sesión con correo exclusivamente en servidor y control Turnstile, además de bandeja de avisos con autorización de segundo factor. **No activada ni desplegada**: falta aprovisionar la identidad central, secretos y un **origen HTTPS aislado** para la zona privada (no compartir el origen de las aplicaciones públicas), además de verificar el extremo a extremo.
- Los repositorios originales siguen siendo las únicas fuentes editables de sus aplicaciones durante la migración.

## Conciliación académica de Evolutio en valenciano (fase inicial)

Se ha iniciado el banco bilingüe sin tocar ni publicar el corrector de Evolutio: **522 étimos identificados**, **26 correspondencias léxicas documentadas con etimología en el DCVB**, **215 propuestas explícitamente no verificadas** y **281 fichas sin propuesta**. **0 fichas valencianas habilitadas**: ninguna se activa hasta verificar las normas valencianas, su posición y la aprobación docente.

El repertorio incluye las **17 normas valencianas** aportadas por el docente y la pérdida fija de **-m**, sin aplicar automáticamente las normas castellanas. La matriz y sus evidencias están en `shared/academic/evolutio-valenciano/`, fuera de `public/` y `dist/`. Su integridad se comprueba contra el SHA fijado de Evolutio mediante `npm run evolutio:val:check` y las pruebas de CI. La modalidad castellana permanece intacta.

Metodología, fuentes, ejemplos contrastados y fases pendientes: [Conciliación académica de Evolutio en valenciano](docs/EVOLUTIO_CONCILIACION_VALENCIANO.md).

## Construcción reproducible

Se necesita Node.js 22 y tres fuentes descargadas en modo lectura, en los commits exactos de `config/sources.lock.json`:

```bash
git clone https://github.com/ArchaiosMagister/Appendix-grammaticae.git .sources/appendix
git -C .sources/appendix checkout a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c
git clone https://github.com/ArchaiosMagister/EvolucionFonetica.git .sources/evolutio
git -C .sources/evolutio checkout 0897aae01b6d4c905aafa1c1a6bac5af0810c812
git clone https://github.com/ArchaiosMagister/VocabulaLatinaGraecaque.git .sources/vocabula
git -C .sources/vocabula checkout 0e16505b7631298a0448c4160a5d258f82732bfe
npm run build
npm test
```

El workflow de GitHub Actions realiza automáticamente las comprobaciones originales, la construcción, los tests de copia y la navegación en Chromium (incluida la caché de Evolutio). `dist/` se guarda **solo como artefacto de pruebas** y no se activa GitHub Pages. El catálogo de Etymologicon se genera desde el inventario auditado; su versión de navegador solo contiene los campos necesarios para estudiar y corregir, no el Excel original ni las notas de revisión.

Para servirlo localmente: `python3 -m http.server 8000 -d dist`.

## Adaptación de Vocabula

El artefacto incorpora solamente recursos de **vocabulario**; copia de forma idéntica los scripts léxicos y los iconos, adapta el enlace interno de gramática a Appendix y permite abrir una asignatura desde el portal. El backend de Supabase continúa en el servicio original, sin modificaciones. Las pruebas de integración simulan el servicio y no alteran datos reales. Las páginas de ejercicios gramaticales y de morfología no se incluyen; sus bancos siguen en la fuente original, pendientes de un corrector nuevo y auditado. Véase `docs/VOCABULA_INTEGRACION_Y_MORFOLOGIA.md`.

## Sincronización

Las versiones originales están fijadas en `config/sources.lock.json`. No se copian archivos editables duplicados al repositorio: se importan durante la compilación; una actualización requiere aprobar una nueva versión auditada. La creación automática de propuestas de actualización aún está pendiente. El proceso no realiza escrituras en ningún repositorio externo.

Documentación: `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md`, `docs/DOCENTE_AUTENTICACION.md`, `docs/PLAN_INTEGRACION.md`.

## Instalación y modo offline de Etymologicon

La compilación añade `manifest.webmanifest`, iconos 192/512, icono maskable 512, icono Apple 180 y un `sw.js` generado con versión derivada del contenido. El trabajador offline **solo** controla `apps/etymologicon/` y no elimina cachés de otras herramientas.

La primera visita requiere HTTPS (o localhost en pruebas) y conexión para guardar todos los recursos y el banco auditado; después se puede abrir directamente Etymologicon sin red. La actualización del banco y del motor se aplica de manera conjunta después de pulsar «Aplicar nueva versión». En iOS/iPadOS se usa Safari > Compartir > Añadir a pantalla de inicio; en Android/ordenadores se puede utilizar la opción de instalación del navegador cuando esté disponible. La pantalla muestra instrucciones integradas.

**Todavía no se ha desplegado la web:** el artefacto de GitHub Actions sirve para pruebas técnicas, no constituye una URL HTTPS instalable para alumnado. Falta comprobar la experiencia de instalación en dispositivos físicos antes de publicarla. Detalles y pruebas: [`docs/ETIMOLOGICON_PWA.md`](docs/ETIMOLOGICON_PWA.md).

## Progreso local en Etymologicon

Etymologicon incorpora repaso general adaptativo, repaso de errores y selección por unidad, con estadísticas por étimo y unidad, conservación offline, exportación/importación JSON validada y borrado voluntario. No almacena respuestas escritas ni requiere cuentas. Griego II permanece reservado. Véase [`docs/ETIMOLOGICON_PROGRESO_Y_REPASO.md`](docs/ETIMOLOGICON_PROGRESO_Y_REPASO.md).

## Modalidades adicionales de Etymologicon

Se incorporan **tarjetas de memoria** (revelar significado y derivados, autoevaluación de recuerdo) y **relación de étimos y derivados** (rondas de hasta cuatro parejas unívocas del banco auditado), con estadísticas diferenciadas y repetición inteligente común. Ambos ejercicios funcionan sin conexión tras instalar la PWA. Véase [`docs/ETIMOLOGICON_TARJETAS_RELACIONES.md`](docs/ETIMOLOGICON_TARJETAS_RELACIONES.md). La escritura de dos derivados y su nota 1 / 0,5 / 0 se mantienen.

## Opción múltiple e identificación inversa

Etymologicon añade preguntas de cuatro opciones y reconocimiento de étimos griegos desde derivados castellanos, con transliteración y teclado virtual. Utiliza el banco cerrado, sin aceptar atribuciones ambiguas, y funciona offline. Detalles: docs/ETIMOLOGICON_RESPUESTA_MULTIPLE_INVERSOS.md.

## Descomposición etimológica en Griego I

Etymologicon incorpora un primer banco cerrado de **16 palabras castellanas con dos componentes griegos contrastados** mediante DLE. Las restantes 185 fichas siguen pendientes de auditoría individual para esta modalidad; no se consideran automáticamente incorrectas. Los ejercicios admiten griego o transliteración latina, muestran la explicación filológica, puntúan hasta 2 y funcionan offline. Ver [`docs/ETIMOLOGICON_DESCOMPOSICION_PILOTO.md`](docs/ETIMOLOGICON_DESCOMPOSICION_PILOTO.md).


## Construcción aislada de la zona docente (sin publicación)

El portal general se genera en `dist/`, con el acceso docente expresamente desactivado. La zona privada se construye **por separado** con `npm run build:docente`, que genera `dist-docente/` en modo bloqueado por defecto. La activación requiere un hostname HTTPS distinto del de las herramientas del alumnado, una cuenta Supabase Auth y configuración explícita. El proyecto Supabase actual de Vocabula es el candidato provisional para albergar esta cuenta, sin afectar a su sistema de sesiones propio. **No se ha creado ningún usuario ni desplegado el sitio o las funciones; el correo docente no se incorpora al artefacto público.** Véase `docs/DOCENTE_AUTENTICACION.md`.


## Alojamiento docente: Cloudflare Pages (sin activar)

Se ha elegido Cloudflare Pages para un **origen separado** del portal público. Su publicación será por **Direct Upload manual**, sin integración automática con GitHub. El artefacto `dist-docente/` incluye cabeceras `_headers` verificables, `robots.txt` y `404.html`, y **permanece desactivado por defecto**. Una versión activada necesita el SDK Supabase local con huella SHA-256 revisada; no se carga desde CDN. CI ejecuta `npm run audit:docente:cloudflare` y no sube el sitio a Cloudflare. Procedimiento y bloqueos: [`docs/CLOUDFLARE_PAGES_DOCENTE.md`](docs/CLOUDFLARE_PAGES_DOCENTE.md).


El procedimiento de aprovisionamiento sin publicación y los paneles de Cloudflare/Supabase están documentados en [`docs/ACTIVACION_GUIADA_DOCENTE.md`](docs/ACTIVACION_GUIADA_DOCENTE.md). El preflight estático de una construcción docente activa puede ejecutarse con `npm run check:docente:readiness`; por diseño falla si el acceso permanece desactivado o faltan dependencias verificadas. **No existe aún un proyecto Pages ni una cuenta docente real activada.**


## Itinerario por asignatura y curso

La portada incorpora un selector contextual de **Latín de 4.º de ESO, Latín I, Latín II, Griego I y Griego II**. Muestra solo enlaces a herramientas integradas y comprobadas: gramática por curso, vocabulario cuando existe, Evolutio para Latín I y Etymologicon para Griego I. No ofrece Etymologicon para Griego II, morfología pendiente ni el generador de exámenes. No se altera ningún archivo de las tres aplicaciones originales; únicamente se actualiza el portal.

El navegador guarda localmente solo el código del curso y el identificador de la última herramienta abierta desde el selector, para ofrecer «Continuar». No almacena vocabulario estudiado, respuestas ni datos del alumnado y funciona sin iniciar sesión. Las pruebas comprueban las rutas y el funcionamiento en Chromium antes de cualquier publicación.


## PWA unificada y actualización de Evolutio

La portada de ScholaClassica tiene su propio manifiesto, iconos compatibles con iPhone/Android y un botón de actualización. **Solo guarda en caché los recursos propios del portal**, sin copiar ni invalidar las cachés de sus herramientas. Evolutio y Etymologicon conservan sus respectivos service workers y sus controles de actualización; el alumno puede seguir entrando en cada módulo de forma independiente. La portada ya se encuentra publicada en GitHub Pages. Véase `docs/PORTAL_PWA.md`.

Evolutio se ha vuelto a integrar desde el commit auditado `901dacb125ee7894ea9d11faf7b0d0afa7e713b5`: 522 fichas, filtros de dificultad, tres intentos, revisión por norma, botón de actualización y grafía escolar de `u` consonántica. ScholaClassica recalcula **solo sus niveles de dificultad** con un criterio orientativo de **85 % previsibilidad del resultado castellano y 15 % carga de leyes**, preservando los registros marcados como `docente`. Los filtros existentes siguen funcionando y el módulo adicional está precargado para uso offline. Las 240 incorporaciones desde GeneradorExamenes no se presentan como certificación filológica individual. Ningún repositorio original ha sido modificado.


## Publicación de prueba de la PWA pública

Se ha autorizado la publicación **del portal de alumnado** mediante GitHub Pages. El flujo `.github/workflows/integracion.yml` ejecuta la construcción fijada por SHA, la auditoría de seguridad, las pruebas estáticas y las pruebas de navegador (incluida la subruta `/ScholaClassica/`), y **solo si pasan** publica `dist/` desde `main` mediante GitHub Actions. Las solicitudes de cambio (*pull requests*) no pueden desplegar.

El área docente sigue desactivada en el portal público (`docente/auth-config.json` contiene `enabled:false`). Cloudflare Pages, Supabase Auth y TOTP no se activan mediante este flujo. Tampoco se modifica ninguno de los repositorios originales ni se incluye GeneradorExamenes.

**Activación inicial de GitHub Pages:** si la configuración de GitHub Pages del repositorio todavía está desactivada, el propietario debe elegir `Settings → Pages → Build and deployment → Source → GitHub Actions`. Este ajuste requiere acceso administrativo y no se realiza por el token del propio workflow. A partir de entonces, el proceso de despliegue utiliza las credenciales temporales de GitHub Actions, sin secretos personales. El estado publicado solo se confirma cuando el trabajo `publicar` aparece como `success` y la URL pública responde correctamente.

URL prevista: `https://archaiosmagister.github.io/ScholaClassica/` (**no presuponer que está operativa antes de verificar el despliegue**).


## Apariencia y conexiones de la portada

La portada permite **Automático, Claro, Oscuro y OLED**. Se guarda únicamente la elección visual bajo `scholaclassica-aspecto-v1`, sin modificar el aspecto de las aplicaciones hijas. El modo automático sigue la configuración del dispositivo; OLED utiliza negro puro. La elección y el script `theme.js` funcionan sin conexión.

**Palabra del día** queda enlazada, no integrada físicamente: los accesos a 1.º de Bachillerato y 4.º de ESO abren sus páginas originales en pestaña nueva. El itinerario ofrece las direcciones correspondientes a Latín 4.º ESO, Latín I y Griego I, sin compartir códigos, votos, sesiones o PWA.

Un workflow independiente (`.github/workflows/avisos-fuentes.yml`) compara semanalmente los commits de Appendix, Evolutio y Vocabula integrados con sus ramas `main`. Si existen cambios, crea o actualiza **un único aviso** en las incidencias de ScholaClassica, sin copiar versiones nuevas ni publicar. Cuando los SHAs vuelven a coincidir, cierra el aviso automatizado. GeneradorExamenes y Palabra del día no se sincronizan por este mecanismo.

## Práctica de morfología por cursos y unidades

ScholaClassica incorpora un **módulo independiente** en `/apps/morfologia/`, construido a partir de tablas de la revisión **fijada** de Appendix grammaticae. La cobertura comprende **Latín I, UD1–UD5**, y **Griego I, UD1–UD5**; se ofrecen elección de formas y análisis morfológico con múltiples análisis admitidos cuando existe sincretismo. El banco se genera con procedencia curricular comprobable, no mediante generación libre de formas.

Las preguntas son formativas, sin cuentas ni almacenamiento de resultados. La PWA de morfología dispone de su propia caché `schola-morphology-`, que nunca borra las cachés de otras aplicaciones. Véase [Morfología curricular](docs/MORFOLOGIA_CURRICULAR.md). Las voces, tiempos y unidades aún no incluidos **no** se presentan como verificados. No se modifica Vocabula ni GeneradorExamenes.


### Ampliación de morfología: UD3–UD4 de Latín I y primera declinación griega

La pasiva latina de UD3 incorpora el presente e imperfecto de las cinco conjugaciones (con la variante `-re` documentada en las desinencias). La tercera declinación de UD4 importa los paradigmas completos `dux`, `civis`, `flumen` y `mare` del capítulo de sustantivos del **mismo Appendix fijado por SHA**, respetando `-um/-ium`, neutros en `-ia` y las dos variantes de `civis` en acusativo plural. Griego I, UD3, incorpora los cinco modelos de **desinencias** de primera declinación (femeninos alfa, eta y mixto; masculinos alfa y eta) sin reconstruir palabras completas ni mezclar variantes. Las fichas tienen evidencia de capítulo, tabla y unidad; el motor no trata formas alternativas válidas como distractores. Nuevas pruebas revisan los datos y el funcionamiento offline.


### Tercera ampliación: sistema de perfecto y adjetivos

La práctica morfológica incorpora **Latín I, UD4:** los perfectos y pluscuamperfectos **activos** de las cinco conjugaciones, con sus enunciados completos (`amo, amavi, amatum`; `habeo, habui, habitum`; `duco, duxi, ductum`; `audio, audivi, auditum`; `capio, cepi, captum`) y `sum, fui –`. Las formas proceden de las tablas `Perfecto/Pluscuamperfecto de indicativo · voz activa` y `sum · 3/4` del capítulo `indicativo.html` del Appendix fijado.

**Latín I, UD5:** los adjetivos de la tercera declinación `brevis, -e`, `acer, acris, acre`, `audax, audacis` y `vetus, veteris`, con todas sus celdas documentadas de caso, género y número. Las sincretías conservan todos sus análisis.

**Griego I, UD5:** adjetivos 2–1–2 (`ἀγαθός`), 2–2 (`βάρβαρος`) y los irregulares `πολύς` y `μέγας`. El motor restaura las celdas fusionadas `rowspan` de las tablas originales sin inferir formas, y presenta **concordancia de artículo y adjetivo** desde UD5, rechazando como distractores las alternativas que también concuerdan. Griego I UD4 es acumulativa, sin nuevas fichas.

El banco tiene ahora **60 paradigmas**, con versión del Appendix y evidencias por tema/capítulo/tabla. Continúan excluidos los perfectos pasivos, las formas no documentadas y las unidades posteriores.


### Práctica activa de morfología (escritura y repaso)

El módulo conserva los **60 paradigmas curriculares**, pero incorpora tres nuevas modalidades: **respuesta escrita sin opciones**, **declinación completa en tabla** y **repaso inteligente**. El corrector admite las variantes ya documentadas (por ejemplo, `cives` y `civis`), acepta `æ/ae` y el guion opcional de las desinencias, y distingue en griego los errores ortográficos (acentos, espíritus, sigma final) de los morfológicos. Los errores ortográficos no se cuentan como aciertos: la solución aparece explicada.

Las respuestas griegas cuentan con teclado táctil de letras, espíritus, acentos, circunflejo e iota suscrita, compatible con el teclado normal del dispositivo. Las tablas únicamente utilizan las fichas que ya existen: sustantivos, adjetivos, artículo y desinencias, sin generar formas nuevas. Los casos sincréticos se aceptan en todas sus variantes documentadas.

El progreso de repaso se guarda **solo en el navegador** mediante `schola-morphology-review-v1`, sin cuenta, analítica, red ni datos identificativos. Existen filtros para ejercicios no practicados, errores anteriores, repeticiones pendientes o selección inteligente con intervalos crecientes de uno, tres, siete y más días. Se puede borrar el historial mediante un botón con confirmación. Los ficheros necesarios están en la caché exclusiva `schola-morphology-` y funcionan sin conexión tras la primera carga. Los repositorios originales, las PWA de otros módulos y la zona docente permanecen intactos.


### UD6–UD7 y sintagmas contrastados

La práctica de morfología conserva el SHA fijado de Appendix y amplía la cobertura a **Latín I y Griego I hasta UD7**, con **84 paradigmas documentados**. Latín I incorpora demostrativos y relativo (UD6); cuarta y quinta declinación y futuro activo/pasivo, más `sum` (UD7). Griego I incorpora presente medio-pasivo de `λύω` y su doble segunda singular (UD6), y demostrativos, anafórico y pronombres personales con variantes tónicas y átonas (UD7).

Dos modalidades nuevas permiten **escribir un sintagma** o **declinarlo completo**. En latín se usa *adjetivo + sustantivo* de género acreditado, con cada forma tomada de su tabla completa; no se incorporan `dux` ni `civis` a combinaciones que requerirían determinar su género. En griego se practica *artículo + adjetivo sustantivado*, sin añadir falsamente un sustantivo griego no documentado. Cada ejercicio enlaza las unidades originales de ambos paradigmas. Las tablas respetan los casos disponibles: no se crea vocativo de artículo ni de los pronombres. Los nuevos archivos se precargan solo en la caché offline de morfología y no tocan las PWA originales.


### Sustantivos griegos individuales y sintagmas completos

Se ha conciliado un **lote cerrado de ocho sustantivos de Griego I** (`ἵππος`, `βίος`, `δίκη`, `ἀρετή`, `λόγος`, `δῶρον`, `νίκη`, `εἰρήνη`) con tres testimonios complementarios: lema y bloque de unidad del Vocabula fijado, diez casillas morfológicas del subconjunto UniMorph y género documentado por el artículo en un ejemplo de nominativo singular, más el tipo de declinación enseñado en Appendix. Se desbloquean cuatro nombres en UD4 y cuatro en UD7; el banco contiene **92 paradigmas** en total. No se arrastra al sorteo el resto del corpus ni se dan como revisados individualmente los lemas candidatos.

Desde **Griego I UD5** se habilitan «Escribir artículo + sustantivo + adjetivo» y «Declinar artículo + sustantivo + adjetivo». Las formas se construyen solo cruzando casillas de tres paradigmas documentados con igual género, caso y número, y aceptan las **dos posiciones atributivas correctas**, por ejemplo `ὁ ἀγαθὸς ἵππος` y `ὁ ἵππος ὁ ἀγαθός`. No se admite como atributiva la secuencia `ὁ ἵππος ἀγαθός` sin artículo repetido. El sistema respeta la conversión contextual de agudo en grave, y distingue los errores ortográficos al escribir.

Los datos de UniMorph conservan su atribución y licencia **CC BY-SA 3.0**, con [aviso de licencia propio](public/morfologia/data/LICENSE-SUSTANTIVOS-GRIEGOS.md). El contraste es verificable automáticamente, pero **no equivale a una revisión docente individual**: la procedencia y esa limitación permanecen registradas en cada ficha. Los repositorios de origen se consultan solo en lectura. Las nuevas modalidades funcionan sin conexión después de instalar la actualización.
