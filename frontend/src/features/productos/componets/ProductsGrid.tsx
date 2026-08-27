import styles from '../Products.module.css'
import type { Producto } from '../productos.types'
import { ProductCard } from './ProductCard'

interface ProductsGridProps {
    productos: Producto[]
}
// ======================================================
// GRID DE PRODUCTOS
// ======================================================
export const ProductsGrid = ({ productos }: ProductsGridProps) => {
    return (
        <div className={styles.productsGrid}>
            {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
            ))}
        </div>
    )
}