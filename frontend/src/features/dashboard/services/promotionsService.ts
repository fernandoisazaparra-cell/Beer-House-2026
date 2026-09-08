import {
    API_ROUTES,
    apiFetch
} from '@/app/api'

export interface Promotion {
    id: number
    code: string
    discount_percent: number
    active: boolean
    expires_at: string | null
    created_at: string | null
}

export interface PromotionInput {
    code: string
    discount_percent: number
    active?: boolean
    expires_at?: string | null
}

interface PromotionsResponse {
    promotions: Promotion[]
}

export const getPromotions = async (): Promise<Promotion[]> => {
    const data = await apiFetch<PromotionsResponse>(API_ROUTES.Promotions.List)
    return data.promotions
}

export const createPromotion = async (input: PromotionInput): Promise<Promotion> => {
    const data = await apiFetch<{ promotion: Promotion }>(API_ROUTES.Promotions.Create, {
        method: 'POST',
        body: JSON.stringify(input)
    })
    return data.promotion
}

export const updatePromotion = async (
    id: number,
    input: Partial<PromotionInput>
): Promise<Promotion> => {
    const data = await apiFetch<{ promotion: Promotion }>(API_ROUTES.Promotions.Update(id), {
        method: 'PUT',
        body: JSON.stringify(input)
    })
    return data.promotion
}

export const togglePromotion = async (id: number): Promise<Promotion> => {
    const data = await apiFetch<{ promotion: Promotion }>(API_ROUTES.Promotions.Toggle(id), {
        method: 'PATCH'
    })
    return data.promotion
}

export const deletePromotion = async (id: number): Promise<void> => {
    await apiFetch<{ message: string }>(API_ROUTES.Promotions.Delete(id), {
        method: 'DELETE'
    })
}