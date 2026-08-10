import { existsSync, readFileSync } from 'node:fs'

// ============================================================
// Parser simple de archivos .env (KEY=VALUE)
// ============================================================
const parseEnvFile = (filePath) => {
    if (!existsSync(filePath)) return {}

    const content = readFileSync(filePath, 'utf-8')
    const vars = {}

    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue

        const eqIndex = line.indexOf('=')
        if (eqIndex === -1) continue

        const key = line.slice(0, eqIndex).trim()
        let value = line.slice(eqIndex + 1).trim()

        // Quita comillas envolventes si existen
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
// Extrae host/puerto de MySQL desde variables sueltas
// o desde una URL de conexión tipo:
//   mysql+pymysql://user:pass@host:3306/db
// ============================================================
const resolveMysqlTarget = (env) => {
    if (env.MYSQL_HOST) {
        return {
            host: env.MYSQL_HOST,
            port: Number(env.MYSQL_PORT) || 3306
        }
    }

    const connectionUrl =
        env.DATABASE_URL || env.SQLALCHEMY_DATABASE_URI || ''

    if (!connectionUrl) return { host: '127.0.0.1', port: 3306 }

    try {
        // "mysql+pymysql://" no es un esquema válido para URL nativa,
        // así que solo tomamos lo que hay después del "@"
        const afterAt = connectionUrl.split('@')[1] || ''
        const hostPort = afterAt.split('/')[0]
        const [host, port] = hostPort.split(':')

        return {
            host: host || '127.0.0.1',
            port: Number(port) || 3306
        }
    } catch {
        return { host: '127.0.0.1', port: 3306 }
    }
}

const resolveFlaskTarget = (env) => ({
    host: env.FLASK_RUN_HOST || '127.0.0.1',
    port: Number(env.FLASK_RUN_PORT) || 5000
})

export { parseEnvFile, resolveMysqlTarget, resolveFlaskTarget }