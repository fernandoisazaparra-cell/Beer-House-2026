import styles from '../Products.module.css'

interface ProductsInfoProps {
    total: number
    mostrando: number
}

// ======================================================
// INFORMACIÓN DE PRODUCTOS (contador + opciones de vista)
// ======================================================
export const ProductsInfo = ({ total, mostrando }: ProductsInfoProps) => {
    return (
        <div className={styles.productsInfo}>
            <span>Mostrando 1-{mostrando} de {total} productos</span>

            <div className={styles.viewOptions}>
                <span>Ver:</span>
                <button type="button" className={styles.activeView}>▦</button>
                <button type="button">☷</button>
            </div>
        </div>
    )
}