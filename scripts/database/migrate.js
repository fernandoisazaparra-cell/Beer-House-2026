import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration,
    parseEnvFile,
    getVenvPython
} from '../shared/index.js'

// ============================================================
// CONFIGURACIÓN
// ============================================================
const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')
const migrationsDir = path.join(backendDir, 'migrations')

// Mensaje de la migración, se puede pasar por CLI:
// npm run db:migrate -- "agregar columna phone a users"
const migrationMessage =
    process.argv.slice(2).join(' ') || `auto migration ${new Date().toISOString()}`

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Migrando y actualizando la base de datos'
    })

    if (!existsSync(envFile)) {
        fail(
            'No se encontró backend/.env.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) {
        fail(
            'No se encontró el entorno virtual.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const runFlask = (args) =>
        runCommand({
            command: python,
            args: ['-m', 'flask', '--app', 'run.py', ...args],
            cwd: backendDir,
            env: { ...process.env, ...env },
            shell: false,
            silent: true
        })

    const migrationsExist = existsSync(migrationsDir)

    if (!migrationsExist) {
        fail(
            'No se encontró backend/migrations/.',
            'Ejecuta primero: npm run db:install'
        )
    }

    const steps = [
        { status: 'pending', label: 'Generando migración' },
        { status: 'pending', label: 'Aplicando migración (upgrade)' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 50 },
            task: async () => {
                await runFlask(['db', 'migrate', '-m', migrationMessage])
            }
        },
        {
            percentage: { start: 50, end: 100 },
            task: async () => {
                await runFlask(['db', 'upgrade'])
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Base de datos actualizada!')),
        '',
        c.gray(`Migración: "${migrationMessage}"`),
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run backend:start'))} para iniciar el servidor.`
    ])
}

main().catch((err) => fail(err.message, err.details))