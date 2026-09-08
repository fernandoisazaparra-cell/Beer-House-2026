export const API_URL = import.meta.env.VITE_API_URL

export const API_ROUTES = {
    Auth: {
        Registre: '/auth/register',
        Login: '/auth/login',
        VerifyEmail: '/auth/verify-email',
        TokenRepeat: '/auth/token-repeat',
        TokenGoogle: '/auth/token-google',
        ConfirmTerms: '/auth/confirm-terms'
    },
    Categories: {
        List: '/api/categories/',
        Create: '/api/categories/',
        Update: (id: number) => `/api/categories/${id}`,
        Delete: (id: number) => `/api/categories/${id}`
    },
    Products: {
        List: '/api/products/',
        AdminAll: '/api/products/admin/all',
        LowStock: '/api/products/admin/low-stock',
        Create: '/api/products/',
        Update: (id: number) => `/api/products/${id}`,
        AdjustStock: (id: number) => `/api/products/${id}/stock`,
        Delete: (id: number) => `/api/products/${id}`
    },
    Orders: {
        List: '/api/orders/',
        Stats: '/api/orders/stats',
        PublicCreate: '/api/orders/public',
        Detail: (id: number) => `/api/orders/${id}`,
        Create: '/api/orders/',
        UpdateStatus: (id: number) => `/api/orders/${id}/status`
    },
    Promotions: {
        List: '/api/promotions/',
        Create: '/api/promotions/',
        Update: (id: number) => `/api/promotions/${id}`,
        Toggle: (id: number) => `/api/promotions/${id}/toggle`,
        Delete: (id: number) => `/api/promotions/${id}`
    },
    Admin: {
        Users: '/api/admin/users',
        UpdateUserRol: (id: number) => `/api/admin/users/${id}/rol`,
        DeleteUser: (id: number) => `/api/admin/users/${id}`,
        DashboardStats: '/api/admin/dashboard-stats'
    }
} as const

export interface ApiErrorPayload {
    message?: string
    errors?: Record<string, string[]>
}

const STORAGE_KEY_TOKEN = 'bh_token'

export const apiFetch = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>)
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
    })

    const result = await response.json().catch(() => null) as ApiErrorPayload | T | null

    if (!response.ok) {
        throw (result as ApiErrorPayload) ?? { message: 'Error de conexión con el servidor' }
    }

    return result as T
}