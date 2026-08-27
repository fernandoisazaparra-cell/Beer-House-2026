// ======================================================
// PRODUCTS
// Página / sección de catálogo de productos
// ======================================================
import styles from './Products.module.css'
import { productos } from './productos.types'
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
    return (
        <main className={styles.productsPage}>
            <ProductsHeader />

            <section className={styles.catalog}>
                <FiltrosSidebar />

                <section className={styles.productsArea}>
                    <SearchOrder />
                    <ActiveFilters />
                    <ProductsInfo total={120} mostrando={productos.length} />
                    <ProductsGrid productos={productos} />
                </section>
            </section>
        </main>
    )
}