import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration
} from '../shared/index.js'

// ============================================================
// CONFIGURACIÓN
// ============================================================
const rootDir = process.cwd()

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Instalando frontend y backend'
    })

    const steps = [
        { status: 'pending', label: 'Instalando frontend' },
        { status: 'pending', label: 'Instalando backend' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 50 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'frontend:install'],
                    cwd: rootDir,
                    silent: true
                })
            }
        },
        {
            percentage: { start: 50, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'backend:install'],
                    cwd: rootDir,
                    silent: true
                })
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Proyecto listo!')),
        '',
        c.gray('Frontend y backend instalados correctamente'),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run frontend:dev'))} y ${c.bold(c.amber('npm run backend:start'))} para arrancar el proyecto.`
    ])
}

main().catch((err) => fail(err.message, err.details))