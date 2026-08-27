import styles from '../Products.module.css'
import type { Producto } from '../productos.types'

interface ProductCardProps {
    producto: Producto
}

// ======================================================
// TARJETA DE PRODUCTO
// ======================================================
export const ProductCard = ({ producto }: ProductCardProps) => {
    return (
        <article className={styles.productCard}>
            {/* IMAGEN DEL PRODUCTO */}
            <div className={styles.productImage}>
                {producto.destacado && <span className={styles.featured}>DESTACADO</span>}
                <button
                    type="button"
                    className={styles.favorite}
                    aria-label={`Agregar ${producto.nombre} a favoritos`}
                >
                    ♡
                </button>
                <img src={producto.imagen} alt={producto.nombre} />
            </div>

            {/* INFORMACIÓN DEL PRODUCTO */}
            <div className={styles.productInfo}>
                <h2>{producto.nombre}</h2>
                <p className={styles.details}>12 años · {producto.categoria}</p>

                <div className={styles.rating}>
                    <span>★★★★★</span>
                    <small>(245)</small>
                </div>

                <div className={styles.price}>
                    <strong>{producto.precio}</strong>
                    <del>{producto.precioAnterior}</del>
                </div>

                {producto.stock && <div className={styles.stock}>● En stock</div>}

                <button type="button" className={styles.addCart}>
                    🛒 AGREGAR AL CARRITO
                </button>
            </div>
        </article>
    )
}