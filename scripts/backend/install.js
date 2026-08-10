import { existsSync, copyFileSync, readFileSync } from 'node:fs'
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
const backendDir = path.join(rootDir, 'backend')
const requirementsFile = path.join(backendDir, 'requirements.txt')
const venvDir = path.join(backendDir, 'venv')
const envExample = path.join(backendDir, '.env.example')
const envFile = path.join(backendDir, '.env')

// Archivo opcional (convención de pyenv) para declarar la versión
// mínima de Python requerida por el proyecto, ej: ">=3.10".
// Se acepta "python-version" y ".python-version".
const pythonVersionFile = path.join(backendDir, 'python-version')
const pythonVersionFileAlt = path.join(backendDir, '.python-version')

const resolvePythonVersionFile = () => {
    if (existsSync(pythonVersionFile)) return pythonVersionFile
    if (existsSync(pythonVersionFileAlt)) return pythonVersionFileAlt
    return null
}

const isWindows = process.platform === 'win32'

const venvPython = isWindows
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python')

// Prueba binarios de Python del sistema en orden hasta encontrar uno
const findSystemPython = async () => {
    const candidates = isWindows ? ['python', 'py'] : ['python3', 'python']

    for (const bin of candidates) {
        try {
            const raw = await runCommandCapture({ command: bin, args: ['--version'] })
            // "Python 3.12.3" -> "3.12.3"
            const version = raw.replace(/^Python\s+/i, '').trim()
            return { bin, version }
        } catch {
            continue
        }
    }
    return null
}

// ============================================================
// MAIN
// ============================================================
const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Instalando dependencias del backend'
    })

    const steps = [
        { status: 'pending', label: 'Verificando Python' },
        { status: 'pending', label: 'Verificando estructura del backend' },
        { status: 'pending', label: 'Preparando entorno virtual' },
        { status: 'pending', label: 'Instalando dependencias (pip)' }
    ]

    let pythonInfo = null
    let venvCreated = false

    await runSteps(steps, [
        {
            percentage: 20,
            task: async () => {
                pythonInfo = await findSystemPython()
                if (!pythonInfo) {
                    fail(
                        'No se encontró Python instalado.',
                        isWindows
                            ? 'Instálalo desde python.org y agrégalo al PATH.'
                            : 'Instálalo con tu gestor de paquetes (ej. "apt install python3").'
                    )
                }

                // Chequeo opcional: si existe python-version / .python-version,
                // valida contra la versión mínima requerida por el proyecto.
                const versionFile = resolvePythonVersionFile()

                if (versionFile) {
                    const required = readFileSync(versionFile, 'utf8').trim()

                    if (required && !satisfiesRange(pythonInfo.version, required)) {
                        fail(
                            'Versión de Python incompatible con el proyecto.',
                            `Requerida: ${required}\nInstalada: ${pythonInfo.version}`
                        )
                    }
                }
            }
        },
        {
            percentage: 40,
            task: async () => {
                if (!existsSync(backendDir)) fail('No se encontró la carpeta backend/.')
                if (!existsSync(requirementsFile)) fail('No se encontró backend/requirements.txt')
            }
        },
        {
            percentage: 60,
            task: async () => {
                if (existsSync(venvPython)) return

                venvCreated = true
                await runCommand({
                    command: pythonInfo.bin,
                    args: ['-m', 'venv', 'venv'],
                    cwd: backendDir,
                    silent: true,
                    shell: false
                })
            }
        },
        {
            // Mientras pip instala se ve 80% (no 100%, sigue trabajando)
            percentage: { start: 80, end: 100 },
            task: async () => {
                await runCommand({
                    command: venvPython,
                    args: ['-m', 'pip', 'install', '-r', 'requirements.txt'],
                    cwd: backendDir,
                    silent: true,
                    shell: false
                })
            }
        }
    ])

    // Copiar .env.example -> .env si falta (no bloqueante)
    let envCreated = false
    if (!existsSync(envFile) && existsSync(envExample)) {
        copyFileSync(envExample, envFile)
        envCreated = true
    }

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Backend listo!')),
        '',
        c.gray(`Python ${pythonInfo.version}`),
        c.gray(venvCreated ? 'Entorno virtual creado' : 'Entorno virtual ya existía'),
        c.gray('Dependencias instaladas correctamente'),
        ...(envCreated ? [c.gray('Se generó backend/.env a partir de .env.example')] : []),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run backend:start'))} para iniciar el servidor.`
    ])
}

main().catch((err) => fail(err.message, err.details))