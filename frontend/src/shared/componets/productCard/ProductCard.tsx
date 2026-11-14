import styles from "./ProductCard.module.css";
import type { CatalogProduct } from '../../../features/productos/catalog.types';

interface ProductCardProps {
  producto: CatalogProduct;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
};

export const ProductCard = ({ producto }: ProductCardProps) => {
  const available = producto.stock > 0;
  const image = producto.image_url || "/images/product-placeholder.png";

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        <img
          src={image}
          alt={producto.name}
          className={styles.image}
          onError={(event) => {
            event.currentTarget.src = "/images/product-placeholder.png";
          }}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{producto.name}</h3>

        <p className={styles.details}>{producto.liquor_type}</p>

        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(producto.price)}</span>

          <span className={styles.stock}>
            {available ? "Disponible" : "Agotado"}
          </span>
        </div>

        <p className={styles.details}>{producto.description}</p>

        {producto.legal_warning && (
          <p className={styles.details}>{producto.legal_warning}</p>
        )}
      </div>
    </article>
  );
};
