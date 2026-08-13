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

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')

// Revisión objetivo: por defecto retrocede UN paso (-1).
// Uso: npm run db:downgrade -- -2   (retrocede 2 pasos)
//      npm run db:downgrade -- base (vuelve al estado inicial, vacío)
const target = process.argv[2] || '-1'

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: `Revirtiendo migración (${target})`
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    if (env.APP_ENV === 'production' && !process.argv.includes('--force')) {
        fail(
            'Revertir migraciones en producción es riesgoso.',
            'Si estás seguro, corre: npm run db:downgrade -- --force'
        )
    }

    const steps = [{ status: 'pending', label: `Aplicando downgrade (${target})` }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: python,
                    args: ['-m', 'flask', '--app', 'run.py', 'db', 'downgrade', target],
                    cwd: backendDir,
                    env: { ...process.env, ...env },
                    shell: false,
                    silent: true
                })
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Migración revertida!')),
        '',
        c.gray(`Objetivo: ${target}`),
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run db:status'))} para verificar el estado actual.`
    ])
}

main().catch((err) => fail(err.message, err.details))