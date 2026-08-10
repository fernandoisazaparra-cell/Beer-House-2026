import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    runCommandCapture,
    fail,
    success,
    formatDuration,
    satisfiesRange
} from '../shared/index.js'

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
        { status: 'pending', label: 'Verificando versión de Node.js' },
        { status: 'pending', label: 'Verificando npm' },
        { status: 'pending', label: 'Instalando dependencias' }
    ]

    // Se llena en el paso 2 y lo reutilizan los pasos 3 y 5
    // (evita leer/parsear el package.json más de una vez)
    let pkg = null
    let npmVersion = null
    let alreadyInstalled = false

    await runSteps(steps, [
        {
            percentage: 15,
            task: async () => {
                if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/')
            }
        },
        {
            percentage: 30,
            task: async () => {
                if (!existsSync(packageJson)) fail('No se encontró frontend/package.json')

                try {
                    pkg = JSON.parse(readFileSync(packageJson, 'utf8'))
                } catch {
                    fail('frontend/package.json no es un JSON válido')
                }
            }
        },
        {
            percentage: 50,
            task: async () => {
                const required = pkg.engines?.node

                // Si el proyecto no especifica engines.node, no bloquea.
                if (!required) return

                const currentVersion = process.version

                if (!satisfiesRange(currentVersion, required)) {
                    fail(
                        'Versión de Node.js incompatible con el proyecto.',
                        `Requerida: ${required}\nInstalada: ${currentVersion}`
                    )
                }
            }
        },
        {
            percentage: 65,
            task: async () => {
                try {
                    npmVersion = await runCommandCapture({ command: 'npm', args: ['--version'] })
                } catch {
                    fail(
                        'No se encontró npm.',
                        'npm viene incluido con Node.js — reinstala Node.js desde nodejs.org'
                    )
                }
            }
        },
        {
            // Mientras "npm i" corre se ve 80% (no 100%, sigue instalando)
            percentage: { start: 80, end: 100 },
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
        c.gray(`Node.js: ${process.version}   npm: ${npmVersion}`),
        depsLine,
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run frontend:dev'))} para iniciar el entorno de desarrollo.`
    ])
}

main().catch((err) => fail(err.message, err.details))