import { existsSync, copyFileSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration,
    satisfiesRange
} from '../shared/index.js'

const rootDir = process.cwd()
const frontendDir = path.join(rootDir, 'frontend')
const packageJsonFile = path.join(frontendDir, 'package.json')
const nodeModulesDir = path.join(frontendDir, 'node_modules')
const envExample = path.join(frontendDir, '.env.example')
const envFile = path.join(frontendDir, '.env')

// Archivo opcional para declarar la versión mínima de Node
// requerida por el proyecto, ej: ">=18.0.0". Se acepta ambos nombres.
const nodeVersionFile = path.join(frontendDir, 'node-version')
const nodeVersionFileAlt = path.join(frontendDir, '.nvmrc')

const resolveNodeVersionFile = () => {
    if (existsSync(nodeVersionFile)) return nodeVersionFile
    if (existsSync(nodeVersionFileAlt)) return nodeVersionFileAlt
    return null
}

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Instalando dependencias del frontend'
    })

    const currentNodeVersion = process.version.replace(/^v/, '')

    const steps = [
        { status: 'pending', label: 'Verificando estructura del frontend' },
        { status: 'pending', label: 'Verificando versión de Node' },
        { status: 'pending', label: 'Instalando dependencias (npm)' }
    ]

    let envCreated = false

    await runSteps(steps, [
        {
            percentage: 20,
            task: async () => {
                if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/.')
                if (!existsSync(packageJsonFile)) fail('No se encontró frontend/package.json')
            }
        },
        {
            percentage: 35,
            task: async () => {
                const versionFile = resolveNodeVersionFile()

                if (versionFile) {
                    const required = readFileSync(versionFile, 'utf8').trim()

                    if (required && !satisfiesRange(currentNodeVersion, required)) {
                        fail(
                            'Versión de Node incompatible con el proyecto.',
                            `Requerida: ${required}\nInstalada: ${currentNodeVersion}`
                        )
                    }
                }
            }
        },
        {
            // Mientras npm instala se ve 90% (no 100%, sigue trabajando)
            percentage: { start: 35, end: 90 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['install'],
                    cwd: frontendDir,
                    silent: true,
                    shell: false
                })
            }
        }
    ])

    // Copiar .env.example -> .env si falta (no bloqueante)
    if (!existsSync(envFile) && existsSync(envExample)) {
        copyFileSync(envExample, envFile)
        envCreated = true
    }

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Frontend listo!')),
        '',
        c.gray(`Node ${currentNodeVersion}`),
        c.gray(existsSync(nodeModulesDir) ? 'Dependencias instaladas correctamente' : 'Dependencias instaladas'),
        ...(envCreated ? [c.gray('Se generó frontend/.env a partir de .env.example')] : []),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run frontend:dev'))} para iniciar el servidor de desarrollo.`
    ])
}

main().catch((err) => fail(err.message, err.details))