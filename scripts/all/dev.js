import { spawn } from 'node:child_process'
import path from 'node:path'
import { c, showHeader, fail, success, formatDuration } from '../shared/index.js'

const rootDir = process.cwd()

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'iniciando frontend y backend en paralelo'
    })

    console.log(c.cyan('🚀 Lanzando servicios...\n'))

    // Lanzamos ambos procesos en paralelo usando spawn
    const frontend = spawn('npm', ['run', 'frontend:dev'], { cwd: rootDir, stdio: 'inherit', shell: true })
    const backend = spawn('npm', ['run', 'backend:dev'], { cwd: rootDir, stdio: 'inherit', shell: true })

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Entorno de desarrollo activo!')),
        '',
        c.gray('Frontend y backend corriendo en paralelo'),
        c.gray(`Tiempo de inicialización: ${elapsed}`),
        '',
        `Presiona ${c.bold(c.amber('ctrl + c'))} para apagar ambos servidores.`
    ])

    // Manejar el cierre limpio si el usuario presiona Ctrl + C
    process.on('SIGINT', () => {
        frontend.kill()
        backend.kill()
        process.exit(0)
    })
}

main().catch((err) => fail(err.message, err.details))