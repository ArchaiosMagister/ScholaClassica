# Área de profesor — ScholaClassica

## Estado
El panel público está en `/ScholaClassica/docente/`, pero **sus datos y acciones no son públicos**.
El acceso utiliza Supabase Auth (usuario `MagisterArchaios`) y TOTP, con sesión
exclusivamente en memoria; no se almacena en la PWA del alumnado.

### Apartados
- **Bandeja central** de avisos: Vocabula y propuestas de Palabra del día. Son
  dos fuentes Supabase independientes, con permisos comprobados en sus servidores.
- **Administración de Vocabula**: buscar/listar palabras por asignatura y significado,
  añadir y editar formas, respuestas y unidades, activar/desactivar aportaciones,
  incluirlas en vocabulario de examen y revisar incidencias con notas privadas.
  También permite preparar una palabra nueva a partir de un aviso de palabra ausente.
  Todas estas acciones se validan de nuevo en `schola-vocab-admin`: JWT vigente,
  UUID docente autorizada y `aal2` comprobado con el servidor de Supabase Auth.
- **Palabra del día** mantiene la gestión dentro de su aplicación independiente;
  su integración aquí es de **solo lectura**, sin trasladar datos de alumnos.

### Transición de la administración de Vocabula
La **copia integrada para el alumnado** ya no muestra el diálogo de profesor ni
carga acciones administrativas; conserva íntegros los formularios para avisar de
errores, la sincronización desde Supabase y los ejercicios. Las fuentes están
fijadas por SHA y el montaje se verifica en Chromium.

El repositorio y la página independiente originales de Vocabula conservan
provisionalmente su interfaz docente anterior como **vía de reversión**. No retirarla
hasta verificar en el navegador del profesor un ciclo real de edición y revisión
con TOTP. Tras esa comprobación puede retirarse el panel heredado sin cambiar el
servicio público de vocabulario ni invalidar la recepción de avisos. No se
modifica la administración propia de Palabra del día.

### Pruebas antes de publicar
1. Compilación y auditoría del artefacto, sin credenciales privadas.
2. Pruebas unitarias de entradas, filtros y estado de incidencias.
3. Pruebas de Chromium para escribir una palabra simulada, revisiones,
   navegación, temas, PWA, aviso estudiantil y rechazo de acceso.
4. Denegación remota de `words.list`, `words.save`,
   `reports.list` y `reports.review` sin un JWT docente real.
5. Prueba personal pendiente de autorización AAL2 contra producción
   con una aportación real; ninguna prueba automática crea datos docentes
   o de alumnado en la base de datos.

## Pendientes académicos — fase posterior
No forman parte de este bloque: ampliar unidades y modelos de la práctica
morfológica y crear contenidos y unidades propios de Latín de 4.º ESO en la
biblioteca de gramática. Deben seguir el mismo sistema de evidencia individual
y pruebas curriculares antes de su publicación.
