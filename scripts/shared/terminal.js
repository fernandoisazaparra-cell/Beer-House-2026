import { c, gradientText } from './colors.js'

// ============================================================
// CURSOR
// ============================================================
const cursor = {
    hide: () => process.stdout.write('\x1b[?25l'),
    show: () => process.stdout.write('\x1b[?25h'),
    up: (n) => process.stdout.write(`\x1b[${n}F`)
}

let cursorHidden = false
const ensureCursorRestore = () => {
    if (cursorHidden) return
    cursorHidden = true
    const restore = () => cursor.show()
    process.on('exit', restore)
    process.on('SIGINT', () => { restore(); process.exit(130) })
}

// ============================================================
// CAJAS DINÁMICAS (se adaptan al contenido, nunca se rompen)
// ============================================================
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '')

const box = (lines, { color = c.amber, minWidth = 46 } = {}) => {
    const width = Math.max(minWidth, ...lines.map((l) => stripAnsi(l).length)) + 4

    const top = color(`╭${'─'.repeat(width)}╮`)
    const bottom = color(`╰${'─'.repeat(width)}╯`)
    const empty = color('│') + ' '.repeat(width) + color('│')

    const body = lines.map((line) => {
        const visibleLen = stripAnsi(line).length
        const padding = width - 2 - visibleLen
        return `${color('│')}  ${line}${' '.repeat(Math.max(padding, 0))}${color('│')}`
    })

    return [top, empty, ...body, empty, bottom].join('\n')
}

// ============================================================
// HEADER
// ============================================================
const showHeader = ({ title = 'BEER HOUSE 2026', description = '' } = {}) => {
    console.clear()
    ensureCursorRestore()

    const lines = [c.bold(gradientText(`🍺  ${title}`))]
    if (description) lines.push(c.gray(description))

    console.log('\n' + box(lines) + '\n')
}

export { cursor, box, stripAnsi, showHeader }