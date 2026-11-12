# Seguridad docente — decisión pendiente de implementación

La futura sección del profesor debe requerir autenticación **y autorización en servidor**. Ocultar enlaces o limitar páginas con JavaScript en GitHub Pages no protege archivos estáticos. ScholaClassica no publica en su primera fase una copia del generador ni fichas docentes nuevas.

Modelo candidato: identidad gestionada por Supabase Auth, permisos establecidos mediante claims de aplicación o registros protegidos con RLS, operaciones sensibles atendidas por API/Edge Functions y controles de autorización en cada operación. La elección definitiva requiere decidir qué hacer con la URL pública original del generador; conservarla significa que esa versión seguirá siendo accesible independientemente del acceso protegido a ScholaClassica.

No reutilizar los códigos de alumno de Palabra del día; dicha aplicación está excluida. No incluir claves de service role en HTML/JS público. La autenticación no puede depender de secretos en el navegador. Ningún sistema de login se declara implementado.
