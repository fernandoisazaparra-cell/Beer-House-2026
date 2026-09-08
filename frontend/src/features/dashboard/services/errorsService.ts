import type { ApiErrorPayload } from '@/app/api'

export const getErrorMessage = (error: unknown): string => {
    const err = error as ApiErrorPayload
    if (err?.message) return err.message
    if (err?.errors) {
        return Object.values(err.errors).flat().join(', ')
    }
    return 'Ocurrió un error inesperado'
}