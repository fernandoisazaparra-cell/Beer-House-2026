import {
    API_ROUTES,
    apiFetch
} from '@/app/api'

export interface Category {
    id: number
    name: string
    slug: string
    description: string
    icon: string
    created_at: string | null
}

export interface CategoryInput {
    name: string
    description?: string | null
    icon?: string | null
}

interface CategoriesResponse {
    categories: Category[]
}

export const getCategories = async (): Promise<Category[]> => {
    const data = await apiFetch<CategoriesResponse>(API_ROUTES.Categories.List)
    return data.categories
}

export const createCategory = async (input: CategoryInput): Promise<Category> => {
    const data = await apiFetch<{ category: Category }>(API_ROUTES.Categories.Create, {
        method: 'POST',
        body: JSON.stringify(input)
    })
    return data.category
}

export const updateCategory = async (
    id: number,
    input: CategoryInput
): Promise<Category> => {
    const data = await apiFetch<{ category: Category }>(API_ROUTES.Categories.Update(id), {
        method: 'PUT',
        body: JSON.stringify(input)
    })
    return data.category
}

export const deleteCategory = async (id: number): Promise<void> => {
    await apiFetch<{ message: string }>(API_ROUTES.Categories.Delete(id), {
        method: 'DELETE'
    })
}