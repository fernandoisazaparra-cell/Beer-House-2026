import {
    API_ROUTES,
    API_URL
} from '@/app/api'

export interface RegisterData {
    name: string
    email: string
    password: string
    terms: boolean
    years: boolean
}

export interface VerifyEmailData {
    email: string
    code: string
}

export interface LoginData {
    email: string
    password: string
}

export interface LoginResponse {
    token: string
    user: {
        id: number
        name: string
        email: string
        rol: string
    }
}

export interface FieldErrors {
    errors: Record<string, string[]>
}

export interface MessageError {
    message: string
}

export type ApiErrorResponse =
    | FieldErrors
    | MessageError

export const registreUser = async (
    data: RegisterData
) => {
    const response = await fetch(
        `${API_URL}${API_ROUTES.Auth.Registre}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }
    )
    const result = await response.json()

    if (!response.ok) {
        throw result as ApiErrorResponse
    }

    return result
}

export const verifyEmail = async (
    data: VerifyEmailData
) => {
    const response = await fetch(
        `${API_URL}${API_ROUTES.Auth.VerifyEmail}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }
    )

    const result = await response.json()

    if (!response.ok) {
        throw result as ApiErrorResponse
    }

    return result
}

export const loginUser = async (
    data: LoginData
): Promise<LoginResponse> => {
    const response = await fetch(
        `${API_URL}${API_ROUTES.Auth.Login}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }
    )

    const result = await response.json()

    if (!response.ok) {
        throw result as ApiErrorResponse
    }

    return result
}