import {
    API_ROUTES,
    apiFetch
} from '@/app/api'
import type { Order } from './ordersService'

export interface DashboardStats {
    stats: {
        total_users: number
        clientes: number
        admins: number
        total_orders: number
        completed_orders: number
        pending_orders: number
        total_income: number
        total_products: number
        low_stock: number
    }
    recent_orders: Order[]
}

interface DashboardStatsResponse {
    stats: DashboardStats['stats']
    recent_orders: Order[]
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const data = await apiFetch<DashboardStatsResponse>(API_ROUTES.Admin.DashboardStats)
    return {
        stats: data.stats,
        recent_orders: data.recent_orders
    }
}

export const formatCurrency = (value: number): string =>
    `$${value.toLocaleString('es-CO')}`

export const formatDate = (value: string | null): string => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('es-CO')
}