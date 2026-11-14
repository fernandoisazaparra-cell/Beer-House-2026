import styles from '../Products.module.css';

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

// ======================================================
// PAGINACIÓN
// ======================================================
export const Pagination = ({ page, pages, onChange }: PaginationProps) => {
  if (pages <= 1) return null;

  // Ventana de hasta 5 páginas alrededor de la actual
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const numbers: number[] = [];
  for (let n = start; n <= end; n++) numbers.push(n);

  return (
    <nav className={styles.pagination} aria-label="Paginación del catálogo">
      <button type="button" className={styles.pageBtn} disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹ Anterior
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" className={styles.pageBtn} disabled={page === pages} onClick={() => onChange(page + 1)}>
        Siguiente ›
      </button>
    </nav>
  );
};