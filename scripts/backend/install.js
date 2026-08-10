import { existsSync } from 'node:fs'
import path from 'node:path'

import {
    c,
    showHeader,
    runSteps,
    runCommand,
    fail,
    success,
    formatDuration
} from '../shared/index.js'
import { start } from 'node:repl'

// ============================================================
// CONFIGURACIÓN
// ============================================================
const rootDir = process.cwd()
const backendDir = path.join(rootDir, 'backend')
const requireTxt = path.join(backendDir, 'requirements.txt')
const 