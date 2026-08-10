import { spawn } from 'node:child_process'

const runCommand = ({ command, args = [], cwd, silent = false }) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            shell: true,
            stdio: silent ? 'ignore' : 'inherit'
        })

        child.on('error', (error) => {
            reject(new Error(`Error ejecutando ${command}: ${error.message}`))
        })

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`${command} terminó con código ${code}`))
                return
            }
            resolve(code)
        })
    })
}

export { runCommand }