# Auditoría funcional transversal — ScholaClassica y Palabra del día

**Fecha:** 16 de noviembre de 2026. **Modalidad:** comprobaciones del
código desplegable, GitHub Actions, bloqueos de seguridad y pruebas en
Chromium; sin operaciones sobre votos, alumnos, vocabulario o progreso.

## Estado de partida: despliegues

- ScholaClassica, commit
  `dd22de0fdd7e2574ee6090f119e0ac6ac07ff9a4`:
  [validación y Pages correctas](https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43932542872).
  [LEMLAT3](https://github.com/ArchaiosMagister/ScholaClassica/actions/runs/43932542995):
  auditoría correcta.
- Palabra del día, commit
  `e413835fb0d81fd460df66f2d5d9408b6a3103a0`:
  [smoke, Chromium y WebKit/Safari correctos](https://github.com/ArchaiosMagister/Palabra-del-dia/actions/runs/43935913193);
  [Pages correcto](https://github.com/ArchaiosMagister/Palabra-del-dia/actions/runs/43935912971).
- Los commits activos en `main` de Appendix, Evolutio y Vocabula
  coinciden con los SHA fijados en `config/sources.lock.json`
  (respectivamente `6e9ae22d`, `901dacb1`, `a7be2161`).
  No se detectó deriva entre esos originales y el pin de ScholaClassica.
- `GeneradorExamenes` sigue correctamente fuera del artefacto publicado.

## Matriz de cobertura y evidencias

| Área | Comprobaciones identificadas | Estado |
| --- | --- | --- |
| Portada y navegación por lengua y herramienta | Rutas y módulos, páginas reales, subruta `/ScholaClassica/`, enlaces externos con `noopener noreferrer` | Cubierta en CI, sin fallos |
| Gramática en castellano/valenciano | Latín I, Latín 4.º (8 unidades), Griego I, nexos de Latín II; interfaz solo de consulta | Cubierta en CI, sin fallos |
| Vocabula | General/Examen/Todo, colisiones filológicas, catálogo docente, progresos y avisos | Cubierta en CI, sin fallos |
| Morfología | Selección curricular, paradigmas, teclado griego, respuestas escritas, progreso y repaso | Cubierta en CI, sin fallos |
| Evolutio y Etymologicon | PWA aisladas, bancos inmutables, corrector, selección de unidades y progreso | Cubierta en CI, sin fallos |
| Temas visuales | Claro/oscuro/OLED, persistencia y fondo negro en portada; paletas adaptadas en módulos | Cubierta en CI, sin fallos |
| Funcionamiento sin conexión | Workers con prefijos y ámbitos diferenciados, reanudación, cambios de modo y recuperación | Cubierta en CI, sin fallos |
| Área docente | Login, MFA AAL2/TOTP, autorización de fuentes, búsqueda y edición simulada | Cubierta **con servicios simulados**; falta sesión real |
| Palabra del día | Dos PWA aisladas, votación, proyección, recuperación, docentes, accesibilidad y Safari | Cubierta en CI, sin fallos |
| Permisos SQL de Palabra del día | 13 accesos docentes con sesión, hash de invitación no legible y 60 visitas/10 minutos | Verificado en auditorías directas anteriores |

**Importante:** la etiqueta «cubierta en CI» refleja qué ensayos se
ejecutaron y superaron; no equivale a un test manual completo con los
dispositivos ni las credenciales reales del profesor.

## Incidencia funcional #1: error de una fuente secundaria cierra toda la sesión

**Severidad: media. Confirmación por lectura directa de la ruta
`public/docente/app.mjs`.**

La bandeja docente consulta dos fuentes independientes: `schola-inbox`
(ScholaClassica, identidad principal) y `schola-palabra-inbox`
(Palabra del día, puente independiente). Antes de esta PR,
`fetchNotices()` llamaba `signOut({scope:'local'})` y ocultaba el
panel entero si cualquiera devolvía HTTP 401/403. Esto convertía una
denegación del puente secundario en un cierre indebido de una sesión
AAL2 que el servidor principal había autorizado.

**Corrección en la presente PR:** solo la denegación expresa de
`schola-inbox` invalida el acceso principal. Un 401/403 del servicio
secundario degrada su indicador a «no disponible»; conserva los avisos,
las funciones de administración de Vocabula y la sesión del profesor.
Las comprobaciones de autorización de las dos Edge Functions no se
alteran.

**Regresión nueva en `tests/docente-browser.mjs`:** el servidor
principal está autorizado y simula un puente de Palabra que devuelve
403. El navegador comprueba la continuidad de la sesión, la permanencia
de Vocabula y el aviso explícito de la fuente que ha fallado. Sigue
existiendo la prueba de denegación principal que debe bloquear el
panel completo, incluso después de TOTP.

## Otros puntos a verificar o decidir, no tratados como errores confirmados

1. **Sesión real del profesor.** El flujo completo de login, TOTP,
   bandeja, búsqueda, apertura de una ficha y cierre de sesión
   sigue requiriendo una prueba manual con la cuenta docente, sin
   introducir contraseñas ni códigos TOTP en tickets o herramientas.
2. **Historial de avisos.** La bandeja recupera las primeras 100
   notificaciones por origen y señala cuándo existen más. No dispone
   de paginación retrospectiva. Es una limitación conocida, no un
   error de autorización. Podría requerir paginación antes de que
   el volumen crezca.
3. **Navegación de avisos a Vocabula.** Los avisos del módulo enlazan
   actualmente a la PWA original `VocabulaLatinaGraecaque`, no a su
   versión integrada en ScholaClassica. El comportamiento es
   deliberado en el código («Abrir aplicación original»); modificarlo
   es una decisión de experiencia de usuario, no una corrección
   urgente de seguridad.
4. **Editor por identificador histórico.** Se preservan las acepciones
   General y Examen y se impide aplicar una edición ambigua, pero
   editar por ID individual sigue pendiente de un modelo explícito
   sin alterar IDs ni progreso.
5. **Diferencia entre simulación y producción.** Las pruebas de
   navegador del área docente interceptan los servidores. Una ejecución
   completa con credenciales y MFA reales queda fuera del alcance
   automático y no se certifica aquí.

## Criterio de integración

- Ningún cambio de modelo curricular, banco, identificadores, unidades,
  notas o progreso.
- Ninguna migración ni despliegue de Edge Functions.
- Revisión de la nueva regresión y batería integral de CI en la PR.
- La publicación definitiva queda separada de la aceptación de los
  resultados por el docente.

Próximo bloque tras esta PR: verificación funcional guiada de la zona
docente y conciliación académica transversal de Latín I, Latín 4.º y
Griego I, con las discrepancias filológicas expuestas para decisión.
