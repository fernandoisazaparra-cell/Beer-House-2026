import { spawn, execFile } from 'node:child_process'

const isWindows = process.platform === 'win32'

// Función auxiliar para manejar npm/npx en Windows de forma segura sin shell: true
const resolveCommand = (command, args) => {
    if (
        isWindows &&
        (
            command === 'npm' ||
            command === 'npx' ||
            command === 'npm.cmd' ||
            command === 'npx.cmd'
        )
    ) {
        const baseCmd = command.endsWith('.cmd')
            ? command
            : `${command}.cmd`

        return {
            cmd: 'cmd.exe',
            resolvedArgs: ['/c', baseCmd, ...args]
        }
    }

    return {
        cmd: command,
        resolvedArgs: args
    }
}

const runCommand = ({
    command,
    args = [],
    cwd,
    env,
    silent = false
}) => {
    return new Promise((resolve, reject) => {
        const { cmd, resolvedArgs } = resolveCommand(command, args)

        const child = spawn(cmd, resolvedArgs, {
            cwd,
            env: env
                ? { ...process.env, ...env }
                : process.env,
            shell: false,
            stdio: silent
                ? ['ignore', 'pipe', 'pipe']
                : 'inherit'
        })

        let output = ''

        if (silent) {
            child.stdout?.on('data', (chunk) => {
                output += chunk.toString()
            })

            child.stderr?.on('data', (chunk) => {
                output += chunk.toString()
            })
        }

        child.on('error', (error) => {
            reject(
                new Error(
                    `Error ejecutando ${command}: ${error.message}`
                )
            )
        })

        child.on('close', (code) => {
            if (code !== 0) {
                const err = new Error(
                    `${command} terminó con código ${code}`
                )

                if (silent && output.trim()) {
                    const lines = output.trim().split('\n')

                    err.details = lines
                        .slice(-25)
                        .join('\n')
                }

                reject(err)
                return
            }

            resolve({
                code,
                stdout: output
            })
        })
    })
}

const runCommandCapture = ({
    command,
    args = [],
    cwd,
    env
}) => {
    return new Promise((resolve, reject) => {
        const { cmd, resolvedArgs } = resolveCommand(
            command,
            args
        )

        execFile(
            cmd,
            resolvedArgs,
            {
                cwd,
                env: env
                    ? { ...process.env, ...env }
                    : process.env,
                shell: false
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(
                        new Error(
                            stderr?.trim() || error.message
                        )
                    )

                    return
                }

                resolve(stdout.trim())
            }
        )
    })
}

export {
    runCommand,
    runCommandCapture
}