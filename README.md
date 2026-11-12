# ScholaClassica

Plataforma modular de estudio de latín y griego, en integración **sin publicación para el alumnado**.

## Estado (fase 1)

- `apps/gramatica/`: copia de **Appendix grammaticæ** generada desde un commit fijado del repositorio original; los archivos de origen se conservan idénticos.
- Vocabula Latina Græcaque, Evolutio y GeneradorExamenes: aún no incorporados al resultado de compilación.
- Zona docente: pendiente de autenticación y autorización del lado del servidor. No se publica el generador en esta fase.
- Los repositorios originales son las únicas fuentes editables de sus aplicaciones durante la migración.

## Construcción local

Se necesita Node.js 22 y una copia de solo lectura del repositorio original en `.sources/appendix`:

```bash
git clone https://github.com/ArchaiosMagister/Appendix-grammaticae.git .sources/appendix
git -C .sources/appendix checkout a3d54209b3bb8a31efd3d57d62b09d6de8d85f5c
node .sources/appendix/scripts/validate-site.mjs # ejecutar desde el directorio .sources/appendix, no la raíz
npm run build
npm test
```

En GitHub Actions, el checkout y las comprobaciones se ejecutan automáticamente. El resultado es `dist/`, que se guarda **solo como artefacto de pruebas**. No hay workflow de despliegue ni se activa GitHub Pages.

Para navegar localmente tras construir: `python3 -m http.server 8000 -d dist`.

## Integridad y sincronización

Las versiones están registradas en `config/sources.lock.json`. El proceso de integración comprueba el SHA de Appendix y copia sus archivos byte a byte, sin modificar la fuente ni ejecutar escrituras sobre repositorios externos. Actualizar una fuente exigirá un nuevo commit de integración y superar las pruebas antes de aprobarse. La automatización de propuestas de actualización está pendiente: todavía **no** se afirma que la sincronización sea automática.

Consulta `docs/ARQUITECTURA.md`, `docs/SEGURIDAD.md` y `docs/PLAN_INTEGRACION.md`.
