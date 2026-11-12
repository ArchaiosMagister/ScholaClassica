# Arquitectura inicial

## Principio

Integración por módulos independientes, sin bifurcar el desarrollo ni modificar los repositorios originales. En fase 1 se integra únicamente Appendix grammaticæ.

```
ScholaClassica/
  public/              portada modular
  config/              referencias exactas a commits auditados
  scripts/build.mjs    ensamblaje local sin tocar la fuente
  tests/               pruebas de rutas, identidad de bytes y navegador
  dist/                salida de prueba, nunca versionada ni publicada
    apps/gramatica/    copia intacta de Appendix, incluidas las rutas val/
```

La compilación no agrega scripts ni estilos dentro de Appendix: sus contenidos se copian sin cambios, con las mismas rutas relativas, para evitar regresiones en la enseñanza.

## Sincronización futura

Los repositorios originales continúan siendo la única fuente editable en esta etapa. `config/sources.lock.json` fija un SHA por repositorio y un indicador de integración. En una etapa posterior, un workflow dedicado podrá crear propuestas de actualización cuando un origen avance; nunca debe actualizar directamente el sitio de alumnado sin validación. Cada propuesta tendrá pruebas de regresión y recibirá aprobación antes del despliegue.

## Pendientes

- Evolutio: su service worker borra cachés ajenas del mismo origen. Corregir exclusivamente en una copia superpuesta de integración, conservando el original sin cambios.
- Vocabula: respetar backend Supabase y la dependencia de un índice UniMorph alojado en GeneradorExamenes; copiar al build un índice versionado.
- GeneradorExamenes: no exponer su interfaz desde ScholaClassica antes de resolver autenticación de servidor y autorización. Se conserva su versión autónoma y exportación Word.
- Definir una política clara de subrutas y caché única a nivel ScholaClassica.
- Añadir traducción de la interfaz principal al valenciano cuando esté fijado el vocabulario de UI, sin alterar las dos versiones de Appendix.
