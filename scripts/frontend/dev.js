import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    runCommand,
    fail
} from '../shared/index.js'

const rootDir = process.cwd()
const frontendDir = path.join(rootDir, 'frontend')
const nodeModulesDir = path.join(frontendDir, 'node_modules')

// Este comando NO usa runSteps ni barra de progreso: el servidor
// de desarrollo de CRA (webpack-dev-server) corre indefinidamente
// hasta que lo cortás con Ctrl+C, no tiene un "final" que animar.
const main = async () => {
    if (!existsSync(frontendDir)) fail('No se encontró la carpeta frontend/.')

    if (!existsSync(nodeModulesDir)) {
        fail(
            'No se encontraron dependencias instaladas.',
            'Ejecuta primero: npm run frontend:install'
        )
    }

    // silent: false -> se muestra en vivo el output de CRA
    // (URL local, warnings de compilación, hot reload, etc)
    await runCommand({
        command: 'npm',
        args: ['start'],
        cwd: frontendDir,
        silent: false,
        shell: false
    })
}

main().catch((err) => fail(err.message, err.details))