import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    fail,
    success,
    formatDuration
} from '../shared/index.js'

const rootDir = process.cwd()
const frontendDir = path.join(rootDir, 'frontend')
const nodeModulesDir = path.join(frontendDir, 'node_modules')
const buildDir = path.join(frontendDir, 'build')

// Uso:
//   npm run frontend:clean            (borra node_modules y build)
//   npm run frontend:clean -- --env   (además borra frontend/.env)
const removeEnv = process.argv.includes('--env')
const envFile = path.join(frontendDir, '.env')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Limpiando el frontend'
    })

    if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/.')

    const steps = [
        { status: 'pending', label: 'Eliminando node_modules' },
        { status: 'pending', label: 'Eliminando build' },
        ...(removeEnv ? [{ status: 'pending', label: 'Eliminando .env' }] : [])
    ]

    await runSteps(steps, [
        {
            percentage: 50,
            task: async () => {
                if (existsSync(nodeModulesDir)) rmSync(nodeModulesDir, { recursive: true, force: true })
            }
        },
        {
            percentage: removeEnv ? 75 : 100,
            task: async () => {
                if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true })
            }
        },
        ...(removeEnv
            ? [
                {
                    percentage: 100,
                    task: async () => {
                        if (existsSync(envFile)) rmSync(envFile, { force: true })
                    }
                }
            ]
            : [])
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Frontend limpio!')),
        '',
        c.gray('node_modules y build eliminados'),
        ...(removeEnv ? [c.gray('.env eliminado')] : []),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run frontend:install'))} para reinstalar.`
    ])
}

main().catch((err) => fail(err.message, err.details))