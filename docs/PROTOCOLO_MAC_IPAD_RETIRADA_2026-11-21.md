# Comprobación física de ScholaClassica antes de archivar originales

**Protocolo del 21 de noviembre de 2026.** No autoriza retirar ningún repositorio. La batería de GitHub Actions NO sustituye ninguna prueba de esta hoja.

## A. Mac: doble copia privada y restaurada

Requisitos: Mac con **Git, Node.js 22 o posterior** y **una unidad externa segura**, preferentemente cifrada, montada en `/Volumes/`. Nunca subir los bundles a GitHub, chat, correo ni almacenamiento compartido sin cifrar. El historial Git puede contener credenciales antiguas.

En Terminal, si no dispones aún del repositorio en ese Mac:

```bash
git clone https://github.com/ArchaiosMagister/ScholaClassica.git
cd ScholaClassica
```

Si ya tienes la carpeta, entra en ella y actualiza `main` antes de ejecutar los comandos.

Utiliza dos nombres de carpeta **que todavía NO existan**. Sustituye `MI_DISCO_CIFRADO` por el nombre real del disco externo que ves en Finder:

```bash
npm run backup:two-copies -- --plan "$HOME/Documents/Schola-respaldo-20261121" "/Volumes/MI_DISCO_CIFRADO/Schola-respaldo-20261121"
```

El modo `--plan` es solo diagnóstico, no clona ni escribe nada. Si responde que son sistemas de archivos distintos y has comprobado visualmente que el segundo está en un disco realmente independiente, ejecuta:

```bash
npm run backup:two-copies -- --create "$HOME/Documents/Schola-respaldo-20261121" "/Volumes/MI_DISCO_CIFRADO/Schola-respaldo-20261121"
```

El script descarga únicamente los tres repositorios académicos originales públicos, crea tres bundles en la primera carpeta, verifica la restauración de cada uno, copia los tres bundles y el manifiesto a la unidad externa, compara SHA-256 y **restaura los tres bundles desde la segunda carpeta**. No envía sus contenidos a GitHub, no toca Supabase y no borra repositorios. Falla si la carpeta ya existe, si las rutas están dentro del checkout o si los destinos están en el mismo sistema de archivos. Si se interrumpe, conserva los archivos y comienza de nuevo con **otros nombres de carpeta**, sin sobreescribir ni eliminar la primera prueba hasta revisarla.

La separación entre dos sistemas de archivos no prueba que sean dos discos físicos distintos. Confirma manualmente que la segunda unidad es un disco/soporte independiente, que está cifrada y que puedes desconectarla y volverla a montar. Conserva ambos respaldos. El programa no cubre bases de datos Supabase, permisos, claves, objetos Storage, Git LFS ni PWA instaladas.

**Casillas para cerrar personalmente:**

- [ ] En Terminal se mostró «3 bundles verificados en DOS volúmenes distintos».
- [ ] El segundo destino es un soporte físico independiente, protegido, y se puede desconectar.
- [ ] Hay un manifiesto `respaldo-git-verificado.json` en ambas carpetas.
- [ ] No se han compartido los bundles ni el manifiesto en un repositorio público.

## B. iPad real: URL, progreso y PWA

Usa **Safari en tu iPad habitual** y sus aplicaciones ya instaladas, no un navegador automatizado. No utilices datos reales de alumnado para la prueba. Las aplicaciones antiguas y nuevas tienen orígenes diferentes y no comparten automáticamente el almacenamiento. **No desinstales ni borres ninguna PWA antigua** aunque todas las casillas queden marcadas.

### B1. Appendix: material de consulta

