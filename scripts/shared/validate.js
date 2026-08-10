import { c } from './colors.js'
import { box } from './terminal.js'

// Termina el script con una caja de error consistente en todos los comandos.
// details puede tener saltos de línea, se dividen automáticamente.
const fail = (message, details) => {
    const lines = [c.red(`✗ ${message}`)]

    if (details) {
        lines.push('', ...details.split('\n').map((line) => c.gray(line)))
    }

    console.error('\n' + box(lines, { color: c.red }) + '\n')
    process.exit(1)
}

// Caja de éxito consistente para pantallas finales
const success = (lines) => {
    console.log('\n' + box(lines, { color: c.green }) + '\n')
}

export { fail, success }