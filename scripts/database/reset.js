import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration,
    parseEnvFile,
    getVenvPython
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')
const backupsDir = path.join(rootDir, 'backups')

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const runSeed = process.argv.includes('--seed')

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Reseteando la base de datos'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)
    const python = getVenvPython(backendDir)

    if (!existsSync(python)) fail('No se encontró el entorno virtual.', 'Ejecuta primero: npm run backend:install')

    // ========================================================
    // GUARDA DE SEGURIDAD — esto borra y recrea TODAS las tablas.
    // En producción exige --force explícito Y la variable de
    // entorno CONFIRM_RESET=yes, para que sea imposible ejecutarlo
    // sin querer con un simple "npm run db:reset".
    // ========================================================
    if (env.APP_ENV === 'production') {
        const forced = process.argv.includes('--force')
        const confirmed = process.env.CONFIRM_RESET === 'yes'

        if (!forced || !confirmed) {
            fail(
                'BLOQUEADO: este comando borra todas las tablas de producción.',
                'Requiere: CONFIRM_RESET=yes npm run db:reset -- --force'
            )
        }
    }

    const runFlask = (args) =>
        runCommand({
            command: python,
            args: ['-m', 'flask', '--app', 'run.py', ...args],
            cwd: backendDir,
            env: { ...process.env, ...env },
            shell: false,
            silent: true
        })

    const steps = [
        { status: 'pending', label: 'Backup de seguridad' },
        { status: 'pending', label: 'Revirtiendo todas las migraciones' },
        { status: 'pending', label: 'Reaplicando migraciones' },
        ...(runSeed ? [{ status: 'pending', label: 'Sembrando datos' }] : [])
    ]

    await runSteps(steps, [
        // Backup automático SIEMPRE antes de un reset, sin excepción.
        {
            percentage: { start: 0, end: 25 },
            task: async () => {
                if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true })

                const outputFile = path.join(backupsDir, `${env.DB_NAME}-pre-reset-${timestamp}.sql`)

                await runCommand({
                    command: 'mysqldump',
                    args: [
                        '-h', env.DB_HOST,
                        '-P', String(env.DB_PORT),
                        '-u', env.DB_USER,
                        '--result-file', outputFile,
                        env.DB_NAME
                    ],
                    cwd: rootDir,
                    env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD },
                    shell: false,
                    silent: true
                })
            }
        },
        // Vuelve al estado vacío usando los downgrade() de Alembic
        // (no borra la base de datos en sí, solo las tablas).
        {
            percentage: { start: 25, end: 60 },
            task: async () => {
                await runFlask(['db', 'downgrade', 'base'])
            }
        },
        {
            percentage: { start: 60, end: runSeed ? 85 : 100 },
            task: async () => {
                await runFlask(['db', 'upgrade'])
            }
        },
        ...(runSeed
            ? [
                {
                    percentage: { start: 85, end: 100 },
                    task: async () => {
                        await runCommand({
                            command: python,
                            args: ['seed.py'],
                            cwd: backendDir,
                            env: { ...process.env, ...env },
                            shell: false,
                            silent: true
                        })
                    }
                }
            ]
            : [])
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Base de datos reseteada!')),
        '',
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray('Se generó un backup previo en backups/'),
        c.gray(runSeed ? 'Datos de prueba sembrados' : 'Tablas vacías, sin datos'),
        c.gray(`Tiempo total: ${elapsed}`)
    ])
}

main().catch((err) => fail(err.message, err.details))