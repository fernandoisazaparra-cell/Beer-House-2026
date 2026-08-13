import { spawn } from 'node:child_process'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration
} from '../shared/index.js'

const rootDir = process.cwd()

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Preparando el entorno del proyecto'
    })

    // Paso 1: Único paso de instalación con la barra de progreso limpia
    const steps = [
        { status: 'pending', label: 'Instalando dependencias y configurando base de datos' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'npm',
                    args: ['run', 'all:install'],
                    cwd: rootDir,
                    silent: true // Mantenemos oculto para que la barra de progreso luzca impecable
                })
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    // Mensaje de éxito limpio antes de saltar a los servidores
    success([
        c.bold(c.green('¡Instalación completada con éxito!')),
        c.gray(`Tiempo de configuración: ${elapsed}`),
        '',
        c.cyan('Iniciando servidores de desarrollo (Frontend y Backend)...\n'),
        c.gray('Nota: Los logs de Flask y Vite aparecerán a continuación. Presiona Ctrl + C para salir.\n')
    ])

    // Paso 2: Lanzamos los servidores en paralelo de forma totalmente limpia (sin barra de carga estorbando)
    const devProcess = spawn('npm', ['run', 'all:dev'], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
    })

    devProcess.on('error', (err) => {
        fail('Error al iniciar los servidores de desarrollo', err.message)
    })
}

main().catch((err) => fail(err.message, err.details))