- [ ] Abre [Appendix antiguo](https://archaiosmagister.github.io/Appendix-grammaticae/) y [Gramática integrada](https://archaiosmagister.github.io/ScholaClassica/apps/gramatica/).
- [ ] Accede al menos a Latín I UD1, Latín II sintaxis y Griego I sintaxis; comprueba textos, tablas, enlaces profundos y cambio de castellano/valenciano en los contenidos existentes.
- [ ] Desde una página ya visitada, abre la PWA integrada desde la pantalla de inicio, activa modo avión y comprueba que puedes leer los capítulos descargados; después vuelve a conectarte.
- [ ] Los marcadores/QR antiguos siguen llegando a su destino sin redirección forzosa.

Appendix es fundamentalmente consulta; esta prueba no requiere exportar resultados académicos.

### B2. Vocabula: historial de vocabulario

- [ ] Abre [Vocabula antiguo](https://archaiosmagister.github.io/VocabulaLatinaGraecaque/), selecciona una **asignatura, General o Examen, y al menos una unidad**. Resuelve una tarjeta de prueba y anota el contador de «palabras practicadas».
- [ ] Despliega **«Cómo practicar»** y pulsa **«Exportar progreso»**. Guarda el JSON en Archivos sin cambiarlo.
- [ ] Abre [Vocabulario integrado](https://archaiosmagister.github.io/ScholaClassica/apps/vocabulario/index.html?subject=lat1), despliega «Cómo practicar» y pulsa **«Importar progreso»**; selecciona el JSON anterior.
- [ ] Comprueba que el contador, las palabras practicadas y los fallos pendientes coinciden, y que «Todo el vocabulario» no duplica resultados.
- [ ] Si quieres probar reversibilidad, exporta desde ScholaClassica e importa de nuevo en una instalación antigua de prueba, sin borrar el JSON conservado.

**No confundas este JSON con el de gramática.**

### B3. Repaso de sintaxis y conceptos: historial independiente

- [ ] Abre [Gramática antigua de Vocabula](https://archaiosmagister.github.io/VocabulaLatinaGraecaque/gramatica.html), realiza una respuesta de prueba y despliega **«Guardar o recuperar mi progreso de gramática»**.
- [ ] Pulsa **«Exportar progreso de gramática»** y conserva el archivo JSON en Archivos.
- [ ] Abre [Repaso integrado](https://archaiosmagister.github.io/ScholaClassica/apps/repaso-gramatica/index.html?subject=lat1), despliega el mismo apartado y selecciona **«Importar progreso de gramática»**.
- [ ] Comprueba el mensaje de importación y que los aciertos previos se conservan. Realiza una pregunta nueva y confirma que las antiguas no se pierden.
- [ ] Comprueba que **el contador y los fallos de Vocabulario no se han alterado**.

### B4. Evolutio y las PWA antiguas

- [ ] Abre [Evolutio antiguo](https://archaiosmagister.github.io/EvolucionFonetica/) y [Evolutio integrado](https://archaiosmagister.github.io/ScholaClassica/apps/evolucion-fonetica/index.html). Comprueba una palabra castellana, las leyes ofrecidas y la corrección.
- [ ] Desde una PWA integrada instalada y previamente cargada, prueba esa palabra con modo avión y comprueba su acceso sin conexión. Restablece la conexión.
- [ ] Comprueba en la pantalla de inicio que las PWA **antiguas siguen abriéndose por separado**, conservan sus datos locales y no han perdido sus iconos o accesos.

**Advertencia:** Evolutio no ofrece un exportador de historial de respuestas equivalente al de Vocabula. No considerar que el progreso antiguo se ha migrado automáticamente, ni retirar su instalación por haber superado una prueba funcional.

## C. Evidencias y decisión

Esta ficha es **manual**. Marcar una casilla significa que se ha visto el resultado en el dispositivo, no que se ha inferido de GitHub Actions. Para revisar el estado sin compartir datos privados, basta comunicar un resumen breve: «Mac: copias 3/3 y disco independiente confirmado; iPad: Appendix sí/no, Vocabula sí/no, Repaso sí/no, Evolutio sí/no, PWA offline sí/no» y las incidencias observadas. **No adjuntar JSON de progreso, bundles, contraseñas ni tokens.**

Las dos bases Supabase siguen requiriendo un **respaldo privado independiente** y verificación de restauración en un entorno aislado. No se ha efectuado desde este procedimiento.

Hasta disponer de las evidencias físicas y de la aprobación **por repositorio**, mantener Appendix, Evolutio y Vocabula públicos y funcionales. **No archivar ni borrar**. GeneradorExamenes permanece independiente.
