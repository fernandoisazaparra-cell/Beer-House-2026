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

    if (!existsSync(backendDir)) {
        fail('No se encontró la carpeta backend/.')
    }

    const python = getVenvPython(backendDir)

    if (!existsSync(python)) {
        fail(
            'No se encontró el entorno virtual.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const env = existsSync(envFile)
        ? parseEnvFile(envFile)
        : {}

    // Argumentos opcionales después de "--"
    const testArgs = process.argv.slice(2)

    const steps = [
        {
            status: 'pending',
            label: testArgs.length
                ? `Corriendo tests: ${testArgs.join(' ')}`
                : 'Corriendo todos los tests (pytest)'
        }
    ]

    let output = ''

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },

            task: async () => {
                try {
                    const result = await runCommand({
                        command: python,
                        args: [
                            '-m',
                            'pytest',
                            ...testArgs
                        ],
                        cwd: backendDir,
                        env: {
                            ...process.env,
                            ...env
                        },
                        silent: true,
                        shell: false
                    })

                    output = result.stdout ?? ''
                } catch (err) {
                    console.error(err)

                    fail(
                        'Los tests fallaron.',
                        err.message
                    )
                }
            }
        }
    ])

    // =========================
    // RESULTADOS DE PYTEST
    // =========================

    const passedMatch = output.match(/(\d+) passed/)
    const failedMatch = output.match(/(\d+) failed/)
    const skippedMatch = output.match(/(\d+) skipped/)

    const passed = passedMatch
        ? Number(passedMatch[1])
        : 0

    const failed = failedMatch
        ? Number(failedMatch[1])
        : 0

    const skipped = skippedMatch
        ? Number(skippedMatch[1])
        : 0

    const elapsed = formatDuration(
        Date.now() - startedAt
    )

    success([
        c.bold(c.green('¡Tests pasados!')),
        '',
        c.green(`Tests pasados: ${passed}`),
        c.gray(`Tests fallidos: ${failed}`),
        c.gray(`Tests omitidos: ${skipped}`),
        '',
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => {
    fail(err.message, err.details)
})