import styles from '../Products.module.css'
// ======================================================
// FILTROS ACTIVOS
// ======================================================
export const ActiveFilters = () => {
    return (
        <div className={styles.activeFilters}>
            <span>Categoría: Whisky<button type="button">×</button></span>
            <span>Precio: $20.000 - $500.000+<button type="button">×</button></span>
            <button type="button" className={styles.clearFilters}>Limpiar filtros ⟳</button>
        </div>
    )
}