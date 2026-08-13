|-------------------------------------------|---------------|-----------------------------------------------|
| **Fontend**                               | Categoría     | Descripción rápida                            |
|-------------------------------------------|---------------|-----------------------------------------------|
| [`frontend:install`](#-frontendinstall)   | Setup         | Instalación inicial de dependencias           |
| [`frontend:dev`](#-frontenddev)           | Desarrollo    | Levanta el servidor de desarrollo             |
| [`frontend:build`](#-frontendbuild)       | Deploy        | Genera el build de producción                 |
| [`frontend:lint`](#-frontendlint)         | Calidad       | Verifica estilo de código                     |
| [`frontend:clean`](#-frontendclean)       | Mantenimiento | Borra `node_modules` y `build`                |
|-------------------------------------------|---------------|-----------------------------------------------|
| **Database**                              | Categoría     | Descripción rápida                            |
|-------------------------------------------|---------------|-----------------------------------------------|
| [`db:install`](#-dbinstall)               | Setup         | Instalación inicial completa                  |
| [`db:migrate`](#-dbmigrate)               | Desarrollo    | Genera y aplica una migración nueva           |
| [`db:upgrade`](#-dbupgrade)               | Deploy        | Aplica migraciones ya existentes              |
| [`db:status`](#-dbstatus)                 | Inspección    | Muestra el estado actual de la DB             |
| [`db:history`](#-dbhistory)               | Inspección    | Historial completo de migraciones             |
| [`db:downgrade`](#-dbdowngrade)           | Desarrollo    | Revierte la última migración                  |
| [`db:backup`](#-dbbackup)                 | Mantenimiento | Genera un dump `.sql`                         |
| [`db:restore`](#-dbrestore)               | Mantenimiento | Restaura un dump `.sql`                       |
| [`db:seed`](#-dbseed)                     | Desarrollo    | Puebla la DB con datos de prueba              |
| [`db:reset`](#-dbreset)                   | Desarrollo    | Vacía y reconstruye todas las tablas          |
| [`db:check`](#-dbcheck)                   | CI            | Verifica que modelos y migraciones coincidan  |
|-------------------------------------------|---------------|-----------------------------------------------|
|-------------------------------------------|---------------|-----------------------------------------------|
| **Backend**                               | Categoría     | Descripción rápida                            |
|-------------------------------------------|---------------|-----------------------------------------------|
| [`backend:install`](#-backendinstall)     | Setup         | Instala Python, venv y dependencias           |
| [`backend:dev`](#-backenddev)             | Desarrollo    | Levanta el servidor con debug/hot-reload      |
| [`backend:start`](#-backendstart)         | Deploy        | Levanta el servidor con Waitress (producción) |
| [`backend:lint`](#-backendlint)           | Calidad       | Verifica/corrige estilo de código con Ruff    |
| [`backend:test`](#-backendtest)           | Calidad       | Corre los tests con pytest                    |
| [`backend:clean`](#-backendclean)         | Mantenimiento | Borra `venv` y cachés de Python               |
|-------------------------------------------|---------------|-----------------------------------------------|