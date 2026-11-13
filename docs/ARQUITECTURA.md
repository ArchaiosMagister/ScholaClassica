# Arquitectura de integración de ScholaClassica

## Estado actual: tres orígenes integrados y Etymologicon nativo

La plataforma se construye desde repositorios originales mediante checkout **solo de lectura** de commits fijados en `config/sources.lock.json`. No hay una segunda copia editable del código. Ningún archivo fuente de Appendix ni de Evolutio se ha modificado.

```text
ScholaClassica/
  public/                       portada y navegación comunes
  config/sources.lock.json      SHA exactos de los orígenes
  scripts/build.mjs             ensamblaje reproducible
  tests/                        pruebas estáticas y de Chromium
  .sources/vocabula/           checkout efímero, solo lectura, commit fijado
  dist/                         artefacto temporal, no publicado
    apps/gramatica/             Appendix íntegro, incluidos ES y VAL
    apps/evolucion-fonetica/    Evolutio íntegro salvo sw.js adaptado
    apps/vocabulario/          Vocabula: solo léxico, con enlace y selector adaptados
```

## Adaptaciones permitidas

- **Appendix:** copia idéntica a su fuente, con todas las rutas relativas y los contenidos de castellano y valenciano preservados.
- **Evolutio:** motor, banco, páginas, temas e iconos idénticos a su fuente. Solo se modifica `dist/apps/evolucion-fonetica/sw.js` **después de copiarlo**, para que la eliminación de versiones antiguas afecte únicamente a cachés con prefijo `schola-evolutio-`. El service worker del repositorio original no se toca.
- **Vocabula:** se copia exclusivamente una lista de recursos léxicos e iconos. No se copian los ejercicios `gramatica.*` y `morfologia.*`, los bancos morfológicos, los tests, el backend ni los scripts originales. Solo se adapta en la copia el enlace de gramática y el acceso por asignatura. El endpoint público de Supabase se mantiene; los permisos docentes siguen comprobándose en el servidor original.
- **Portal:** agrega enlaces por lengua, curso y herramienta, pero no interfiere con la aplicación que se abre.

Las pruebas comprueban la igualdad byte a byte de todos los archivos (excepto la adaptación documentada del service worker), el funcionamiento sin conexión de Evolutio y la conservación de una caché ajena. Estas comprobaciones se hacen en Chromium, no sustituyen las pruebas posteriores en iPhone/iPad.

## Sincronización

Los repositorios originales son las fuentes editables durante esta fase. Cada importación depende del SHA exacto registrado; si no coincide, la construcción falla. La automatización que proponga nuevas revisiones cuando cambie un origen aún está pendiente. **No** existe una sincronización automática de `main` en tiempo real y no debe afirmarse lo contrario.

## Seguridad y publicación

La salida de CI se conserva como artefacto de pruebas. No hay workflow de GitHub Pages para ScholaClassica. El generador docente se mantiene fuera de `dist/` hasta disponer de autenticación y autorización reales; ocultar una página en un sitio estático no proporcionaría seguridad.

## Próximos pasos

1. Reconstruir la práctica morfológica como módulo propio de ScholaClassica, reutilizando únicamente datos académicos aprobados.
2. Definir el alojamiento y la autorización del generador de exámenes.
3. Diseñar una PWA de portal y unificar gradualmente la identidad visual cuando todos los módulos estén estables.
4. Implementar propuestas de actualización automáticas con pruebas y revisión.


## Identidad docente y aislamiento del alojamiento

La zona docente se compila **independientemente** con `npm run build:docente`, dando `dist-docente/`. En ausencia de credenciales públicas, se genera con `enabled:false`. El portal general `npm run build` **rechaza variables de identidad docente** y fuerza `dist/docente/auth-config.json` a desactivado. Ninguno de los dos artefactos se despliega desde GitHub Actions.

La cuenta docente ha de residir en Supabase Auth, con acceso restringido a una UUID designada y una sesión `aal2` (TOTP). La función de avisos consulta únicamente registros pendientes y no modifica los sistemas originales. Se requiere un origen HTTPS diferente del de las apps públicas. Véase `docs/DOCENTE_AUTENTICACION.md`.


## Navegación contextual sin alterar fuentes

Se ha añadido a la portada de ScholaClassica un itinerario por materia y curso (public/index.html, public/app.js, public/style.css) que reutiliza únicamente rutas verificadas del artefacto. La selección y el último módulo abierto se guardan como identificadores limitados en localStorage bajo la clave scholaclassica-itinerario-v1; no se almacenan respuestas ni identificadores de alumnos. Si el navegador bloquea el almacenamiento, el selector funciona sin persistencia.

