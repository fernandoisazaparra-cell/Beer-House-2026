import styles from '../Products.module.css';
import type { CatalogProduct } from '../catalog.types';
import { ProductCard } from './ProductCard';

interface ProductsGridProps {
  productos: CatalogProduct[];
  dimmed?: boolean;
}

export const ProductsGrid = ({ productos, dimmed = false }: ProductsGridProps) => {
  return (
    <div className={styles.productsGrid} style={{ opacity: dimmed ? 0.55 : 1, transition: 'opacity .2s' }}>
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} />
      ))}
    </div>
  );
};