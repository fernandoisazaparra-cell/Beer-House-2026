import {
    c,
    showHeader,
    runSteps,
    success
} from './shared/index.js'

// ============================================================
// DEMO: BARRA SIMULADA
// ------------------------------------------------------------
// Ejecuta:  node scripts/demo.js
//
// La barra llena hasta 44.44% y, como la tarea todavía no
// termina, se queda ahí esperando con el spinner activo.
// Cuando la tarea termina, llena hasta el porcentaje real.
// ============================================================

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async () => {
    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Demo: barra simulada (cap 44.44)'
    })

    const steps = [
        { status: 'pending', label: 'Conectando a la base de datos' },
        { status: 'pending', label: 'Ejecutando consulta' },
        { status: 'pending', label: 'Finalizando' }
    ]

    await runSteps(steps, [
        {
            percentage: { start: 25, end: 50 },
            cap: 44.44,
            task: async () => {
                await wait(3500)
            }
        },
        {
            percentage: { start: 50, end: 80 },
            task: async () => {
                await wait(1500)
            }
        },
        {
            percentage: { start: 80, end: 100 },
            task: async () => {
                await wait(1000)
            }
        }
    ])

    success([
        c.bold(c.green('¡Demo completada!')),
        '',
        c.gray('La barra se detuvo en 44.44% esperando a la tarea'),
        c.gray('y luego completó hasta el 100%.')
    ])
}

main().catch((err) => fail(err.message))
