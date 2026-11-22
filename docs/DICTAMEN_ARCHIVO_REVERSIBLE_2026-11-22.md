# Dictamen de archivo reversible de repositorios académicos · 22/11/2026

**Alcance:** análisis de autonomía funcional y condiciones para una eventual decisión de **archivar, no borrar**, los tres repositorios originales. **No se ha archivado ni borrado ninguno.** No se han alterado contenidos, datos, identificadores ni progreso.

## Decisión de alcance vigente

- La conservación del progreso local de las **webapps antiguas** ya **no es un requisito de retirada**. Los exportadores/importadores existentes no se eliminan porque pueden seguir siendo útiles a otras personas, pero no se exige probar su migración.
- **No se exige al titular hacer backups físicos en Mac, ejecutar Terminal ni disponer de disco externo para continuar evaluando el archivo reversible.** Las herramientas de respaldo siguen disponibles como medida *opcional*. Archivar en GitHub mantiene el repositorio, su código y su historial en modo de solo lectura y permite desarchivarlo; **borrar** queda expresamente fuera de esta decisión.
- **Supabase es otro asunto:** las bases de datos, Auth y Edge Functions siguen activos independientemente del estado de los repositorios de frontend. Mantener estrategias de recuperación de esos servicios es una responsabilidad operativa distinta del archivo Git; **la auditoría no ha acreditado copias remotas restaurables**.
- No desinstalar PWA antiguas de terceros ni invalidar URL históricas. Ningún cambio de rutas/redirecciones se autoriza aquí.
- **Archivo de cada repositorio:** requiere autorización expresa, **uno por uno**. Eliminar cualquier repositorio requiere una autorización posterior y distinta.

## Evidencias comprobadas

1. **Autonomía del build:** `npm run audit:repositorios:retirada` y el flujo `integracion.yml` confirman **cero checkouts** de Appendix, Evolutio o Vocabula. Se usan árboles académicos fijados en `vendor/appendix`, `vendor/evolutio` y `vendor/vocabula`. El checkout de UniMorph Latin es una fuente de auditoría externa y **no** un checkout de esos repositorios.
2. **Validación y publicación:** el último run de `main`, [44912989978](https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/44912989978) (21/11/2026), terminó con validación y despliegue Pages satisfactorios. La batería incluye navegación, contenido castellano, Etymologicon, Morfología, vocabulario, repaso, cachés offline y emulación WebKit/iPad. Esto **no es** una prueba en un dispositivo iPad real.
3. **Rutas históricas:** la matriz `config/retirada-rutas-publicas.json` incluye **18 pares** original/integrado, **10 destinos nativos** y **12 controles** de avisos, cache y recursos (**40 comprobaciones**). El monitor de rutas en Actions se ejecutó con éxito el 21/11/2026. Su éxito HTTP no demuestra identidad del contenido ni la supervivencia de Pages *después* de archivar.
4. **Sincronización académica:** el monitor `vigilar-fuentes-originales.yml` ha reconocido las diferencias posteriores a los snapshots (Appendix **4 commits**, Evolutio **6**, Vocabula **12**) como cambios conocidos de transición. No hay sincronización automática de estos commits, IDs ni bancos.
5. **Servicios independientes:** comprobados mediante metadatos en Supabase el 22/11/2026, los proyectos `Vocabulario_clasico` y `Palabra_del_dia` estaban `ACTIVE_HEALTHY`. Funciones activas de vocabulario/área docente: `vocabulary`, `schola-login`, `schola-vocab-admin`, `schola-inbox`; el proyecto separado de Palabra del día mantiene `schola-palabra-inbox` y sus funciones originales de acceso. No se ha leído ningún dato privado ni probado restauración de sus bases.
6. **GitHub:** los tres repositorios históricos seguían **públicos y no archivados** el 22/11/2026. GitHub describe el archivo como reversible y de solo lectura ([documentación](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories)). Hay experiencias de que Pages continúa servido tras archivar, pero **no se debe dar por garantizado para estos sitios antes de una prueba real posterior**. No equiparar archivar con despublicar o borrar.

## Candidaturas por repositorio

| Repositorio | Qué está integrado | Dependencias / riesgos a vigilar | Prioridad recomendada |
| --- | --- | --- | --- |
| [Appendix-grammaticae](https://github.com/ArchaiosMagister/Appendix-grammaticae) | Referencia gramatical castellano/valenciano, Latín I/II y Griego; Latín 4.º añadido solo en ScholaClassica | Páginas de consulta antiguas, enlaces profundos de materiales de clase y Pages publicado mediante workflow del **original**. El archivo congela su mantenimiento; no implica que sea seguro romper la URL | **1. Primer candidato** a archivo reversible |
| [EvolucionFonetica](https://github.com/ArchaiosMagister/EvolucionFonetica) | Motor funcional de evolución castellana, práctica, dificultad y PWA independiente | Caché e instalación PWA antiguas, URL pública, y versión valenciana **aplazada**, que **no debe tratarse como funcional o publicada** en ScholaClassica | **2. Candidato** después de verificar el motor castellano y la PWA integrada |
| [VocabulaLatinaGraecaque](https://github.com/ArchaiosMagister/VocabulaLatinaGraecaque) | Léxico en su módulo propio (General/Examen/Todo), y repaso de sintaxis/conceptos en **otro módulo**, separado de Morfología | Endpoint externo `vocabulary` en Supabase, funciones del profesor, posible material publicado con enlaces antiguos y diferencia de 12 commits de transición. La congelación del repo no debe interrumpir el servicio remoto | **3. Último candidato**, tras comprobar la continuidad de la consulta pública y del área docente |

**No se consideran candidatos**: `GeneradorExamenes` (PWA y repositorio independientes), `Palabra-del-dia` (aplicación y Supabase independientes) ni los módulos nativos de ScholaClassica.

## Última verificación mínima antes de cada archivo

El objetivo es no exigir operaciones en Terminal ni transferencias de datos:

1. **Appendix:** abrir Latín I, Latín II sintaxis y Griego I en la gramática integrada, y comprobar el acceso offline de una unidad precargada desde un iPad real **si se dispone de él**.
2. **Evolutio:** completar una palabra y comprobar la corrección de normas en castellano. Probar offline desde la PWA integrada, preferentemente en el dispositivo habitual.
3. **Vocabula:** generar práctica con unidad marcada en General y Examen, y una pregunta del **módulo separado de repaso**. Revisar que la consulta pública de vocabulario y el área docente continúan conectadas a Supabase.

Estas comprobaciones físicas son **recomendables**, especialmente para PWA y Safari; no se sustituyen por la emulación WebKit. No se exige conservar o traspasar historial local antiguo.

**Si en el futuro se autoriza el archivo de un repositorio:** archivar **solo ese** original; después comprobar su antigua URL de Pages, los enlaces profundos, la nueva ruta integrada y los servicios asociados. Si aparece una incidencia, **desarchivarlo** e investigar antes de proponer otro archivo. Mantener la vigilancia de URLs desde ScholaClassica. **No borrar ni despublicar ninguno.**

## Límite del dictamen

El estado **`safeToArchive:false`** de los informes automáticos sigue siendo correcto: todavía no existe autorización individual y no hay prueba posterior a un archivo real. **No** significa que sea obligatorio hacer respaldos locales o migrar progresos antiguos. El presente dictamen identifica **candidatos y condiciones**, no afirma que se haya retirado nada ni que haya sido verificado un iPad físico.