**No hay inyección de scripts o encabezados en Appendix, Evolutio o Vocabula**: siguen siendo copias comprobadas byte por byte, con las excepciones técnicas ya documentadas. Tampoco se alteran los service workers, lo que conserva los modos offline existentes. La navegación contextual no supone un cambio curricular ni habilita contenidos de Griego II que todavía no están preparados.


## PWA de portada, sin interferencia entre aplicaciones

`npm run build` genera el manifiesto `dist/manifest.webmanifest`, los iconos de ScholaClassica para iOS/Android y un service worker `dist/sw.js` cuya versión procede de la huella de los recursos propios de la portada. El worker **solo intercepta URLs exactas del núcleo del portal** y borra únicamente caches con prefijo `schola-portal-`; no intercepta datos ni navegación de `apps/*`. Las aplicaciones con SW propios utilizan los suyos con alcance más específico.

Evolutio se ha actualizado de la revisión `0897aae01b6d4c905aafa1c1a6bac5af0810c812` a `901dacb125ee7894ea9d11faf7b0d0afa7e713b5` y mantiene todos sus archivos byte por byte salvo el ajuste específico de `sw.js` en `dist/`: prefijo `schola-evolutio-`, borrado únicamente de sus propias versiones y respuesta a `fetch` solo para rutas dentro de su ámbito. El worker del original no cambia. El nuevo banco contiene 522 fichas; hay 240 registros importados clasificados como propuestas técnicas, que no equivalen a una revisión filológica individual.

Véase `docs/PORTAL_PWA.md`.


## Integraciones adicionales que no alteran las fuentes

- La portada admite tres paletas resueltas (claro, oscuro y OLED) y un ajuste Automático. El único estado local adicional es la preferencia visual de la portada; no se guarda información académica ni de estudiantes.
- Palabra del día se incorpora **como enlace externo de navegación**, con las dos rutas oficiales diferenciadas. Se conserva la autenticación y votación actuales; no se copian bases de datos ni se instalan workers fuera de su origen.
- El workflow `avisos-fuentes.yml` coteja semanalmente los SHAs bloqueados de los **tres** repositorios académicos integrados. Puede abrir o actualizar una incidencia en ScholaClassica cuando hay diferencias, pero **nunca** actualiza automáticamente `config/sources.lock.json` ni toca originales. Los cambios requieren revisión docente y pruebas antes de importarse.


## Ampliación autónoma de la práctica morfológica, sin alterar fuentes

`scripts/morphology-expansion.mjs` transcribe 12 paradigmas verbales latinos de perfecto/pluscuamperfecto UD4, 4 adjetivos latinos de tercera declinación UD5 y 4 paradigmas griegos de adjetivos UD5, todos con referencias a tablas exactas de Appendix. La colección completa pasa de 40 a **60** registros y permite seleccionar Latín I y Griego I hasta UD5. El motor de concordancia griega combina **dos fichas verificadas**: la del artículo (UD3) y la del adjetivo (UD5), únicamente con igualdad de caso/género/número, sin generar lemas o formas nuevos. La actividad se habilita solo desde Griego I UD5. Se mantienen el aislamiento de los service workers, el modo offline y el cierre de la zona docente.


## Práctica productiva de morfología y progreso local

El módulo independiente de morfología utiliza `written.mjs` para corrección exacta/ortográfica/morfológica y para tablas de declinación generadas solo con casillas ya documentadas. `greek-keyboard.mjs` implementa inserción táctil de Unicode griego y marcas combinantes; `review.mjs` gestiona repetición espaciada local, sin envío de datos. El núcleo `engine.mjs` conserva su contrato de ejercicios existentes y solo añade la selección opcional de repaso.

La caché `schola-morphology-` incorpora los tres nuevos módulos versionados y sigue limitada al ámbito `/apps/morfologia/`, sin invalidar el resto de PWA. Se mantienen la restricción a las unidades académicas existentes y los 60 paradigmas del Appendix fijado. El workflow comprueba también la interfaz móvil y el funcionamiento offline antes de cualquier despliegue.


## Integración morfológica UD6–UD7 con doble procedencia

`scripts/morphology-ud6-ud7.mjs` importa 24 registros adicionales de pronombres, futuro y declinaciones desde el currículo **fijado** del Appendix. `public/morfologia/sintagmas.mjs` combina dos paradigmas completos con concordancia de caso, número y género, admite las variantes literales de sus casillas y expone `sources` con ambas referencias. La aplicación permite escribir o declinar los sintagmas completos; en griego, por falta de sustantivos individuales documentados, limita el ejercicio al artículo y adjetivo sustantivado. El modo sigue siendo local, con caché `schola-morphology-` y sin intervención de originales ni credenciales docentes.
