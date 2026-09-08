import {
    API_ROUTES,
    apiFetch
} from '@/app/api'

export interface Product {
    id: number
    name: string
    description: string
    category_id: number | null
    category: string
    price: number
    old_price: number | null
    discount: string
    stock: number
    min_stock: number
    image_url: string
    featured: boolean
    active: boolean
    created_at: string | null
}

export interface ProductInput {
    name: string
    description?: string | null
    category_id?: number | null
    price: number
    old_price?: number | null
    discount?: string
    stock?: number
    min_stock?: number
    image_url?: string | null
    featured?: boolean
    active?: boolean
}

interface ProductsResponse {
    products: Product[]
}

export const getProductsPublic = async (): Promise<Product[]> => {
    const data = await apiFetch<ProductsResponse>(API_ROUTES.Products.List)
    return data.products
}

export const getProductsAdmin = async (): Promise<Product[]> => {
    const data = await apiFetch<ProductsResponse>(API_ROUTES.Products.AdminAll)
    return data.products
}

export const getLowStock = async (): Promise<Product[]> => {
    const data = await apiFetch<ProductsResponse>(API_ROUTES.Products.LowStock)
    return data.products
}

export const createProduct = async (input: ProductInput): Promise<Product> => {
    const data = await apiFetch<{ product: Product }>(API_ROUTES.Products.Create, {
        method: 'POST',
        body: JSON.stringify(input)
    })
    return data.product
}

export const updateProduct = async (
    id: number,
    input: Partial<ProductInput>
): Promise<Product> => {
    const data = await apiFetch<{ product: Product }>(API_ROUTES.Products.Update(id), {
        method: 'PUT',
        body: JSON.stringify(input)
    })
    return data.product
}

export const adjustStock = async (id: number, quantity: number): Promise<Product> => {
    const data = await apiFetch<{ product: Product }>(API_ROUTES.Products.AdjustStock(id), {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
    })
    return data.product
}

export const deleteProduct = async (id: number): Promise<void> => {
    await apiFetch<{ message: string }>(API_ROUTES.Products.Delete(id), {
        method: 'DELETE'
    })
}