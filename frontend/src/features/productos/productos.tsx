import styles from './Products.module.css';
import { useCatalog } from './hooks/useCatalog';
import { CATALOG_PER_PAGE } from './api/catalogApi';
import { ProductsHeader } from './componets/ProductsHeader';
import { FiltrosSidebar } from './componets/FiltrosSidebar';
import { SearchOrder } from './componets/SearchOrder';
import { ActiveFilters } from './componets/ActiveFilters';
import { ProductsInfo } from './componets/ProductsInfo';
import { ProductsGrid } from './componets/ProductsGrid';
import { Pagination } from './componets/Pagination';
import { ComboCard } from './componets/ComboCard';
import { useState, useEffect } from 'react';
import type { Combo } from './combos.types';

export const Products = () => {
  const c = useCatalog();
  const { data, loading, error, errorCode, filters } = c;

  // Estado para almacenar los combos obtenidos del backend
  const [combos, setCombos] = useState<Combo[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/products/combos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCombos(data);
        }
      })
      .catch((err) => console.error('Error al cargar los combos:', err));
  }, []);

  // RF-021 / RN-020: el backend exige edad confirmada
  if (errorCode === 'age_not_confirmed') {
    return (
      <div className={styles.productsPage}>
        <p className={styles.errorBox}>
          {error} Cierra sesión e inicia nuevamente para confirmar tus términos y tu edad.
        </p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = (data?.total ?? 0) + combos.length;
  const from = total === 0 ? 0 : (filters.page - 1) * CATALOG_PER_PAGE + 1;
  const to = from + items.length - 1;

  return (
    <div className={styles.productsPage}>
      <ProductsHeader />

      <main className={styles.catalog}>
        <FiltrosSidebar
          types={data?.filters.types ?? []}
          selectedTypes={filters.types}
          priceMin={data?.filters.price_min ?? 0}
          priceMax={data?.filters.price_max ?? 0}
          minInput={c.minInput}
          maxInput={c.maxInput}
          onToggleType={c.toggleType}
          onMinChange={c.setMinInput}
          onMaxChange={c.setMaxInput}
          onClear={c.clearAll}
        />

        <div className={styles.productsArea}>
          <SearchOrder
            search={c.searchInput}
            order={filters.order}
            onSearch={c.setSearchInput}
            onOrder={c.setOrder}
          />

          <ActiveFilters
            search={filters.search}
            types={filters.types}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onRemoveType={c.toggleType}
            onClearSearch={c.clearSearch}
            onClearPrice={c.clearPrice}
            onClearAll={c.clearAll}
          />

          <ProductsInfo from={from} to={to} total={total} />

          {loading && !data && <p className={styles.emptyState}>Cargando productos...</p>}
          {error && <p className={styles.errorBox}>{error}</p>}

          {/* Renderizar dinámicamente los combos creados desde la BD */}
          {!error && combos.map((combo) => (
            <div key={combo.id} style={{ marginBottom: '20px' }}>
              <ComboCard combo={combo} />
            </div>
          ))}

          {!error && items.length > 0 && <ProductsGrid productos={items} dimmed={loading} />}

          <Pagination page={filters.page} pages={data?.pages ?? 1} onChange={c.setPage} />
        </div>
      </main>
    </div>
  );
};