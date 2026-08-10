import { c, showHeader, runChecks, fail, success } from './shared/index.js'

const main = async () => {
    showHeader({ title: 'BEER HOUSE 2026', description: 'Validando frontend (prueba)' })

    const steps = [
        { status: 'pending', label: 'ESLint' },
        { status: 'pending', label: 'Prettier / formato' },
        { status: 'pending', label: 'TypeScript' }
    ]

    const failures = await runChecks(steps, [
        {
            percentage: 33,
            task: async () => {
                throw new Error('3 errores de lint en src/App.jsx')
            }
        },
        {
            percentage: 66,
            task: async () => {
                // este sí pasa
            }
        },
        {
            percentage: 100,
            task: async () => {
                throw new Error("Property 'foo' does not exist on type 'Bar'")
            }
        }
    ])

    if (failures.length > 0) {
        const lines = [c.red(`✗ ${failures.length} verificación(es) fallaron`), '']
        for (const f of failures) {
            lines.push(c.bold(c.red(f.label)) + ': ' + c.gray(f.message))
        }
        fail('El check no pasó', lines.slice(1).join('\n'))
        return
    }

    success([c.bold(c.green('✓ Todo pasó'))])
}

main()