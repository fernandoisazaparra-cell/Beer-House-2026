import { existsSync, rmSync, readdirSync, statSync } from 'node:fs'
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
const backendDir = path.join(rootDir, 'backend')
const venvDir = path.join(backendDir, 'venv')

// Uso:
//   npm run backend:clean           (borra venv y __pycache__)
//   npm run backend:clean -- --env  (además borra backend/.env)
const removeEnv = process.argv.includes('--env')
const envFile = path.join(backendDir, '.env')

// Busca recursivamente carpetas __pycache__ y .pytest_cache
const findCacheDirs = (dir, found = []) => {
    if (!existsSync(dir)) return found

    for (const entry of readdirSync(dir)) {
        if (entry === 'venv' || entry === 'node_modules') continue

        const full = path.join(dir, entry)
        const stat = statSync(full)

        if (stat.isDirectory()) {
            if (entry === '__pycache__' || entry === '.pytest_cache') {
                found.push(full)
            } else {
                findCacheDirs(full, found)
            }
        }
    }

    return found
}

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Limpiando el backend'
    })

    if (!existsSync(backendDir)) fail('No se encontró la carpeta backend/.')

    const steps = [
        { status: 'pending', label: 'Eliminando entorno virtual' },
        { status: 'pending', label: 'Eliminando cachés de Python' },
        ...(removeEnv ? [{ status: 'pending', label: 'Eliminando .env' }] : [])
    ]

    await runSteps(steps, [
        {
            percentage: 50,
            task: async () => {
                if (existsSync(venvDir)) rmSync(venvDir, { recursive: true, force: true })
            }
        },
        {
            percentage: removeEnv ? 75 : 100,
            task: async () => {
                for (const dir of findCacheDirs(backendDir)) {
                    rmSync(dir, { recursive: true, force: true })
                }
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
        c.bold(c.green('¡Backend limpio!')),
        '',
        c.gray('venv y cachés de Python eliminados'),
        ...(removeEnv ? [c.gray('.env eliminado')] : []),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run backend:install'))} para reinstalar.`
    ])
}

main().catch((err) => fail(err.message, err.details))