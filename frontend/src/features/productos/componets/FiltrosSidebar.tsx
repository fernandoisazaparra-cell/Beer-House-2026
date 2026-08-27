import styles from '../Products.module.css'

// ======================================================
// SIDEBAR DE FILTROS (categorías, precio, país, añejamiento)
// ======================================================
export const FiltrosSidebar = () => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.filterHeader}>
                <h2>⚱ FILTROS</h2>
                <button type="button">Limpiar todo</button>
            </div>

            {/* CATEGORÍAS */}
            <div className={styles.filterGroup}>
                <div className={styles.filterTitle}>CATEGORÍAS<span>⌃</span></div>
                <label><input type="checkbox" /> Whisky <small>120</small></label>
                <label><input type="checkbox" /> Ron <small>85</small></label>
                <label><input type="checkbox" /> Vodka <small>60</small></label>
                <label><input type="checkbox" /> Tequila <small>75</small></label>
                <label><input type="checkbox" /> Vino <small>90</small></label>
            </div>

            {/* RANGO DE PRECIO */}
            <div className={styles.filterGroup}>
                <div className={styles.filterTitle}>RANGO DE PRECIO<span>⌄</span></div>
                <div className={styles.priceValue}>$385.000</div>
                <input type="range" min="0" max="500000" defaultValue="385000" />
                <div className={styles.priceRange}>
                    <span>$50.000</span>
                    <span>$500.000+</span>
                </div>
            </div>

            {/* PAÍS DE ORIGEN */}
            <div className={styles.filterGroup}>
                <div className={styles.filterTitle}>PAÍS DE ORIGEN<span>⌄</span></div>
                <label><input type="checkbox" /> Escocia <small>90</small></label>
                <label><input type="checkbox" /> Estados Unidos <small>45</small></label>
                <label><input type="checkbox" /> México <small>65</small></label>
                <label><input type="checkbox" /> Colombia <small>35</small></label>
                <label><input type="checkbox" /> Francia <small>25</small></label>
                <a href="#">Ver más</a>
            </div>

            {/* AÑEJAMIENTO */}
            <div className={styles.filterGroup}>
                <div className={styles.filterTitle}>AÑEJAMIENTO<span>⌄</span></div>
                <label><input type="checkbox" /> Menos de 3 años <small>35</small></label>
                <label><input type="checkbox" /> 3 - 8 años <small>50</small></label>
                <label><input type="checkbox" /> Más de 8 años <small>35</small></label>
            </div>
        </aside>
    )
}