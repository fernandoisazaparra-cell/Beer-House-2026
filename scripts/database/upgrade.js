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
const migrationsDir = path.join(backendDir, 'migrations')

// Este comando SOLO aplica migraciones ya existentes en el repo.
// NUNCA genera una migración nueva (eso es trabajo de db:migrate,
// en desarrollo). Es el comando seguro para correr en deploys de
// producción y en cualquier entorno que no sea tu máquina local.
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Aplicando migraciones existentes'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    if (!existsSync(migrationsDir)) {
        fail(
            'No se encontró backend/migrations/.',
            'No hay ninguna migración en el repo. Ejecuta primero: npm run db:install'
        )
    }

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    const steps = [{ status: 'pending', label: 'Aplicando migraciones (upgrade)' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: python,
                    args: ['-m', 'flask', '--app', 'run.py', 'db', 'upgrade'],
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
        c.bold(c.green('¡Migraciones aplicadas!')),
        '',
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run db:status'))} para verificar el estado actual.`
    ])
}

main().catch((err) => fail(err.message, err.details))