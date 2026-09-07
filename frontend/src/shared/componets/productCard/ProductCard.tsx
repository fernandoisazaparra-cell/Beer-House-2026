import styles from './ProductCard.module.css';

interface ProductCardProps {
    id: number;
    name: string;
    image: string;
    category: string;
    age?: string;
    rating?: number;
    reviews?: number;
    oldPrice?: number;
    price: string;
    featured?: boolean;
    inStock?: boolean;
    onAddToCart?: () => void;
}

export const ProductCard = ({
    name,
    image,
    category,
    age,
    rating = 5,
    reviews = 0,
    oldPrice,
    price,
    featured = true,
    inStock = true,
    onAddToCart
}: ProductCardProps) => {
    return (
        <article className={styles.card}>
            
            <div className={styles.imageContainer}>
                
                {featured && (
                    <span className={styles.featured}>
                        DESTACADO
                    </span>
                )}

                <button
                    className={styles.favorite}
                    aria-label={`Agregar ${name} a favoritos`}
                >
                    ♡
                </button>

                <img
                    src={image}
                    alt={name}
                    className={styles.image}
                />
            </div>


            <div className={styles.content}>

                <h3 className={styles.name}>
                    {name}
                </h3>


                <p className={styles.details}>
                    {age && `${age} años · `}
                    {category}
                </p>


                <div className={styles.rating}>
                    <span className={styles.stars}>
                        {'★'.repeat(rating)}
                    </span>

                    <span className={styles.reviews}>
                        ({reviews})
                    </span>
                </div>


                {oldPrice && (
                    <span className={styles.oldPrice}>
                        {oldPrice}
                    </span>
                )}


                <div className={styles.priceRow}>

                    <span className={styles.price}>
                        {price}
                    </span>

                    <span className={styles.stock}>
                        {inStock ? 'En stock' : 'Agotado'}
                    </span>

                </div>


                <button
                    className={styles.addToCart}
                    onClick={onAddToCart}
                    disabled={!inStock}
                >
                    🛒 AGREGAR AL CARRITO
                </button>

            </div>

        </article>
    );
};