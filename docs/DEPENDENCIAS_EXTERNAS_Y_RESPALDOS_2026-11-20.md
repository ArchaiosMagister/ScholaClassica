# Dependencias remotas y respaldos no cubiertos por Git · 20-11-2026

**Alcance:** inventario sin escrituras, construido a partir del código de ScholaClassica y una consulta de **metadatos**, sin leer registros de alumnos ni exportar bases de datos. Esta documentación no autoriza archivar ni borrar repositorios.

## Conclusión operativa

La independencia de los repositorios académicos para **compilar** ScholaClassica no equivale a independencia de sus **servicios remotos**. Dos proyectos Supabase independientes siguen activos y deben conservarse con sus configuraciones:

| Servicio | Dependencia real | Aplicaciones afectadas | Precaución |
| --- | --- | --- | --- |
| Vocabulario y docencia | Endpoint público `vocabulary`; funciones docentes `schola-login`, `schola-vocab-admin` y `schola-inbox` | Vocabula antiguo, Vocabulario de ScholaClassica y área del profesor | Las fichas locales pueden ejecutarse sin conexión, pero las altas, modificaciones e información nueva dependen de la nube |
| Palabra del día | Proyecto de base de datos independiente y `schola-palabra-inbox` | Palabra del día y la bandeja docente integrada de ScholaClassica | No trasladar ni eliminar este proyecto al retirar repositorios de gramática, léxico o fonética |

**Consulta remota de metadatos, 20-11-2026:** ambos proyectos figuraban como activos y saludables. Las funciones anteriores figuraban activas. Se ha confirmado que sus tablas públicas tienen activada la seguridad por filas (RLS). La consulta no demuestra que las configuraciones de seguridad sean todas correctas ni que exista un respaldo fuera de Supabase. Las recomendaciones de seguridad del proveedor deben revisarse en privado, sin publicar advertencias detalladas que faciliten ataques.

La separación de datos y funciones debe mantenerse. **GeneradorExamenes** y **Palabra del día** conservan sus aplicaciones y repositorios. La integración de GeneradorExamenes es únicamente funcional en una fase futura, sin fusión.

## Qué cubre la copia Git y qué no

El procedimiento `scripts/backup-originals.mjs`, cuando se ejecute voluntariamente en un Mac, obtiene ramas, etiquetas e historial Git de **Appendix**, **Evolutio** y **Vocabula** y comprueba su restauración. Esto **NO** incluye las bases PostgreSQL remotas, datos de Auth, códigos y credenciales, Edge Functions desplegadas, objetos de Storage, políticas RLS, configuración del panel ni secretos de Supabase. No se deben guardar respaldos de estas bases en una rama pública, ni adjuntarlos a una PR o a un mensaje de chat.

Para una eventual restauración completa de cada proyecto Supabase, habrá que identificar y conservar en soporte privado:

- **Base de datos:** respaldo lógico de esquema, roles y datos que pueda restaurarse en un entorno separado. Comprobar las opciones de Database → Backups en cada proyecto; su disponibilidad depende del plan. Si hace falta descargar un respaldo lógico, seguir la documentación oficial de `supabase db dump` o `pg_dump` sin introducir contraseñas en argumentos públicos, logs de CI ni archivos versionados.
- **Edge Functions:** fuente verificable de cada función desplegada, versión, configuración de verificación JWT y dependencias. El backup SQL por sí solo no reconstruye estas funciones.
- **Autenticación y permisos:** configuración de proveedores de Auth, políticas RLS, funciones SQL con privilegios, roles y autorizaciones. Guardar secretos únicamente en un gestor seguro; no introducir claves privadas en ScholaClassica.
- **Storage:** identificar si hay buckets/objetos que deban conservarse; un respaldo de PostgreSQL contiene metadatos de Storage, no el contenido de sus objetos.
- **Restauración:** ensayar con una base de datos **nueva y aislada**, no sobre el proyecto en producción, y documentar la fecha del respaldo, su integridad y su ubicación fuera del repositorio.

Referencias oficiales: [Supabase · Database Backups](https://supabase.com/docs/guides/platform/backups), [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) y [Deleting Your Project · Protective Measures](https://supabase.com/docs/guides/platform/delete-project).

## Comprobación automática añadida

`npm run audit:servicios:externos` comprueba la existencia y correspondencia de los enlaces a servicios remotos en **código local**, sin iniciar sesión en Supabase. Identifica los dos servicios distintos y los nombres de sus cinco funciones de integración; se detiene si desaparece el endpoint de vocabulario o una de las funciones de acceso/bandeja del profesor, si se fusionan accidentalmente los dos proyectos o si GeneradorExamenes deja de declararse independiente.

El informe se genera exclusivamente en `build/academic-audits/retirada/servicios-externos.json` y **no** contiene claves, direcciones completas de proyectos, nombres de alumnos ni filas de tablas. Todos los indicadores de respaldo externo siguen a `false` hasta que se realicen y acrediten respaldos privados. Su ejecución está integrada en las pruebas obligatorias de CI, sin permisos de escritura sobre ninguna base de datos.

## Decisiones todavía bloqueadas

**No está acreditado** que existan copias locales restaurables de los dos proyectos Supabase ni de los repositorios originales, ni que los accesos y traspasos estén verificados en un iPad real. Mantener activos los sitios antiguos y los dos proyectos de base de datos hasta que se completen esas verificaciones. El archivo reversible de cada repositorio de origen requiere **autorización docente específica**, independiente para cada uno; el borrado requiere otra autorización posterior.

Revisar por separado los avisos de seguridad que proporcione el panel Supabase; no alterar todavía Auth, RLS o funciones SQL con privilegios, pues pueden afectar al funcionamiento de las aplicaciones existentes.
