import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration,
    parseEnvFile
} from '../shared/index.js'

const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const envFile = path.join(backendDir, '.env')
const backupsDir = path.join(rootDir, 'backups')

// Uso:
//   npm run db:restore -- backups/mi_db-2026-08-12.sql
//   npm run db:restore              (usa el backup más reciente en backups/)
const explicitFile = process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : null

// Encuentra el .sql más reciente en backups/ si no se pasó uno explícito
const findLatestBackup = () => {
    if (!existsSync(backupsDir)) return null

    const files = readdirSync(backupsDir)
        .filter((f) => f.endsWith('.sql'))
        .map((f) => ({
            file: f,
            mtime: statSync(path.join(backupsDir, f)).mtimeMs
        }))
        .sort((a, b) => b.mtime - a.mtime)

    return files.length ? path.join(backupsDir, files[0].file) : null
}

const main = async () => {
    const startedAt = Date.now()

    showHeader({
        title: 'BEER HOUSE 2026',
        description: 'Restaurando la base de datos desde un backup'
    })

    if (!existsSync(envFile)) fail('No se encontró backend/.env.', 'Ejecuta primero: npm run db:install')

    const env = parseEnvFile(envFile)

    const backupFile = explicitFile
        ? path.resolve(rootDir, explicitFile)
        : findLatestBackup()

    if (!backupFile || !existsSync(backupFile)) {
        fail(
            'No se encontró un archivo de backup para restaurar.',
            explicitFile
                ? `Ruta buscada: ${explicitFile}`
                : 'No hay archivos .sql en backups/. Pasa una ruta: npm run db:restore -- backups/archivo.sql'
        )
    }

    // ========================================================
    // GUARDA DE SEGURIDAD — restaurar SOBRESCRIBE todos los datos
    // actuales de la base de datos destino. En producción exige
    // --force explícito Y la variable CONFIRM_RESTORE=yes.
    // ========================================================
    if (env.APP_ENV === 'production') {
        const forced = process.argv.includes('--force')
        const confirmed = process.env.CONFIRM_RESTORE === 'yes'

        if (!forced || !confirmed) {
            fail(
                'BLOQUEADO: esto sobrescribe la base de datos de producción.',
                'Requiere: CONFIRM_RESTORE=yes npm run db:restore -- backups/archivo.sql --force'
            )
        }
    }

    const steps = [{ status: 'pending', label: `Restaurando ${path.basename(backupFile)}` }]

    await runSteps(steps, [
        {
            percentage: { start: 0, end: 100 },
            task: async () => {
                await runCommand({
                    command: 'mysql',
                    args: [
                        '-h', env.DB_HOST,
                        '-P', String(env.DB_PORT),
                        '-u', env.DB_USER,
                        env.DB_NAME
                    ],
                    cwd: rootDir,
                    // Password vía variable de entorno, nunca visible en el comando
                    env: { ...process.env, MYSQL_PWD: env.DB_PASSWORD },
                    // El contenido del .sql se pasa por stdin
                    stdin: backupFile,
                    shell: false,
                    silent: true
                })
            }
        }
    ])

    const elapsed = formatDuration(Date.now() - startedAt)

    success([
        c.bold(c.green('¡Base de datos restaurada!')),
        '',
        c.gray(`Archivo: ${path.relative(rootDir, backupFile)}`),
        c.gray(`Database: ${env.DB_NAME}`),
        c.gray(`Tiempo total: ${elapsed}`),
        '',
        `Ejecuta ${c.bold(c.amber('npm run db:status'))} para verificar el estado.`
    ])
}

main().catch((err) => fail(err.message, err.details))