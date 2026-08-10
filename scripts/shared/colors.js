// ============================================================
// COLOR ENGINE (24-bit, sin dependencias)
// ============================================================
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'

const rgb = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`

const PALETTE = {
    amber: [245, 166, 35],
    amberLight: [255, 199, 95],
    amberDark: [178, 108, 12],
    green: [88, 214, 141],
    red: [237, 85, 101],
    cyan: [94, 210, 232],
    gray: [120, 128, 140]
}

const c = {
    amber: (s) => `${rgb(...PALETTE.amber)}${s}${RESET}`,
    green: (s) => `${rgb(...PALETTE.green)}${s}${RESET}`,
    red: (s) => `${rgb(...PALETTE.red)}${s}${RESET}`,
    cyan: (s) => `${rgb(...PALETTE.cyan)}${s}${RESET}`,
    gray: (s) => `${DIM}${rgb(...PALETTE.gray)}${s}${RESET}`,
    bold: (s) => `${BOLD}${s}${RESET}`,
    dim: (s) => `${DIM}${s}${RESET}`
}

const lerp = (a, b, t) => Math.round(a + (b - a) * t)

const lerpColor = (from, to, t) => [
    lerp(from[0], to[0], t),
    lerp(from[1], to[1], t),
    lerp(from[2], to[2], t)
]

// Texto con degradado de color, letra a letra
const gradientText = (text, from = PALETTE.amberLight, to = PALETTE.amberDark) => {
    const chars = [...text]
    return chars
        .map((ch, i) => {
            if (ch === ' ') return ch
            const t = chars.length <= 1 ? 0 : i / (chars.length - 1)
            const [r, g, b] = lerpColor(from, to, t)
            return `${rgb(r, g, b)}${BOLD}${ch}${RESET}`
        })
        .join('')
}

// Barra de progreso con degradado según el avance (rojo -> ámbar -> verde)
const gradientBar = (percentage, totalBars = 32) => {
    const completed = Math.round(totalBars * percentage / 100)
    let bar = ''

    for (let i = 0; i < totalBars; i++) {
        if (i >= completed) {
            bar += c.gray('░')
            continue
        }
        const t = i / Math.max(totalBars - 1, 1)
        const stops = t < 0.5
            ? lerpColor(PALETTE.red, PALETTE.amber, t / 0.5)
            : lerpColor(PALETTE.amber, PALETTE.green, (t - 0.5) / 0.5)
        bar += `${rgb(...stops)}█${RESET}`
    }

    return bar
}

export { c, PALETTE, gradientText, gradientBar }