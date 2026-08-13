import {
    existsSync
} from 'node:fs'

import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    fail,
    success,
    formatDuration,
    parseEnvFile,
    resolveMysqlTarget,
    getVenvPython,
    checkMysqlConnection,
    createDatabase,
    checkTableExists,
    runCommand
} from '../shared/index.js'

// ============================================================
// CONFIGURACIÓN
// ============================================================

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')
const migrationsDir = path.join(backendDir, 'migrations')

// ============================================================
// MAIN
// ============================================================

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Instalando base de datos'
    })

    const steps = [
        { status: 'pending', label: 'Configuración' },
        { status: 'pending', label: 'Conexión MySQL' },
        { status: 'pending', label: 'Base de datos' },
        { status: 'pending', label: 'Migraciones' }
    ]

    let env
    let python
    let migrationInitiated = false

    await runSteps(steps, [

        // ====================================================
        // CONFIGURACIÓN
        // ====================================================

        {
            percentage: 25,

            task: async () => {
                if (!existsSync(envFile)) {
                    fail(
                        'No se encontró backend/.env.',
                        'Ejecuta primero backend:install.'
                    )
                }

                env = parseEnvFile(envFile)

                const required = [
                    'DB_HOST',
                    'DB_PORT',
                    'DB_USER',
                    'DB_PASSWORD',
                    'DB_NAME'
                ]

                const missing = required.filter(
                    key => !env[key]
                )

                if (missing.length) {
                    fail(
                        'Configuración incompleta.',
                        `Faltan: ${missing.join(', ')}`
                    )
                }

                const db = resolveMysqlTarget(env)

                if (
                    !Number.isInteger(db.port) ||
                    db.port < 1 ||
                    db.port > 65535
                ) {
                    fail(
                        'Puerto MySQL inválido.',
                        `DB_PORT=${env.DB_PORT}`
                    )
                }

                if (!/^[A-Za-z0-9_]+$/.test(env.DB_NAME)) {
                    fail(
                        'Nombre de base de datos inválido.',
                        `DB_NAME=${env.DB_NAME}`
                    )
                }

                python = getVenvPython(backendDir)

                if (!existsSync(python)) {
                    fail(
                        'No se encontró el entorno virtual.',
                        'Ejecuta primero backend:install.'
                    )
                }
            }
        },

        // ====================================================
        // CONEXIÓN
        // Barra simulada: llena hasta 44.44% mientras espera a
        // MySQL. Si la conexión tarda, se queda ahí esperando.
        // ====================================================

        {
            percentage: 50,
            cap: 44.44,

            task: async () => {
                try {
                    await checkMysqlConnection({
                        python,
                        env
                    })
                } catch {
                    fail(
                        'No se pudo conectar a MySQL.',
                        `${env.DB_HOST}:${env.DB_PORT}`
                    )
                }
            }
        },

        // ====================================================
        // BASE DE DATOS
        // ====================================================

        {
            percentage: 75,

            task: async () => {
                await createDatabase({
                    python,
                    env
                })
            }
        },

        // ====================================================
        // MIGRACIONES
        // 1. flask db init   (solo si migrations/ no existe)
        // 2. flask db migrate (primera migración del esquema)
        // 3. flask db upgrade (aplica los cambios)
        // 4. verificación final de la tabla users
        // ====================================================

        {
            percentage: { start: 80, end: 100 },
            cap: 96,

            task: async () => {
                const needsInit = !existsSync(migrationsDir)

                if (needsInit) {
                    migrationInitiated = true
                    await runCommand({
                        command: python,
                        args: [
                            '-m',
                            'flask',
                            '--app',
                            'run.py',
                            'db',
                            'init'
                        ],
                        cwd: backendDir,
                        env: {
                            ...process.env,
                            ...env
                        },
                        shell: false,
                        silent: true
                    })

                    await runCommand({
                        command: python,
                        args: [
                            '-m',
                            'flask',
                            '--app',
                            'run.py',
                            'db',
                            'migrate',
                            '-m',
                            'initial schema'
                        ],
                        cwd: backendDir,
                        env: {
                            ...process.env,
                            ...env
                        },
                        shell: false,
                        silent: true
                    })
                }

                await runCommand({
                    command: python,
                    args: [
                        '-m',
                        'flask',
                        '--app',
                        'run.py',
                        'db',
                        'upgrade'
                    ],
                    cwd: backendDir,
                    env: {
                        ...process.env,
                        ...env
                    },
                    shell: false,
                    silent: true
                })

                const usersTable = await checkTableExists({
                    python,
                    env,
                    table: 'users'
                })

                if (!usersTable) {
                    fail(
                        'La migración no creó la tabla users.',
                        'Revisa los modelos en features/users/.'
                    )
                }
            }
        }
    ])

    // ========================================================
    // RESULTADO
    // ========================================================

    success([
        c.bold(c.green('¡Base de datos lista!')),
        '',
        c.gray(`MySQL: ${env.DB_HOST}:${env.DB_PORT}`),
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray('Conexión verificada'),
        c.gray('Base de datos preparada'),
        c.gray(
            migrationInitiated
                ? 'Migraciones iniciadas y aplicadas'
                : 'Migraciones aplicadas'
        ),
        c.gray('Tabla users verificada'),
        c.gray(
            `Tiempo total: ${formatDuration(Date.now() - startedAt)}`
        ),
        '',
        `Ejecuta ${c.bold(c.amber('npm run db:dev'))} para iniciar.`
    ])
}

main().catch(err => fail(err.message, err.details))
