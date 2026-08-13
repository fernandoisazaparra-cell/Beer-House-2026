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
    getVenvPython
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')

// Uso:
//   npm run backend:lint            (solo verifica, no modifica nada)
//   npm run backend:lint -- --fix   (corrige automáticamente lo que pueda)
const shouldFix = process.argv.includes('--fix')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: shouldFix ? 'Corrigiendo estilo de código (Ruff)' : 'Verificando estilo de código (Ruff)'
    })

    if (!existsSync(backendDir)) fail('No se encontró la carpeta backend/.')

    const python = getVenvPython(backendDir)

    if (!existsSync(python)) {
        fail(
            'No se encontró el entorno virtual.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const runRuff = (args) =>
        runCommand({
            command: python,
            args: ['-m', 'ruff', ...args],
            cwd: backendDir,
            silent: true,
            shell: false
        })

    const steps = [
        { status: 'pending', label: shouldFix ? 'Formateando código' : 'Verificando formato' },
        { status: 'pending', label: shouldFix ? 'Corrigiendo lint' : 'Corriendo lint' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 50 },
            task: async () => {
                try {
                    await runRuff(shouldFix ? ['format', '.'] : ['format', '--check', '.'])
                } catch {
                    fail(
                        'El código no cumple con el formato esperado.',
                        'Corre: npm run backend:lint -- --fix'
                    )
                }
            }
        },
        {
            percentage: { start: 50, end: 100 },
            task: async () => {
                try {
                    await runRuff(shouldFix ? ['check', '.', '--fix'] : ['check', '.'])
                } catch {
                    fail(
                        'Ruff encontró errores de lint.',
                        shouldFix
                            ? 'Algunos errores no se pueden corregir automáticamente, revísalos a mano.'
                            : 'Corre: npm run backend:lint -- --fix'
                    )
                }
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green(shouldFix ? '¡Código formateado y corregido!' : '¡Sin errores de lint ni formato!')),
        '',
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))