import styles from '../Products.module.css'
// ======================================================
// ENCABEZADO DE LA PÁGINA DE PRODUCTOS
// ======================================================
export const ProductsHeader = () => {
    return (
        <section className={styles.pageHeader}>
            <h1>Nuestros <span>Productos</span></h1>
            <div className={styles.breadcrumb}>Inicio <span>›</span> Productos</div>
        </section>
    )
}