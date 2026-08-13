import path from 'node:path'

import { runCommandCapture } from './exec.js'

// ============================================================
// Python del venv
// ============================================================

const getVenvPython = (backendDir) => {
    const isWindows = process.platform === 'win32'

    return isWindows
        ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
        : path.join(backendDir, 'venv', 'bin', 'python')
}

// ============================================================
// Ejecutar Python con la configuración de DB
// Las credenciales viajan por variables de entorno (os.environ),
// así los valores con comillas o backslashes nunca rompen el código.
// ============================================================

const runPythonDb = async ({
    python,
    env,
    code
}) => {
    return runCommandCapture({
        command: python,
        args: ['-c', code],
        env
    })
}

// ============================================================
// Comprobar conexión REAL a MySQL
// ============================================================

const checkMysqlConnection = async ({
    python,
    env
}) => {
    await runPythonDb({
        python,
        env,
        code: `
import os
import pymysql

connection = pymysql.connect(
    host=os.environ["DB_HOST"],
    port=int(os.environ["DB_PORT"]),
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    connect_timeout=5
)

with connection.cursor() as cursor:
    cursor.execute("SELECT 1")
    cursor.fetchone()

connection.close()
`
    })
}

// ============================================================
// Crear base de datos si no existe
// ============================================================

const createDatabase = async ({
    python,
    env
}) => {
    await runPythonDb({
        python,
        env,
        code: `
import os
import pymysql

connection = pymysql.connect(
    host=os.environ["DB_HOST"],
    port=int(os.environ["DB_PORT"]),
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    connect_timeout=5
)

with connection.cursor() as cursor:
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS \`{os.environ['DB_NAME']}\`")

connection.commit()
connection.close()
`
    })
}

// ============================================================
// Verificar que la tabla de usuarios exista tras migrar
// ============================================================

const checkTableExists = async ({
    python,
    env,
    table = 'users'
}) => {
    const stdout = await runPythonDb({
        python,
        env,
        code: `
import os
import pymysql

connection = pymysql.connect(
    host=os.environ["DB_HOST"],
    port=int(os.environ["DB_PORT"]),
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    database=os.environ["DB_NAME"],
    connect_timeout=5
)

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_schema = %s AND table_name = %s",
        (os.environ["DB_NAME"], "${table}")
    )
    count = cursor.fetchone()[0]
    print("exists" if count else "missing")

connection.close()
`
    })

    return stdout.includes('exists')
}

export {
    getVenvPython,
    checkMysqlConnection,
    createDatabase,
    checkTableExists
}
