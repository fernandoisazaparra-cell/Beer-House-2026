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

// ASUME que existe backend/seed.py con la lógica de datos de
// prueba (usuarios, productos demo, etc). Ajusta la ruta si tu
// script de seed vive en otro lugar.
const seedScript = 'seed.py'

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Poblando la base de datos (seed)'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    if (!existsSync(path.join(backendDir, seedScript))) {
        fail(`No se encontró backend/${seedScript}.`, 'Crea el script de seed antes de continuar.')
    }

    // Guarda de seguridad: nunca sembrar datos falsos en producción
    // sin que alguien lo pida explícitamente.
    if (env.APP_ENV === 'production' && !process.argv.includes('--force')) {
        fail(
            'No se permite correr seed en producción por accidente.',
            'Si es intencional, corre: npm run db:seed -- --force'
        )
    }

    const steps = [{ status: 'pending', label: 'Ejecutando seed' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: python,
                    args: [seedScript],
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
        c.bold(c.green('¡Base de datos poblada!')),
        '',
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))