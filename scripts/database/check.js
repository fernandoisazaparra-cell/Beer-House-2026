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

// Requiere Flask-Migrate >= 4.0 (usa "flask db check", que envuelve
// el comando "check" de Alembic: compara modelos vs migraciones
// SIN generar ningún archivo nuevo). Pensado para correr en CI.
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Verificando modelos vs migraciones'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    const steps = [{ status: 'pending', label: 'Comparando modelos con migraciones' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                try {
                    await runCommand({
                        command: python,
                        args: ['-m', 'flask', '--app', 'run.py', 'db', 'check'],
                        cwd: backendDir,
                        env: { ...process.env, ...env },
                        shell: false,
                        silent: true
                    })
                } catch (err) {
                    fail(
                        'Hay cambios en los modelos sin migración generada.',
                        'Corre: npm run db:migrate -- "mensaje descriptivo"'
                    )
                }
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Todo sincronizado!')),
        '',
        c.gray('Los modelos coinciden con las migraciones existentes'),
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))