# Frontend Scripts — Beer House 2026
Comandos para instalar, correr y administrar el frontend (React + Create React App).

---
## Índice
|-------------------------------------------|---------------|---------------------------------------|
| Comando                                   | Categoría     | Descripción rápida                    |
|-------------------------------------------|---------------|---------------------------------------|
| [`frontend:install`](#-frontendinstall)   | Setup         | Instalación inicial de dependencias   |
| [`frontend:dev`](#-frontenddev)           | Desarrollo    | Levanta el servidor de desarrollo     |
| [`frontend:build`](#-frontendbuild)       | Deploy        | Genera el build de producción         |
| [`frontend:lint`](#-frontendlint)         | Calidad       | Verifica estilo de código             |
| [`frontend:clean`](#-frontendclean)       | Mantenimiento | Borra `node_modules` y `build`        |
|-------------------------------------------|---------------|---------------------------------------|

---
## `frontend:install`

```bash
npm run frontend:install
```
**Qué hace:** valida que exista `frontend/package.json`, chequea la versión de Node instalada contra `frontend/.nvmrc` o `frontend/node-version` (si existe), corre `npm install`, y copia `.env.example` → `.env` si falta.
**Cuándo usarlo:** una sola vez al clonar el proyecto, o cada vez que cambien las dependencias en `package.json`.
---

## `frontend:dev`
```bash
npm run frontend:dev
```
**Qué hace:** levanta el servidor de desarrollo de Create React App (`npm start` → webpack-dev-server), con hot reload. A diferencia de los demás comandos, este **no termina solo** — corre hasta que lo cortás con `Ctrl+C`.
**Cuándo usarlo:** para trabajar en el frontend día a día.
Requiere haber corrido `frontend:install` antes (verifica que exista `node_modules/`).

---
## `frontend:build`
```bash
npm run frontend:build
```
**Qué hace:** genera el build optimizado de producción (`react-scripts build`) en `frontend/build/`. Corre con `CI=true` para evitar prompts interactivos que podrían colgar el proceso en un pipeline automatizado.
**Cuándo usarlo:** antes de desplegar, o en el pipeline de CI/CD. El contenido de `frontend/build/` es lo que se sirve en producción (Nginx, S3 + CloudFront, Vercel, etc).
---

## `frontend:lint`
```bash
npm run frontend:lint
```
**Qué hace:** corre el script `lint` definido en `frontend/package.json` (normalmente ESLint sobre `src/`). Si no existe ese script todavía, el comando falla con instrucciones de cómo agregarlo.
**Cuándo usarlo:** antes de hacer commit/PR, o como paso de validación en CI.

---
## `frontend:test`
```bash
npm run frontend:test
```
**Qué hace:** corre los tests con Jest (`npm test -- --watchAll=false`), en modo "una sola pasada" — sin quedar en modo watch interactivo, ideal para CI.
**Cuándo usarlo:** antes de mergear un PR, o en el pipeline de CI.

---
## `frontend:clean`
```bash
npm run frontend:clean               # borra node_modules y build
npm run frontend:clean -- --env      # además borra frontend/.env
```
**Qué hace:** elimina `frontend/node_modules/` y `frontend/build/`. Con el flag `--env`, también borra `frontend/.env` (útil si querés forzar que se regenere desde `.env.example` en el próximo `install`).
**Cuándo usarlo:** cuando las dependencias quedaron en un estado raro y preferís reinstalar todo de cero, en vez de debuggear.

---
## Reglas generales

- **Primer setup** → `frontend:install`.
- **Trabajo diario** → `frontend:dev`.
- **Antes de un PR** → `frontend:lint` + `frontend:test`.
- **Antes de deploy / en CI** → `frontend:build` (nunca `frontend:dev` en producción, ese servidor no está pensado para tráfico real).
- **Si algo se rompe raro** → `frontend:clean` seguido de `frontend:install`.