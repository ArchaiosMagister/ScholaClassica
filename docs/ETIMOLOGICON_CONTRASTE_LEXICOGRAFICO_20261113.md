# Etymologicon · Contraste documental y lexicográfico (13-11-2026)

## Qué se ha comprobado

El inventario de **487 derivados** de Griego I se cruzó por escrito con los tres PDF aportados por el docente, utilizando extracción de texto PDF, normalización de tildes y límites de palabra. Se conservó para cada término la primera página de coincidencia en cada fuente:

- Gálvez Marín, *Etimologías griegas* (2009): **445** voces localizadas.
- *Breve diccionario de helenismos de griego clásico* (6 pp.): **243** voces localizadas.
- Berberana, *Etimologías griegas* (PAU 2008-09, 31 pp.): **319** voces localizadas.
- Total de lemas con coincidencia literal en al menos un PDF: **475/487**. No son cifras excluyentes por PDF.

Estas cifras verifican **solo la presencia textual**, no necesariamente el significado ni la procedencia griega. Las páginas se conservan en `shared/academic/greek-etymology/review/source-concordance-gr1-20261113.json`, con la metodología expresada, para que la auditoría sea repetible.

Las **12 voces no localizadas** por coincidencia literal se han contrastado individualmente con el DLE u otros recursos especializados:

| Término | Resultado |
|---|---|
| atelectasia | Confirmado en DLE 24; ἀτελής + ἔκτασις |
| efeméride | Confirmado en DLE 24, con variante *efemérides* |
| geniogloso | No figura como artículo independiente en DLE 24; tecnicismo anatómico documentado en Kenhub |
| genioplastia | Cotejado en el diccionario médico de la Clínica Universidad de Navarra; no se ha acreditado artículo DLE |
| macrobiótico | Confirmado en DLE 24; sentido alimentario actual |
| plastilina | DLE 24: procede de marca registrada; la referencia griega es indirecta |
| plutócrata | Confirmado en DLE 24 |
| proctitis | Cotejado en Dicciomed (Universidad de Salamanca), no como artículo DLE |
| seudociencia | Sin artículo DLE 24 independiente para seudociencia o pseudociencia; sí consta seudo-/pseudo- y seudocientífico |
| somatización | Artículo DLE visible, remite a *somatizar*; la formación última procede de σῶμα |
| tanatología | Confirmado en DLE 24; préstamo por francés *thanatologie* |
| tomografía | Confirmado en DLE 24; préstamo por inglés *tomography* |

Se comprobaron también artículos de **autarquía** (dos palabras homógrafas que no deben confundirse), **antropomorfismo, microbiología, autocracia, filólogo, bioética, cardiopatía, antropometría, microchip, helioterapia, hipódromo y filántropo**. Las 24 decisiones de cotejo externas —incluidos tecnicismos y ausencias de entrada propia— figuran en `shared/academic/greek-etymology/review/lexicographic-checks-gr1-20261113.json`.

## Decisiones filológicas

1. **Autarquía.** DLE distingue *autarquía¹* (αὐταρχία, poder absoluto) de *autarquía²* (αὐτάρκεια, autosuficiencia). Se corrige la glosa didáctica de la ficha correspondiente a αὐτός + ἀρκέω: «Condición o política de autosuficiencia: bastarse con los recursos propios». La auditoría y el catálogo de ejercicios no se reescriben.
2. **Plastilina.** La ficha deja explícito el origen como marca registrada y la relación indirecta con la familia de πλαστός. No se afirma que sea derivación directa griega.
3. **Seudociencia.** No se equipara «sin artículo independiente en DLE» con «palabra incorrecta»: los elementos compositivos están documentados en el DLE.
4. **Macrobiótico, tanatología y tomografía.** Se explicita la evolución semántica o la transmisión por otra lengua para no equiparar composición escolar y etimología inmediata.
5. **Geniogloso, genioplastia y proctitis.** Se documenta el uso especializado sin reclamar registro en el DLE.

## Estado que permanece pendiente

No deben marcarse las **475 coincidencias textuales** como «DLE contrastado» ni inferirse que los significados de 487 fichas se han certificado individualmente. Las voces no cotejadas artículo por artículo mantienen su estado de **revisión lexicográfica individual pendiente**, aun cuando se encuentren en uno o más de los PDF docentes.

El catálogo de estudio expone las páginas de los PDF y, cuando hay cotejo individual, la fuente, los resultados y las advertencias. La aplicación conserva **111 étimos, 487 derivados, los 108 étimos elegibles y los 16 ejercicios cerrados de descomposición**, sin cambios en las respuestas calificables ni en el progreso local.

## Referencias externas individuales

- DLE 24.ª (2026): `https://dle.rae.es/<palabra>` (enlace individual en los registros).
- [Dicciomed: proctitis](https://dicciomed.usal.es/palabra/proctitis).
- [CUN: genioplastia](https://www.cun.es/diccionario-medico/terminos/genioplastia).
- [Kenhub: geniogloso](https://www.kenhub.com/es/library/anatomia-es/anatomia-de-la-lengua).
- [DLE: seudo-/pseudo-](https://dle.rae.es/seudo-).
