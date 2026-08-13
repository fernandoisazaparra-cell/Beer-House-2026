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
        description: 'Historial de migraciones'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    let historyOutput = ''

    try {
        historyOutput = await runCommandCapture({
            command: python,
            args: ['-m', 'flask', '--app', 'run.py', 'db', 'history'],
            cwd: backendDir,
            env: { ...process.env, ...env },
            shell: false
        })
    } catch (err) {
        fail('No se pudo obtener el historial.', err.message)
    }

    console.log('')
    console.log(historyOutput.trim() || c.gray('(sin migraciones registradas)'))
    console.log('')

    success([c.bold(c.green('Historial mostrado arriba')), c.gray(`Database: ${env.DB_NAME}`)])
}

main().catch((err) => fail(err.message, err.details))