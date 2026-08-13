import { existsSync, statSync } from 'node:fs'
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
const nodeModulesDir = path.join(frontendDir, 'node_modules')
const buildDir = path.join(frontendDir, 'build')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Generando build de producción'
    })

    if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/.')

    if (!existsSync(nodeModulesDir)) {
        fail(
            'No se encontraron dependencias instaladas.',
            'Ejecuta primero: npm run frontend:install'
        )
    }

    const steps = [{ status: 'pending', label: 'Compilando (react-scripts build)' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'build'],
                    cwd: frontendDir,
                    env: { ...process.env, CI: 'true' }, // evita prompts interactivos en CI
                    silent: true,
                    shell: false
                })
            }
        }
    ])

    if (!existsSync(buildDir)) {
        fail('El build terminó pero no se generó la carpeta frontend/build.')
    }

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Build generado!')),
        '',
        c.gray(`Carpeta: ${path.relative(rootDir, buildDir)}`),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        c.gray('Ese contenido es el que se sirve en producción (Nginx, S3, etc).')
    ])
}

main().catch((err) => fail(err.message, err.details))