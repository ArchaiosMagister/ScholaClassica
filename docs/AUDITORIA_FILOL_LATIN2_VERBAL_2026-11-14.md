# Auditoría filológica de Latín II · segundo bloque verbal (14-11-2026)

## Alcance y estado

La auditoría corresponde a los generadores del **banco real de
ScholaClassica**, usando como material docente el **Cuaderno de Latín II
2026–2027, páginas 73–78**, contrastado con Allen y Greenough
(§§200, 203 y 204) y los paradigmas de Dickinson College Commentaries.

Los cambios de este bloque están en la **PR n.º 67**, cuya base es la
rama de la auditoría nominal de la **PR n.º 66**. Ninguna de las dos
PR se ha publicado. Los repositorios independientes de gramática,
vocabulario y GeneradorExamenes no se modifican.

## Hallazgos corregidos

| Código | Hallazgo | Cambio en el banco |
| --- | --- | --- |
| VER-01 | El generador tenía imperativos solo de primera conjugación | Se generan las **dos personas** del imperativo presente de las cinco clases: 1.ª, 2.ª, 3.ª, 4.ª y mixta, con voz y enunciado |
| VER-02 | `dico, duco, facio` no tenían expresadas sus excepciones | `dic/dicite`, `duc/ducite`, `fac/facite`, sin los falsos `dice, duce, face` como imperativos |
| VER-03 | Faltaban imperativos deponentes de 2.ª, 3.ª, 4.ª y mixta | `pollicere/pollicemini`, `sequere/sequimini`, `proficiscere/proficiscimini`, `patere/patimini`, `adorire/adorimini`; conservados también los de primera del bloque anterior |
| VER-04 | El repertorio de irregulares carecía de imperativos | `fer/ferte` (activa), `ferre/ferimini` (pasiva), `i/ite` (eo), `es/este` (sum), y los imperativos de `confero, refero, differo` heredados de `fero` |
| VER-05 | `eo` solo contenía la conjugación personal activa | Pasiva **exclusivamente impersonal**, tercera singular: `itur`, `ibatur`, `ibitur`, `eatur`, `iretur`, `itum est`, `itum erat`, `itum erit`, `itum sit`, `itum esset` |
| VER-06 | `eo` tenía el sistema con `ii-` pero no todas sus variantes con `iv-` | Se incorpora `iveram, iveris, ivissem`, etc., **identificadas como variantes poco frecuentes**, sin sustituir las formas clásicas de `ii-` |
| VER-07 | Faltaban participios de `eo` y concordancias del infinitivo futuro | Se declinan `iens, euntis` (presente) e `iturus, itura, iturum` (futuro); infinitivos futuros con concordancia. No se crea un supuesto participio perfecto personal `itus` |
| VER-08 | El compuesto `refero` estaba formado solo con `retul-` | Se incorpora también `rettul-` (cf. `rettuli, rettuleram, rettulisse`) y se conserva `retul-` como variante |
| VER-09 | `fimus/fitis` de `fio` figuraban sin observación de uso | Se mantienen como formas atestiguadas con etiqueta **poco frecuentes en prosa clásica**, fuera del sorteo ordinario |
| VER-10 | `ferre` podía preguntarse con una sola de sus interpretaciones | La práctica de forma aislada agrega análisis de **verbo personal/imperativo/infinitivo** cuando comparten enunciado y grafía. No convierte una lectura verdadera en distractor falso |

**Importante:** en tiempos compuestos como `profectus est`,
`collata erant` o `factus est`, la unidad de análisis sigue
siendo el **verbo léxico completo**, no el auxiliar `sum`
aislado ni el participio por separado.

## Auditoría reproducible

La construcción genera
`apps/morfologia/data/latin2-filologia-verbal.json`
mediante `scripts/audit-morphology-latin2-verbal.mjs`.

Incluye:

- Inspección estructural de **todas las casillas** de verbo personal,
  participio e infinitivo de Latín II: categoría, enunciado,
  persona/número/tiempo/modo/voz cuando corresponda y accidentes nominales
  de los participios.
- Control específico de **21 modelos** con ambos imperativos,
  sus excepciones y deponentes.
- Control positivo de sincretismos: `feram`, `fiam`,
  `instituit`, `mitteris`, y de perfectos activos/pasivos con sus
  lemas propios.
- Control negativo de formas inventadas y de una pasiva personal
  inexistente para el simple `eo`.
- Criterio cerrado para `noceo`: pasiva **impersonal** normal (`nocetur`, `nocitum est`), con ejemplos en Cicerón y César. Lewis & Short registra pasivas personales muy excepcionales (Vitruvio, Solino); esas casillas solo reconstruidas por modelo llevan **pendiente de cotejo individual** y quedan fuera del sorteo, sin declararlas imposibles.
- Un test de regresión que introduce deliberadamente una forma verbal
  incorrecta y exige que la construcción falle.

La validación **no equivale a haber cotejado individualmente cada forma
del banco con los textos clásicos**. La distribución académica
*documentado / derivado / variante rara / pendiente* debe seguir
conservándose.

## Referencias de contraste

1. **Allen y Greenough §200**, `fero` y sus compuestos:  
   https://dcc.dickinson.edu/ro/grammar/latin/irregular-verbs-fer%C5%8D-and-ed%C5%8D
2. **Allen y Greenough §203**, `eo` y su pasiva impersonal:  
   https://dcc.dickinson.edu/grammar/latin/irregular-verbs-d%C5%8D-e%C5%8D-and-ade%C5%8D
3. **Allen y Greenough §204**, `fio` y `facio`:  
   https://dcc.dickinson.edu/it/grammar/latin/irregular-verbs-f%C4%AB%C5%8D
4. Imperativos deponentes, Gramática de University of Illinois:  
   https://iopn.library.illinois.edu/pressbooks/libelluslatintextbook/chapter/chapter-12-indirect-commands-verbs-vii-semi-deponents-pronouns-v/
5. **The National Archives**, paradigmas de los irregulares y sus modos:  
   https://www.nationalarchives.gov.uk/latin/stage-2-latin/resources/stage-2-latin-grammar-resource/
6. Gramática de Allen y Greenough, `eo`:  
   https://grammars.alpheios.net/allen-greenough/conj25.htm

## Pendientes de un tercer bloque

- Cotejo **individual** de los lemas regulares que actualmente se
  declinan y conjugan por modelos escolares, con clasificación por
  evidencia de cada casilla, no por cobertura del vocabulario.
- Contrastar testimonios de otras pasivas personales excepcionales y perfectos alternativos, distinguiendo formas *atestiguadas* de modelos completos reconstruidos.
- Filtros didácticos de frecuencia/uso y verificación contextual con
  textos de Selectividad para elegir la lectura sintácticamente pertinente.

**Política de seguridad:** no fusionar PR 67 antes de revisar su base,
la PR 66, y no publicar sin la batería completa de pruebas.
