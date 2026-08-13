import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runCommand,
    fail,
    getVenvPython,
    parseEnvFile
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')

// Proceso de larga duración, sin barra de progreso (igual que
// frontend:dev): el servidor corre hasta que lo cortás con Ctrl+C.
const main = async () => {
    if (!existsSync(backendDir)) fail('No se encontró la carpeta backend/.')

    const python = getVenvPython(backendDir)

    if (!existsSync(python)) {
        fail(
            'No se encontró el entorno virtual.',
            'Ejecuta primero: npm run backend:install'
        )
    }

    const env = existsSync(envFile) ? parseEnvFile(envFile) : {}

    // Se ejecuta run.py directamente, que ya tiene debug=True.
    // Esto SOLO debe usarse en desarrollo — ver backend:start
    // para el modo apto para producción.
    await runCommand({
        command: python,
        args: ['run.py'],
        cwd: backendDir,
        env: { ...process.env, ...env },
        silent: false,
        shell: false
    })
}

main().catch((err) => fail(err.message, err.details))