import type { Product } from '@/features/dashboard/services/productsService'
import { getProductsPublic } from '@/features/dashboard/services/productsService'
import type { Producto } from '../productos.types'

const formatPrecio = (value: number): string =>
    `$${value.toLocaleString('es-CO')}`

export const serializarProducto = (product: Product): Producto => {
    return {
        id: product.id,
        nombre: product.name,
        categoria: product.category,
        precio: formatPrecio(product.price),
        precioAnterior: product.old_price !== null && product.old_price !== undefined
            ? formatPrecio(product.old_price)
            : '',
        imagen: product.image_url,
        descuento: product.discount || '',
        stock: product.stock > 0,
        destacado: product.featured,
    }
}

export const obtenerProductos = async (): Promise<Producto[]> => {
    const products = await getProductsPublic()
    return products.map(serializarProducto)
}