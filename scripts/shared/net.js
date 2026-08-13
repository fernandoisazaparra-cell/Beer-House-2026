import net from 'node:net'

// ============================================================
// ¿Está libre un puerto para que Flask escuche ahí?
// ============================================================
const checkPortFree = (port, host = '127.0.0.1') => {
    return new Promise((resolve) => {
        const tester = net.createServer()

        tester.once('error', () => resolve(false))

        tester.once('listening', () => {
            tester.close(() => resolve(true))
        })

        tester.listen(port, host)
    })
}

// ============================================================
// ¿Se puede alcanzar un host:puerto? (ej. MySQL)
// No valida credenciales, solo que el servicio esté escuchando.
// ============================================================
const checkTcpReachable = (host, port, timeoutMs = 2500) => {
    return new Promise((resolve) => {
        const socket = new net.Socket()
        let settled = false

        const finish = (result) => {
            if (settled) return
            settled = true
            socket.destroy()
            resolve(result)
        }

        socket.setTimeout(timeoutMs)
        socket.once('connect', () => finish(true))
        socket.once('timeout', () => finish(false))
        socket.once('error', () => finish(false))

        socket.connect(port, host)
    })
}

export { checkPortFree, checkTcpReachable }
