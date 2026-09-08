// ======================================================
// PRODUCTS
// Página / sección de catálogo de productos
// ======================================================
import { useEffect, useState } from 'react'
import styles from './Products.module.css'
import type { Producto } from './productos.types'
import { obtenerProductos } from './services/productosService'
import { ProductsHeader } from './componets/ProductsHeader'

import { FiltrosSidebar } from './componets/FiltrosSidebar'
import { SearchOrder } from './componets/SearchOrder'
import { ActiveFilters } from './componets/ActiveFilters'
import { ProductsInfo } from './componets/ProductsInfo'
import { ProductsGrid } from './componets/ProductsGrid'

// ======================================================
// COMPONENTE PRODUCTS
// ======================================================
export const Products = () => {
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const cargar = async () => {
            try {
                setLoading(true)
                setProductos(await obtenerProductos())
            } finally {
                setLoading(false)
            }
        }

        void cargar()
    }, [])

    return (
        <main className={styles.productsPage}>
            <ProductsHeader />

            <section className={styles.catalog}>
                <FiltrosSidebar />

                <section className={styles.productsArea}>
                    <SearchOrder />
                    <ActiveFilters />
                    <ProductsInfo total={productos.length} mostrando={productos.length} />
                    {loading ? (
                        <p>Cargando productos...</p>
                    ) : (
                        <ProductsGrid productos={productos} />
                    )}
                </section>
            </section>
        </main>
    )
}