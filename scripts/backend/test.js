import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration,
    getVenvPython,
    parseEnvFile
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Corriendo tests del backend'
    })

    if (!existsSync(backendDir)) fail('No se encontró la carpeta backend/.')

    const python = getVenvPython(backendDir)

    if (!existsSync(python)) {
        fail(
            'No se encontró el entorno virtual.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const env = existsSync(envFile) ? parseEnvFile(envFile) : {}

    const steps = [{ status: 'pending', label: 'Corriendo tests (pytest)' }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                try {
                    await runCommand({
                        command: python,
                        args: ['-m', 'pytest'],
                        cwd: backendDir,
                        env: { ...process.env, ...env },
                        silent: true,
                        shell: false
                    })
                } catch (err) {
                    fail(
                        'Los tests fallaron, o pytest no está instalado.',
                        'Si no lo tienes: agrega "pytest" a backend/requirements.txt ' +
                        'y corre npm run backend:install.'
                    )
                }
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Tests pasados!')),
        '',
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))