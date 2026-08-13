import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runCommand,
    runCommandCapture,
    fail,
    getVenvPython,
    parseEnvFile
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')

// Verifica si el paquete "waitress" está disponible en el venv.
// Waitress es un servidor WSGI simple, multiplataforma (funciona
// igual en Windows/Linux/Mac), a diferencia de Gunicorn que no
// corre en Windows.
const hasWaitress = async (python) => {
    try {
        await runCommandCapture({
            command: python,
            args: ['-c', 'import waitress'],
            cwd: backendDir
        })
        return true
    } catch {
        return false
    }
}

const main = async () => {
    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Iniciando servidor (producción)'
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
    const port = env.PORT || '8000'

    const usingWaitress = await hasWaitress(python)

    if (!usingWaitress) {
        fail(
            'No se encontró "waitress" instalado en el entorno virtual.',
            'Este comando NO debe correr con el servidor de desarrollo de Flask ' +
            '(app.run/debug=True) en producción — es inseguro y no soporta ' +
            'tráfico real.\n\n' +
            'Instala un servidor WSGI de producción:\n' +
            '  1) Agrega "waitress" a backend/requirements.txt\n' +
            '  2) Corre: npm run backend:install\n' +
            '  3) Vuelve a correr: npm run backend:start'
        )
    }

    console.log(c.gray(`Sirviendo en el puerto ${port}. Presiona Ctrl+C para detener.\n`))

    // waitress-serve necesita el objeto "app" expuesto en run.py.
    // Ver el bloque "Cambio necesario en run.py" del README.
    await runCommand({
        command: python,
        args: ['-m', 'waitress', `--port=${port}`, 'run:app'],
        cwd: backendDir,
        env: { ...process.env, ...env },
        silent: false,
        shell: false
    })
}

main().catch((err) => fail(err.message, err.details))