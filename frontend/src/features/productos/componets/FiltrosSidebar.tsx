import styles from '../Products.module.css';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { CatalogTypeFacet } from '../catalog.types';

interface FiltrosSidebarProps {
  types: CatalogTypeFacet[];
  selectedTypes: string[];
  priceMin: number;
  priceMax: number;
  minInput: string;
  maxInput: string;
  onToggleType: (name: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onClear: () => void;
}

// ======================================================
// SIDEBAR DE FILTROS (RF-017): categorías reales + rango de precio
// ======================================================
export const FiltrosSidebar = ({
  types, selectedTypes, priceMin, priceMax,
  minInput, maxInput, onToggleType, onMinChange, onMaxChange, onClear,
}: FiltrosSidebarProps) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.filterHeader}>
        <h2>⚱ FILTROS</h2>
        <button type="button" onClick={onClear}>Limpiar todo</button>
      </div>

      {/* CATEGORÍAS */}
      <div className={styles.filterGroup}>
        <div className={styles.filterTitle}>CATEGORÍAS</div>
        {types.length === 0 && <small>Sin categorías</small>}
        {types.map((t) => (
          <label key={t.name}>
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.name)}
              onChange={() => onToggleType(t.name)}
            />{' '}
            {t.name} <small>{t.count}</small>
          </label>
        ))}
      </div>

      {/* RANGO DE PRECIO */}
      <div className={styles.filterGroup}>
        <div className={styles.filterTitle}>RANGO DE PRECIO</div>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={styles.numberInput}
          placeholder={`Mín. ${formatCurrency(priceMin)}`}
          value={minInput}
          onChange={(e) => onMinChange(e.target.value)}
          aria-label="Precio mínimo"
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={styles.numberInput}
          placeholder={`Máx. ${formatCurrency(priceMax)}`}
          value={maxInput}
          onChange={(e) => onMaxChange(e.target.value)}
          aria-label="Precio máximo"
        />
      </div>
    </aside>
  );
};