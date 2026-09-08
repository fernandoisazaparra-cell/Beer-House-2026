import {
    API_ROUTES,
    apiFetch
} from '@/app/api'

export type OrderStatus = 'pendiente' | 'completado' | 'cancelado'

export interface OrderItem {
    id: number
    product_id: number | null
    product_name: string
    quantity: number
    unit_price: number
}

export interface Order {
    id: number
    code: string
    client_name: string
    client_email: string
    total: number
    status: OrderStatus
    payment_method: string
    created_at: string | null
    items?: OrderItem[]
}

export interface OrderItemInput {
    product_id?: number | null
    product_name: string
    quantity: number
    unit_price: number
}

export interface OrderInput {
    client_name: string
    client_email?: string | null
    payment_method?: string
    status?: OrderStatus
    items: OrderItemInput[]
}

interface OrdersResponse {
    orders: Order[]
}

export const getOrders = async (): Promise<Order[]> => {
    const data = await apiFetch<OrdersResponse>(API_ROUTES.Orders.List)
    return data.orders
}

export const getOrderDetail = async (id: number): Promise<Order> => {
    const data = await apiFetch<{ order: Order }>(API_ROUTES.Orders.Detail(id))
    return data.order
}

export const createOrder = async (input: OrderInput): Promise<Order> => {
    const data = await apiFetch<{ order: Order }>(API_ROUTES.Orders.Create, {
        method: 'POST',
        body: JSON.stringify(input)
    })
    return data.order
}

export const createPublicOrder = async (input: OrderInput): Promise<Order> => {
    const data = await apiFetch<{ order: Order }>(API_ROUTES.Orders.PublicCreate, {
        method: 'POST',
        body: JSON.stringify(input)
    })
    return data.order
}

export const updateOrderStatus = async (
    id: number,
    status: OrderStatus
): Promise<Order> => {
    const data = await apiFetch<{ order: Order }>(API_ROUTES.Orders.UpdateStatus(id), {
        method: 'PATCH',
        body: JSON.stringify({ status })
    })
    return data.order
}