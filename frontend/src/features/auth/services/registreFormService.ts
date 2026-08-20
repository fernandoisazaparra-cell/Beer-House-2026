export interface RegisterData {
    name: string
    email: string
    password: string
    terms: boolean
}

export interface FieldErrors {
    errors: Record<string, string[]>
}

export interface MessageError {
    message: string
}

export type ApiErrorResponse = FieldErrors | MessageError

import {
    API_ROUTES,
    API_URL
} from '@/app/api'

export const registreUser = async (data: RegisterData) => {
    const response = await fetch(
        `${API_URL}${API_ROUTES.Auth.Registre}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
    )

    const result = await response.json()

    if (!response.ok) {
        throw result as ApiErrorResponse
    }

    return result
}
