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
