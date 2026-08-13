import { existsSync, readFileSync } from 'node:fs'

// ============================================================
// Parser .env
// ============================================================

const parseEnvFile = (filePath) => {
    if (!existsSync(filePath)) return {}

    const content = readFileSync(filePath, 'utf8')
    const vars = {}

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()

        if (!line || line.startsWith('#')) continue

        const eqIndex = line.indexOf('=')
        if (eqIndex === -1) continue

        const key = line.slice(0, eqIndex).trim()
        let value = line.slice(eqIndex + 1).trim()

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }

        vars[key] = value
    }

    return vars
}

// ============================================================
// MySQL
// ============================================================

const resolveMysqlTarget = (env) => ({
    host: env.DB_HOST || env.MYSQL_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || env.MYSQL_PORT) || 3306
})

// ============================================================
// Flask
// ============================================================

const resolveFlaskTarget = (env) => ({
    host: env.FLASK_RUN_HOST || '127.0.0.1',
    port: Number(env.FLASK_RUN_PORT) || 5000
})

export {
    parseEnvFile,
    resolveMysqlTarget,
    resolveFlaskTarget
}