import { spawn } from 'node:child_process'
import path from 'node:path'
import { c, showHeader, fail, success } from '../shared/index.js'

const rootDir = process.cwd()

const main = async () => {
    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'iniciando frontend y backend en paralelo'
    })

    console.log(c.cyan('Lanzando servicios...\n'))

    // Lanzamos ambos procesos en paralelo usando spawn
    // (salida en pipe para que los logs no corten los mensajes del script)
    const frontend = spawn('npm run frontend:dev', { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'], shell: true })
    const backend = spawn('npm run backend:dev', { cwd: rootDir, stdio: ['ignore', 'pipe', 'pipe'], shell: true })

    success([
        c.bold(c.green('¡Entorno de desarrollo activo!')),
        '',
        c.gray('Frontend y backend corriendo en paralelo'),
        '',
        `Presiona ${c.bold(c.amber('ctrl + c'))} para apagar ambos servidores.`
    ])

    // Recién después de la caja de éxito volcamos los logs en vivo
    frontend.stdout.pipe(process.stdout)
    frontend.stderr.pipe(process.stdout)
    backend.stdout.pipe(process.stdout)
    backend.stderr.pipe(process.stdout)

    // Manejar el cierre limpio si el usuario presiona Ctrl + C
    process.on('SIGINT', () => {
        frontend.kill()
        backend.kill()
        process.exit(0)
    })
}

main().catch((err) => fail(err.message, err.details))
