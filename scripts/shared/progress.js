import { c, gradientBar } from './colors.js'
import { cursor } from './terminal.js'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const ICONS = {
    done: c.green('✓'),
    error: c.red('✗'),
    pending: c.gray('○')
}

let progressStarted = false
let renderedLines = 0

// ============================================================
// BARRA SIMULADA
// ------------------------------------------------------------
// La barra avanza con "pasos de confianza": llega a un límite
// (cap, ej. 44.44) mientras la tarea real trabaja y, si la tarea
// todavía no termina, se queda ahí esperando con el spinner activo.
// Al completarse la tarea, llena hasta el porcentaje real (end).
// ============================================================

const formatPct = (value) => {
    const rounded = Math.round(value * 100) / 100
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
}

const renderProgress = ({ percentage, steps = [], frame = 0 }) => {
    const bar = gradientBar(percentage)
    const pct = c.bold(`${String(formatPct(percentage)).padStart(5)}%`)

    const stepLines = steps.map((step) => {
        let icon = ICONS.pending
        if (step.status === 'done') icon = ICONS.done
        else if (step.status === 'error') icon = ICONS.error
        else if (step.status === 'active') icon = c.cyan(SPINNER_FRAMES[frame % SPINNER_FRAMES.length])

        const label = step.status === 'done' ? c.dim(step.label) : step.label
        return `  ${icon}  ${label}`
    })

    if (progressStarted) cursor.up(renderedLines)

    const output = [`  ${bar}  ${pct}`, '', ...stepLines, ''].join('\n')
    console.log(output)

    renderedLines = output.split('\n').length
    progressStarted = true
}

const showProgress = ({ percentage, steps }) => renderProgress({ percentage, steps })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Avance hacia `target` con easing: rápido al inicio, lento cerca del límite
const stepToward = (current, target) =>
    Math.min(target, current + (target - current) * 0.22 + 0.04)

// ============================================================
// withSpinner
// ------------------------------------------------------------
// - Llena de forma simulada desde `start` hacia `cap`.
// - Si la tarea no termina, se queda en `cap` esperando (spinner activo).
// - Al terminar, llena hasta `end` y marca ✓/✗.
// ============================================================
const withSpinner = async (task, { start, cap, end, steps, activeIndex }) => {
    let current = start
    let frame = 0

    steps[activeIndex].status = 'active'
    const interval = setInterval(() => {
        frame++
        if (current < cap) current = stepToward(current, cap)
        renderProgress({ percentage: current, steps, frame })
    }, 70)

    cursor.hide()

    try {
        const result = await task()
        clearInterval(interval)

        while (current < end) {
            current = Math.min(end, current + (end - current) * 0.3 + 0.4)
            frame++
            renderProgress({ percentage: current, steps, frame })
            await sleep(35)
        }

        steps[activeIndex].status = 'done'
        renderProgress({ percentage: current, steps, frame })
        cursor.show()
        return result
    } catch (err) {
        clearInterval(interval)
        steps[activeIndex].status = 'error'
        renderProgress({ percentage: end, steps, frame })
        cursor.show()
        throw err
    }
}

const resolveRange = (target) => {
    const { start, end } = typeof target === 'number'
        ? { start: target, end: target }
        : target
    const cap = start + (end - start) * 0.85
    return { start, cap, end }
}

const runSteps = async (steps, tasks) => {
    renderProgress({ percentage: 0, steps })

    for (let i = 0; i < tasks.length; i++) {
        const { start, cap, end } = resolveRange(tasks[i].percentage)
        const explicitCap = tasks[i].cap

        await withSpinner(tasks[i].task, {
            start,
            cap: explicitCap ?? cap,
            end,
            steps,
            activeIndex: i
        })
        renderProgress({ percentage: end, steps })
    }
}

const runChecks = async (steps, tasks) => {
    renderProgress({ percentage: 0, steps })
    const failures = []

    for (let i = 0; i < tasks.length; i++) {
        const { start, cap, end } = resolveRange(tasks[i].percentage)
        const explicitCap = tasks[i].cap

        try {
            await withSpinner(tasks[i].task, {
                start,
                cap: explicitCap ?? cap,
                end,
                steps,
                activeIndex: i
            })
        } catch (err) {
            failures.push({ label: steps[i].label, message: err.message })
        }

        renderProgress({ percentage: end, steps })
    }

    return failures
}

export { renderProgress, showProgress, withSpinner, runSteps, runChecks, formatPct }
