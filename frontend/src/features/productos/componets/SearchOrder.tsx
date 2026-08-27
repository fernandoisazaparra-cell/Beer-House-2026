import styles from '../Products.module.css'

// ======================================================
// BUSCADOR Y ORDEN
// ======================================================
export const SearchOrder = () => {
    return (
        <div className={styles.topControls}>
            <div className={styles.searchBox}>
                <span>⌕</span>
                <input type="text" placeholder="Buscar productos, marcas..." />
            </div>

            <div className={styles.order}>
                <span>Ordenado por:</span>
                <select defaultValue="populares">
                    <option value="populares">Más populares</option>
                    <option value="menor">Precio menor</option>
                    <option value="mayor">Precio mayor</option>
                    <option value="recientes">Más recientes</option>
                </select>
            </div>
        </div>
    )
}