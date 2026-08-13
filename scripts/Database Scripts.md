# Database Scripts — Beer House 2026
Comandos para instalar, migrar y administrar la base de datos MySQL del proyecto.
---

## Índice
|-----------------------------------|---------------|-----------------------------------------------|
| Comando                           | Categoría     | Descripción rápida                            |
|-----------------------------------|---------------|-----------------------------------------------|
| [`db:install`](#-dbinstall)       | Setup         | Instalación inicial completa                  |
| [`db:migrate`](#-dbmigrate)       | Desarrollo    | Genera y aplica una migración nueva           |
| [`db:upgrade`](#-dbupgrade)       | Deploy        | Aplica migraciones ya existentes              |
| [`db:status`](#-dbstatus)         | Inspección    | Muestra el estado actual de la DB             |
| [`db:history`](#-dbhistory)       | Inspección    | Historial completo de migraciones             |
| [`db:downgrade`](#-dbdowngrade)   | Desarrollo    | Revierte la última migración                  |
| [`db:backup`](#-dbbackup)         | Mantenimiento | Genera un dump `.sql`                         |
| [`db:restore`](#-dbrestore)       | Mantenimiento | Restaura un dump `.sql`                       |
| [`db:seed`](#-dbseed)             | Desarrollo    | Puebla la DB con datos de prueba              |
| [`db:reset`](#-dbreset)           | Desarrollo    | Vacía y reconstruye todas las tablas          |
| [`db:check`](#-dbcheck)           | CI            | Verifica que modelos y migraciones coincidan  |
|-----------------------------------|---------------|-----------------------------------------------|

---
## `db:install`
```bash
npm run db:install
```
**Qué hace:** instalación inicial de punta a punta. Valida `backend/.env`, verifica la conexión a MySQL, **crea la base de datos** si no existe, corre `flask db init` (solo la primera vez), genera la migración inicial (`initial schema`) y la aplica. Al final verifica que la tabla `users` se haya creado correctamente.
**Cuándo usarlo:** una sola vez, al clonar el proyecto por primera vez. Requiere haber corrido `backend:install` antes.

---

## `db:migrate`
```bash
npm run db:migrate
npm run db:migrate -- "agregar columna phone a users"
```
**Qué hace:** compara tus modelos de SQLAlchemy contra el historial de migraciones, genera un archivo nuevo con el diff (`flask db migrate`) y lo aplica inmediatamente (`flask db upgrade`).
**Cuándo usarlo:** cada vez que agregás, modificás o borrás un modelo. Es el comando del día a día en desarrollo. Requiere que `backend/migrations/` ya exista (correr `db:install` primero si es la primera vez).
**No usar en producción** — ahí solo se aplican migraciones ya generadas y commiteadas (ver `db:upgrade`).

---

## `db:upgrade`
```bash
npm run db:upgrade
```
**Qué hace:** aplica las migraciones que **ya existen** en el repo (`flask db upgrade`). A diferencia de `db:migrate`, nunca genera nada nuevo — solo ejecuta lo que otro dev (o vos en local) ya escribió y commiteó.
**Cuándo usarlo:** en deploys de producción/staging, o cuando bajás cambios de git que incluyen migraciones nuevas y solo necesitás aplicarlas a tu DB local.
**Es el comando seguro para CI/CD y producción.**

---

## `db:status`
```bash
npm run db:status
```
**Qué hace:** muestra la versión de migración actual de la base de datos (`flask db current`) vs. la última disponible en el repo (`flask db heads`), y te dice si están sincronizadas o si hay migraciones pendientes de aplicar.
**Cuándo usarlo:** antes de hacer deploy, después de un `git pull`, o cuando algo no anda y querés saber en qué estado quedó la DB.

---

## `db:history`
```bash
npm run db:history
```

**Qué hace:** imprime el historial completo de migraciones en orden (`flask db history`), mostrando cada revisión y su mensaje descriptivo.
**Cuándo usarlo:** para entender cómo evolucionó el esquema de la base de datos, o para ubicar el ID de una revisión específica antes de hacer un `db:downgrade`.

---

## `db:downgrade`

```bash
npm run db:downgrade                  # revierte 1 paso
npm run db:downgrade -- -2            # revierte 2 pasos
npm run db:downgrade -- base          # revierte todo, deja las tablas vacías
```

**Qué hace:** revierte migraciones aplicadas usando la función `downgrade()` de cada archivo de migración (`flask db downgrade`).
**Cuándo usarlo:** cuando una migración reciente rompió algo y necesitás volver atrás rápido.
**En producción exige `--force` explícito.** Depende de que la migración tenga bien escrita su lógica de reversión.

---

## `db:backup`
```bash
npm run db:backup
```

**Qué hace:** genera un dump completo de la base de datos con `mysqldump`, guardado en `backups/<nombre_db>-<timestamp>.sql`. La contraseña se pasa por variable de entorno (`MYSQL_PWD`), nunca queda visible en el comando.
**Cuándo usarlo:** antes de cualquier operación riesgosa (`db:reset`, `db:downgrade` en producción, migraciones grandes), o como rutina periódica.
Agregá `backups/` a tu `.gitignore` — nunca subir dumps al repositorio.

---
## `db:restore`
```bash
npm run db:restore                                          # usa el backup más reciente
npm run db:restore -- backups/beer_house-2026-08-12.sql     # restaura uno específico
```

**Qué hace:** carga un archivo `.sql` de vuelta a la base de datos, sobrescribiendo los datos actuales.
**Cuándo usarlo:** para recuperarte de un desastre, o para clonar el estado de una DB (ej. bajar producción a tu entorno local).
**Sobrescribe todo lo que haya en la DB destino.** En producción exige `--force` y la variable `CONFIRM_RESTORE=yes`.

---
## `db:seed`
```bash
npm run db:seed
```
**Qué hace:** ejecuta `backend/seed.py` para poblar la base de datos con datos de prueba (usuarios demo, productos, etc).
**Cuándo usarlo:** después de un `db:install` o `db:reset`, cuando necesitás datos para trabajar en desarrollo sin crearlos a mano.
**Bloqueado en producción por defecto** — requiere `--force` explícito si de verdad querés sembrar datos ahí (poco recomendable).

---

## `db:reset`
```bash
npm run db:reset
npm run db:reset -- --seed          # además, puebla datos de prueba al final
```

**Qué hace:** el comando más destructivo del kit. Genera un backup automático, revierte todas las migraciones (`downgrade base`) y las vuelve a aplicar desde cero (`upgrade`), dejando las tablas vacías. Con `--seed`, además puebla datos de prueba al final.
**Cuándo usarlo:** cuando el esquema local se desincronizó y preferís empezar de cero, en vez de debuggear migración por migración.
**Máxima protección en producción:** requiere `--force` **y** la variable `CONFIRM_RESET=yes` al mismo tiempo. Sin ambas, se bloquea.

---
## `db:check`
```bash
npm run db:check
```

**Qué hace:** compara tus modelos de SQLAlchemy contra las migraciones existentes **sin generar ningún archivo** (`flask db check`, requiere Flask-Migrate ≥ 4.0). Falla si hay cambios en los modelos que todavía no tienen su migración correspondiente.
**Cuándo usarlo:** en pipelines de CI, como paso de validación antes de mergear un PR — evita que alguien suba un modelo modificado sin su migración.

---

## Reglas generales

- **Desarrollo local** → `db:migrate` para cambios de esquema, `db:seed` para datos de prueba, `db:reset` si todo se desincroniza.
- **Producción / CI** → solo `db:upgrade` (nunca genera nada, solo aplica lo commiteado) y `db:check` como validación previa.
- **Antes de cualquier operación destructiva** → corré `db:backup` a mano si no confiás en el backup automático de `db:reset`/`db:restore`.
- **Todos los comandos requieren** `backend/.env` configurado y el entorno virtual creado (`npm run backend:install` primero).