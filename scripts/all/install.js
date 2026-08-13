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
        { status: 'pending', label: 'Instalando backend' },
        { status: 'pending', label: 'Instalando database' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 30 },
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
            percentage: { start: 30, end: 80 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'backend:install'],
                    cwd: rootDir,
                    silent: true
                })
            }
        },
        {
            percentage: { start: 80, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'db:install'],
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
        `Ejecuta ${c.bold(c.amber('npm run all:dev'))} para arrancar el proyecto.`
    ])
}

main().catch((err) => fail(err.message, err.details))