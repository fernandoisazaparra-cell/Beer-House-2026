import {
    API_ROUTES,
    apiFetch
} from '@/app/api'

export type UserRol = 'user' | 'admin'

export interface AdminUser {
    id: number
    name: string
    email: string
    rol: UserRol
    google: boolean
    created_at: string | null
}

interface UsersResponse {
    users: AdminUser[]
}

export const getUsers = async (): Promise<AdminUser[]> => {
    const data = await apiFetch<UsersResponse>(API_ROUTES.Admin.Users)
    return data.users
}

export const updateUserRol = async (id: number, rol: UserRol): Promise<AdminUser> => {
    const data = await apiFetch<{ user: AdminUser }>(API_ROUTES.Admin.UpdateUserRol(id), {
        method: 'PATCH',
        body: JSON.stringify({ rol })
    })
    return data.user
}

export const deleteUser = async (id: number): Promise<void> => {
    await apiFetch<{ message: string }>(API_ROUTES.Admin.DeleteUser(id), {
        method: 'DELETE'
    })
}