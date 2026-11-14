import { Link } from 'react-router-dom';
import { useAuth } from '@/app/context/authUse';
import { useCart } from '@/app/context/cartUse';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { CatalogProduct } from '../catalog.types';
import styles from '../Products.module.css';

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%2314100b'/><text x='50%' y='50%' fill='%23a08355' font-size='12' text-anchor='middle'>Sin imagen</text></svg>";

const LOW_STOCK = 5;

export const ProductCard = ({ producto }: { producto: CatalogProduct }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const isAdminOrSupervisor = user?.rol === 'admin' || user?.rol === 'supervisor';
  const image = producto.image_url || FALLBACK_IMAGE;
  const detailPath = `/productos/${producto.id}`;

  const handleAddToCart = () => {
    if (isAdminOrSupervisor) return;
    addToCart({
      id: String(producto.id),
      name: producto.name,
      price: producto.price,
      imageUrl: image,
    });
  };

  return (
    <div className={styles.productCard}>
      {/* IMAGEN Y ETIQUETAS */}
      <div className={styles.productImage}>
        <span className={styles.featured}>DESTACADO</span>
        <button type="button" className={styles.favorite} aria-label="Favorito">♡</button>
        <Link to={detailPath} aria-label={`Ver detalle de ${producto.name}`}>
          <img src={image} alt={producto.name} />
        </Link>
      </div>

      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className={styles.productInfo}>
        <h2>
          <Link to={detailPath} className={styles.cardLink}>{producto.name}</Link>
        </h2>
        <p className={styles.details}>{producto.liquor_type}</p>

        <div className={styles.rating}>
          <span>★★★★★</span>
          <small>(12)</small>
        </div>

        <div className={styles.price}>
          <strong>{formatCurrency(producto.price)}</strong>
        </div>
        <span className={styles.stock}>
          {producto.stock <= LOW_STOCK ? `Últimas ${producto.stock} unidades` : 'En stock'}
        </span>

        {/* BOTÓN RESTRINGIDO SEGÚN ROL */}
        {isAdminOrSupervisor ? (
          <button
            type="button"
            disabled
            className={styles.addCart}
            style={{
              background: 'linear-gradient(180deg, #1f1910 0%, #14100b 100%)',
              border: '1px solid #57401f',
              color: '#a08355',
              cursor: 'not-allowed',
              fontWeight: '600',
              fontSize: '8px',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            Vista de Administrador
          </button>
        ) : (
          <button type="button" onClick={handleAddToCart} className={styles.addCart}>
            AGREGAR AL CARRITO
          </button>
        )}
      </div>
    </div>
  );
};