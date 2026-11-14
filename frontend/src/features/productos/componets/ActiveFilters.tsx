import styles from '../Products.module.css';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface ActiveFiltersProps {
  search: string;
  types: string[];
  minPrice: number | null;
  maxPrice: number | null;
  onRemoveType: (name: string) => void;
  onClearSearch: () => void;
  onClearPrice: () => void;
  onClearAll: () => void;
}

// ======================================================
// FILTROS ACTIVOS (solo se muestran los que el usuario aplicó)
// ======================================================
export const ActiveFilters = ({
  search, types, minPrice, maxPrice,
  onRemoveType, onClearSearch, onClearPrice, onClearAll,
}: ActiveFiltersProps) => {
  const hasPrice = minPrice !== null || maxPrice !== null;
  if (!search && types.length === 0 && !hasPrice) return null;

  const priceLabel =
    minPrice !== null && maxPrice !== null
      ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
      : minPrice !== null
        ? `desde ${formatCurrency(minPrice)}`
        : `hasta ${formatCurrency(maxPrice ?? 0)}`;

  return (
    <div className={styles.activeFilters}>
      {search && (
        <span>Búsqueda: {search}<button type="button" onClick={onClearSearch}>×</button></span>
      )}
      {types.map((t) => (
        <span key={t}>Categoría: {t}<button type="button" onClick={() => onRemoveType(t)}>×</button></span>
      ))}
      {hasPrice && (
        <span>Precio: {priceLabel}<button type="button" onClick={onClearPrice}>×</button></span>
      )}
      <button type="button" className={styles.clearFilters} onClick={onClearAll}>
        Limpiar filtros ⟳
      </button>
    </div>
  );
};