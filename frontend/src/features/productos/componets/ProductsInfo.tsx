import styles from '../Products.module.css';

interface ProductsInfoProps {
  from: number;
  to: number;
  total: number;
}

// ======================================================
// CONTADOR DE PRODUCTOS
// ======================================================
export const ProductsInfo = ({ from, to, total }: ProductsInfoProps) => {
  return (
    <div className={styles.productsInfo}>
      <span>
        {total === 0 ? 'Sin resultados' : `Mostrando ${from}-${to} de ${total} productos`}
      </span>
    </div>
  );
};