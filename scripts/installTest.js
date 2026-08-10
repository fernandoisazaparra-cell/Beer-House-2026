import { existsSync } from 'node:fs'
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
import { start } from 'node:repl'

// ============================================================
// CONFIGURACIÓN
// ============================================================
const rootDir = process.cwd()
const frontendDir = path.join(rootDir, 'frontend')
const packageJson = path.join(frontendDir, 'package.json')
const nodeModules = path.join(frontendDir, 'node_modules')

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Instalando dependencias del frontend'
    })

    const steps = [
        { status: 'pending', label: 'Verificando estructura del proyecto' },
        { status: 'pending', label: 'Verificando package.json' },
        { status: 'pending', label: 'Instalando dependencias' }
    ]

    let alreadyInstalled = false

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 30 },
            task: async () => {
                if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/')
            }
        },
        {
            percentage: { start: 30, end: 55 },
            task: async () => {
                if (!existsSync(packageJson)) fail('No se encontró frontend/package.json')
            }
        },
        {
            percentage: { start: 55, end: 100 },
            task: async () => {
                alreadyInstalled = existsSync(nodeModules)
                if (!alreadyInstalled) {
                    await runCommand({ command: 'npm', args: ['i'], cwd: frontendDir, silent: true })
                }
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)
    const depsLine = alreadyInstalled
        ? c.gray('Dependencias ya estaban instaladas')
        : c.gray('Dependencias instaladas correctamente')

    success([
        c.bold(c.green('¡Frontend listo!')),
        '',
        depsLine,
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run frontend:dev'))} para iniciar el entorno de desarrollo.`
    ])
}

main().catch((err) => fail(err.message))