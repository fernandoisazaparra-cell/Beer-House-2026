# Backend Scripts — Beer House 2026
Comandos para instalar, correr y administrar el backend (Flask).

## Índice
|-------------------------------------------|---------------|-----------------------------------------------|
| Comando                                   | Categoría     | Descripción rápida                            |
|-------------------------------------------|---------------|-----------------------------------------------|
| [`backend:install`](#-backendinstall)     | Setup         | Instala Python, venv y dependencias           |
| [`backend:dev`](#-backenddev)             | Desarrollo    | Levanta el servidor con debug/hot-reload      |
| [`backend:start`](#-backendstart)         | Deploy        | Levanta el servidor con Waitress (producción) |
| [`backend:lint`](#-backendlint)           | Calidad       | Verifica/corrige estilo de código con Ruff    |
| [`backend:test`](#-backendtest)           | Calidad       | Corre los tests con pytest                    |
| [`backend:clean`](#-backendclean)         | Mantenimiento | Borra `venv` y cachés de Python               |
|-------------------------------------------|---------------|-----------------------------------------------|
---

## `backend:install`
```bash
npm run backend:install
```
**Qué hace:** verifica que haya Python instalado (y opcionalmente valida la versión contra `backend/python-version` o `.python-version`), crea el entorno virtual si no existe, instala `requirements.txt` con pip, y copia `.env.example` → `.env` si falta.
**Cuándo usarlo:** una sola vez al clonar el proyecto, o cada vez que cambien las dependencias.

---
## `backend:dev`
```bash
npm run backend:dev
```
**Qué hace:** corre `python run.py` directamente — con `debug=True`, hot-reload automático y el debugger interactivo de Flask activado. Corre indefinidamente hasta `Ctrl+C`.
**Cuándo usarlo:** para desarrollo local, nunca en un servidor con tráfico real ni expuesto a internet.

---
## `backend:start`
```bash
npm run backend:start
```
**Qué hace:** sirve la app con **Waitress** (`waitress-serve run:app`) en el puerto definido por `PORT` en `.env` (por defecto `8000`). Sin debugger, sin hot-reload, apto para tráfico real.
**Cuándo usarlo:** en producción o staging.

---

## `backend:test`
```bash
npm run backend:test
```
**Qué hace:** corre `pytest` sobre el proyecto.
**Cuándo usarlo:** antes de un PR, o en CI.

---

## `backend:clean`
```bash
npm run backend:clean               # borra venv y cachés de Python
npm run backend:clean -- --env      # además borra backend/.env
```
**Qué hace:** elimina `backend/venv/` y todas las carpetas `__pycache__`/`.pytest_cache` del proyecto (recursivo, sin tocar `venv/` mientras busca).
**Cuándo usarlo:** cuando el entorno virtual quedó en un estado raro y preferís reinstalar de cero.

---

## `backend:lint`
```bash
npm run backend:lint            # solo verifica, no modifica nada
npm run backend:lint -- --fix   # corrige formato y lint automáticamente
```
**Qué hace:** corre **Ruff** en dos pasos — primero verifica el formato (`ruff format --check`), después el lint (`ruff check`). Ruff reemplaza Flake8 + Black + isort en una sola herramienta, escrita en Rust (muy rápida). La configuración vive en `backend/ruff.toml`.
**Cuándo usarlo:** antes de un commit/PR, o como paso de validación en CI (sin `--fix`, para que falle si hay algo mal en vez de modificar código en el pipeline).
Sin `--fix`, el comando solo reporta problemas y falla si encuentra alguno — no toca tu código. Con `--fix`, corrige lo que puede automáticamente (no todo es auto-corregible, por ejemplo variables sin usar necesitan revisión manual).

## Reglas generales
- **Desarrollo local** → `backend:dev` (con debugger, sí, pero solo en tu máquina).
- **Producción / staging** → `backend:start` (Waitress, sin debugger).
- **Nunca** despliegues `backend:dev` en un servidor con tráfico real o expuesto a internet.
- **Antes de un PR** → `backend:test`.
- **Si algo se rompe raro** → `backend:clean` seguido de `backend:install`.

---