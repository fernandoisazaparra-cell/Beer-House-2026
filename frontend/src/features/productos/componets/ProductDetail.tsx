import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/app/context/authUse';
import { useCart } from '@/app/context/cartUse';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { CatalogError, getCatalogProduct } from '../api/catalogApi';
import type { CatalogProduct } from '../catalog.types';
import styles from './ProductDetail.module.css';

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='%2314100b'/><text x='50%' y='50%' fill='%23a08355' font-size='16' text-anchor='middle'>Sin imagen</text></svg>";

// ======================================================
// DETALLE DE PRODUCTO (RF-020)
// RN-019: la advertencia legal es visible sin ninguna acción del usuario
// ======================================================
export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const productId = Number(id);
  const validId = Number.isInteger(productId);

  const [result, setResult] = useState<{
    id: number;
    product: CatalogProduct | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();

    getCatalogProduct(productId, controller.signal)
      .then((product) => setResult({ id: productId, product, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResult({
          id: productId,
          product: null,
          error: err instanceof CatalogError ? err.message : 'No se pudo cargar el producto.',
        });
      });

    return () => controller.abort();
  }, [productId, validId]);

  const answered = result?.id === productId;
  const loading = validId && !answered;
  const product = answered ? result.product : null;
  const error = !validId ? 'Producto no válido.' : answered ? result.error : null;

  const isAdminOrSupervisor = user?.rol === 'admin' || user?.rol === 'supervisor';

  if (loading) return <p className={styles.notice}>Cargando producto...</p>;

  if (error || !product) {
    return (
      <div className={styles.page}>
        <p className={styles.notice}>{error ?? 'Este producto no está disponible.'}</p>
        <Link to="/productos" className={styles.back}>← Volver al catálogo</Link>
      </div>
    );
  }

  const image = product.image_url || FALLBACK_IMAGE;

  const handleAddToCart = () => {
    addToCart({ id: String(product.id), name: product.name, price: product.price, imageUrl: image });
  };

  return (
    <div className={styles.page}>
      <Link to="/productos" className={styles.back}>← Volver al catálogo</Link>

      <div className={styles.layout}>
        <div className={styles.imageBox}>
          <img src={image} alt={product.name} />
        </div>

        <div className={styles.info}>
          <span className={styles.type}>{product.liquor_type}</span>
          <h1>{product.name}</h1>
          <p className={styles.price}>{formatCurrency(product.price)}</p>
          <p className={styles.stock}>{product.stock} unidades disponibles</p>

          {product.description && <p className={styles.description}>{product.description}</p>}

          {/* RN-019: visible siempre */}
          <div className={styles.legal} role="note">
            <strong>⚠ Advertencia legal</strong>
            <p>{product.legal_warning}</p>
          </div>

          {isAdminOrSupervisor ? (
            <button type="button" className={styles.addCart} disabled>Vista de Administrador</button>
          ) : (
            <button type="button" className={styles.addCart} onClick={handleAddToCart}>
              AGREGAR AL CARRITO
            </button>
          )}
        </div>
      </div>
    </div>
  );
};