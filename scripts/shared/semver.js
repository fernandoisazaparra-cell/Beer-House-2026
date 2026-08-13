// ============================================================
// Semver mínimo, sin dependencias. Necesario porque este chequeo
// corre ANTES de "npm i" — todavía no existe node_modules/, así
// que no podemos apoyarnos en el paquete "semver" de npm.
//
// Soporta: exacta ("18.2.0"), "^18.2.0", "~18.2.0", ">=", "<=",
// ">", "<", comodines ("18.x", "18"), y varias condiciones
// separadas por espacio tratadas como AND (ej. ">=18.0.0 <21.0.0").
// ============================================================
const parseVersion = (v) => {
    const clean = String(v).replace(/^v/, '')
    const [major, minor, patch] = clean.split('.').map((n) => Number(n) || 0)
    return { major, minor: minor ?? 0, patch: patch ?? 0 }
}

const compareVersions = (a, b) => {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
}

const satisfiesRange = (version, range) => {
    if (!range) return true

    const v = parseVersion(version)
    const conditions = String(range).trim().split(/\s+/)

    return conditions.every((cond) => {
        const match = cond.match(/^(\^|~|>=|<=|>|<)?(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/)

        // Condición no reconocida (rangos "||", tags como "lts") -> no bloquear
        if (!match) return true

        const [, op = '', maj, min, pat] = match
        const wildcard = (n) => n === undefined || n === 'x' || n === '*'

        const target = {
            major: Number(maj),
            minor: wildcard(min) ? 0 : Number(min),
            patch: wildcard(pat) ? 0 : Number(pat)
        }

        switch (op) {
            case '^':
                return v.major === target.major && compareVersions(v, target) >= 0
            case '~':
                return v.major === target.major && v.minor === target.minor && v.patch >= target.patch
            case '>=':
                return compareVersions(v, target) >= 0
            case '<=':
                return compareVersions(v, target) <= 0
            case '>':
                return compareVersions(v, target) > 0
            case '<':
                return compareVersions(v, target) < 0
            default:
                // Sin operador: en semver real, una versión "pelada"
                // es coincidencia EXACTA (respetando comodines), no ">=".
                if (wildcard(min)) return v.major === target.major
                if (wildcard(pat)) return v.major === target.major && v.minor === target.minor
                return v.major === target.major && v.minor === target.minor && v.patch === target.patch
        }
    })
}

export { satisfiesRange, parseVersion, compareVersions }