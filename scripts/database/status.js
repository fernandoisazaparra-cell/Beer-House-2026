import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runCommandCapture,
    fail,
    success,
    parseEnvFile,
    getVenvPython
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')

const main = async () => {
    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Estado de la base de datos'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    const runFlask = (args) =>
        runCommandCapture({
            command: python,
            args: ['-m', 'flask', '--app', 'run.py', ...args],
            cwd: backendDir,
            env: { ...process.env, ...env },
            shell: false
        })

    let current = ''
    let heads = ''

    try {
        current = (await runFlask(['db', 'current'])).trim()
    } catch {
        current = '(sin migraciones aplicadas)'
    }

    try {
        heads = (await runFlask(['db', 'heads'])).trim()
    } catch {
        heads = '(desconocido)'
    }

    const upToDate = current && heads && current.split(' ')[0] === heads.split(' ')[0]

    success([
        c.bold(c.green('Estado de la base de datos')),
        '',
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Host: ${env.DB_HOST}:${env.DB_PORT}`),
        '',
        c.gray(`Versión actual: ${current || '(ninguna)'}`),
        c.gray(`Última migración disponible: ${heads || '(ninguna)'}`),
        '',
        upToDate
            ? c.bold(c.green('✓ Al día, no hay migraciones pendientes'))
            : c.bold(c.amber('⚠ Hay migraciones sin aplicar, corre: npm run db:migrate'))
    ])
}

main().catch((err) => fail(err.message, err.details))