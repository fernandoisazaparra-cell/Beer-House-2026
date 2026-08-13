import { existsSync, readFileSync } from 'node:fs'
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

const rootDir = process.cwd()
const frontendDir = path.join(rootDir, 'frontend')
const packageJsonFile = path.join(frontendDir, 'package.json')
const nodeModulesDir = path.join(frontendDir, 'node_modules')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Verificando estilo de código (lint)'
    })

    if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/.')

    if (!existsSync(nodeModulesDir)) {
        fail(
            'No se encontraron dependencias instaladas.',
            'Ejecuta primero: npm run frontend:install'
        )
    }

    const pkg = JSON.parse(readFileSync(packageJsonFile, 'utf8'))

    if (!pkg.scripts || !pkg.scripts.lint) {
        fail(
            'No hay un script "lint" definido en frontend/package.json.',
            'Agrega algo como: "lint": "eslint src --ext .js,.jsx"'
        )
    }

    const steps = [{ status: 'pending', label: 'Corriendo eslint' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'lint'],
                    cwd: frontendDir,
                    silent: true,
                    shell: false
                })
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Sin errores de lint!')),
        '',
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))