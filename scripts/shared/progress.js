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

const renderProgress = ({ percentage, steps, frame = 0 }) => {
    const bar = gradientBar(percentage)
    const pct = c.bold(`${String(percentage).padStart(3)}%`)

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

const withSpinner = async (task, { percentage, steps, activeIndex }) => {
    steps[activeIndex].status = 'active'
    let frame = 0

    const interval = setInterval(() => {
        frame++
        renderProgress({ percentage, steps, frame })
    }, 80)

    cursor.hide()
    try {
        const result = await task()
        steps[activeIndex].status = 'done'
        return result
    } catch (err) {
        steps[activeIndex].status = 'error'
        throw err
    } finally {
        clearInterval(interval)
        cursor.show()
    }
}

const runSteps = async (steps, tasks) => {
    renderProgress({ percentage: 0, steps })

    for (let i = 0; i < tasks.length; i++) {
        const target = tasks[i].percentage
        const { start, end } = typeof target === 'number'
            ? { start: target, end: target }
            : target

        await withSpinner(tasks[i].task, {
            percentage: start,
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
        const target = tasks[i].percentage
        const { start, end } = typeof target === 'number'
            ? { start: target, end: target }
            : target

        steps[i].status = 'active'
        let frame = 0
        const interval = setInterval(() => {
            frame++
            renderProgress({ percentage: start, steps, frame })
        }, 80)
        cursor.hide()

        try {
            await tasks[i].task()
            steps[i].status = 'done'
        } catch (err) {
            steps[i].status = 'error'
            failures.push({ label: steps[i].label, message: err.message })
        } finally {
            clearInterval(interval)
            cursor.show()
        }

        renderProgress({ percentage: end, steps })
    }

    return failures
}

export { renderProgress, showProgress, withSpinner, runSteps, runChecks }