import styles from '../Products.module.css';
import type { CatalogOrder } from '../catalog.types';

interface SearchOrderProps {
  search: string;
  order: CatalogOrder;
  onSearch: (value: string) => void;
  onOrder: (value: CatalogOrder) => void;
}

// ======================================================
// BUSCADOR (por nombre) Y ORDEN
// ======================================================
export const SearchOrder = ({ search, order, onSearch, onOrder }: SearchOrderProps) => {
  return (
    <div className={styles.topControls}>
      <div className={styles.searchBox}>
        <span>⌕</span>
        <input
          type="text"
          placeholder="Buscar productos por nombre..."
          value={search}
          maxLength={100}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className={styles.order}>
        <span>Ordenado por:</span>
        <select value={order} onChange={(e) => onOrder(e.target.value as CatalogOrder)}>
          <option value="recientes">Más recientes</option>
          <option value="menor">Precio menor</option>
          <option value="mayor">Precio mayor</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
      </div>
    </div>
  );
};